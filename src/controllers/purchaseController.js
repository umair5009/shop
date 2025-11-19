// src/controllers/purchaseController.js
const Joi = require('joi');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Helper function to generate invoice number
const generateInvoiceNumber = async () => {
  const count = await Purchase.countDocuments();
  return `PINV-${String(count + 1).padStart(6, '0')}`;
};

// Helper function to convert number to words
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convertHundreds = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '');
  };

  const convertThousands = (n) => {
    if (n < 1000) return convertHundreds(n);
    return convertHundreds(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertHundreds(n % 1000) : '');
  };

  const convertLakhs = (n) => {
    if (n < 100000) return convertThousands(n);
    return convertHundreds(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertThousands(n % 100000) : '');
  };

  return convertLakhs(Math.floor(num)) + ' Only';
};

const createPurchase = async (req, res) => {
  const itemSchema = Joi.object({
    product: Joi.string().allow('', null).optional(),
    productName: Joi.string().required(),
    tradePrice: Joi.number().min(0).required(),
    qty: Joi.number().min(0).required(),
    bonus: Joi.number().min(0).default(0),
    ctn: Joi.number().min(0).default(0),
    pcs: Joi.number().min(0).default(0),
    kg: Joi.number().min(0).default(0),
    discPercent: Joi.number().min(0).max(100).default(0),
    sTax: Joi.number().min(0).default(0),
    scheme: Joi.number().min(0).default(0),
    less: Joi.number().min(0).default(0),
    netAmount: Joi.number().required()
  });

  const schema = Joi.object({
    // Invoice Info
    invoiceDate: Joi.date().default(Date.now),
    dueDate: Joi.date().allow('', null).optional(),
    orderNo: Joi.string().allow('', null).optional(),
    pageNo: Joi.string().default('1 of 1'),

    // Supplier/Customer Info
    supplier: Joi.string().allow('', null).optional(),
    customerNo: Joi.string().allow('', null).optional(),
    customerShopName: Joi.string().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    phone: Joi.string().allow('', null).optional(),
    area: Joi.string().allow('', null).optional(),
    deliveredBy: Joi.string().allow('', null).optional(),
    bookedBy: Joi.string().allow('', null).optional(),
    licenseNo: Joi.string().allow('', null).optional(),
    cnic: Joi.string().allow('', null).optional(),
    licenseExpiry: Joi.string().allow('', null).optional(),
    ntn: Joi.string().allow('', null).optional(),

    // Items
    items: Joi.array().items(itemSchema).min(1).required(),

    // Payment
    cashReceived: Joi.number().min(0).default(0),
    previousBalance: Joi.number().default(0),

    // Additional
    remarks: Joi.string().allow('', null).optional(),
    checkedBy: Joi.string().allow('', null).optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  // Get supplier if provided
  let supplier = null;
  if (value.supplier && mongoose.Types.ObjectId.isValid(value.supplier)) {
    supplier = await Supplier.findById(value.supplier);
    if (supplier) {
      value.previousBalance = supplier.runningBalance || 0;
    }
  }

  // Calculate totals
  const noOfItems = value.items.length;
  const gross = value.items.reduce((sum, item) => sum + item.netAmount, 0);
  const grandTotal = gross;
  const netBalance = value.previousBalance + grandTotal - value.cashReceived;
  const amountInWords = numberToWords(grandTotal);

  // Generate invoice number
  const invoiceNo = await generateInvoiceNumber();

  // Create purchase
  const purchase = await Purchase.create({
    invoiceNo,
    invoiceDate: value.invoiceDate,
    dueDate: value.dueDate,
    orderNo: value.orderNo,
    pageNo: value.pageNo,
    supplier: value.supplier || null,
    customerNo: value.customerNo,
    customerShopName: value.customerShopName,
    address: value.address,
    phone: value.phone,
    area: value.area,
    deliveredBy: value.deliveredBy,
    bookedBy: value.bookedBy,
    licenseNo: value.licenseNo,
    cnic: value.cnic,
    licenseExpiry: value.licenseExpiry,
    ntn: value.ntn,
    items: value.items,
    noOfItems,
    gross,
    grandTotal,
    amountInWords,
    cashReceived: value.cashReceived,
    previousBalance: value.previousBalance,
    netBalance,
    remarks: value.remarks,
    checkedBy: value.checkedBy
  });

  // Update product stock for each item
  for (const item of value.items) {
    if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.qty },
        $push: {
          stockLedger: {
            type: 'in',
            qty: item.qty,
            note: `Purchase - ${invoiceNo}`,
            referenceId: purchase._id
          }
        },
        $set: { costPrice: item.tradePrice }
      });
    }
  }

  // Update supplier balance
  if (supplier) {
    supplier.runningBalance = netBalance;
    supplier.ledger.push({
      type: 'purchase',
      amount: grandTotal,
      date: new Date(),
      note: `Purchase Invoice - ${invoiceNo}`,
      referenceId: purchase._id
    });
    if (value.cashReceived > 0) {
      supplier.ledger.push({
        type: 'payment',
        amount: -value.cashReceived,
        date: new Date(),
        note: `Payment for ${invoiceNo}`,
        referenceId: purchase._id
      });
    }
    await supplier.save();
  }

  const populatedPurchase = await Purchase.findById(purchase._id).populate('supplier');
  res.status(201).json(populatedPurchase);
};

const getPurchases = async (req, res) => {
  let { page = 1, limit = 1000 } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const total = await Purchase.countDocuments();
  const purchases = await Purchase.find()
    .populate('supplier', 'name phone')
    .sort({ createdAt: -1 })
    .skip((page-1)*limit)
    .limit(limit);

  res.json({
    meta: { total, page, limit, pages: Math.ceil(total/limit) },
    data: { purchases }
  });
};

const getPurchase = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  const purchase = await Purchase.findById(id).populate('supplier');
  if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
  res.json(purchase);
};

const purchaseReportByProduct = async (req, res) => {
  // returns total purchased quantity & cost grouped by product
  const { from, to } = req.query;
  const match = {};
  if (from) match.$gte = new Date(from);
  if (to) match.$lte = new Date(to);

  const pipeline = [
    { $unwind: '$items' },
    ...(from || to ? [{ $match: { date: match } }] : []),
    { $group: {
      _id: '$items.product',
      totalQty: { $sum: '$items.qty' },
      totalCost: { $sum: { $multiply: [ '$items.qty', '$items.costPrice' ] } }
    }},
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    { $project: {
      productId: '$_id',
      productName: '$product.name',
      totalQty: 1,
      totalCost: 1
    }},
    { $sort: { totalCost: -1 } }
  ];

  const result = await Purchase.aggregate(pipeline);
  res.json({ data: result });
};

module.exports = {
  createPurchase,
  getPurchases,
  getPurchase,
  purchaseReportByProduct
};
