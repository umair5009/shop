const Joi = require('joi');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const generateInvoiceNumber = require('../utils/invoice');
const mongoose = require('mongoose');

/**
 * Helper function to format sale data for printing
 * Groups items by category dynamically
 */
const formatSaleForPrint = async (sale) => {
  // Populate if not already populated
  if (!sale.populated('customer')) {
    await sale.populate('customer');
  }
  if (!sale.populated('items.product')) {
    await sale.populate('items.product');
  }

  // Group items by category dynamically
  const categorizedItems = {};

  for (const item of sale.items) {
    if (item.product && item.product.category) {
      await item.product.populate('category');
      const categoryName = item.product.category?.name || 'Uncategorized';

      if (!categorizedItems[categoryName]) {
        categorizedItems[categoryName] = [];
      }

      categorizedItems[categoryName].push({
        name: item.name,
        qty: item.qty, // Total pieces
        qtyInUnits: item.qtyInUnits || 0,
        unit: item.unit || 'PCS',
        pcsPerUnit: item.pcsPerUnit || 1,
        unitPrice: item.unitPrice,
        lineTotal: item.qty * item.unitPrice
      });
    } else {
      // Handle items without category
      if (!categorizedItems['Uncategorized']) {
        categorizedItems['Uncategorized'] = [];
      }
      categorizedItems['Uncategorized'].push({
        name: item.name,
        qty: item.qty, // Total pieces
        qtyInUnits: item.qtyInUnits || 0,
        unit: item.unit || 'PCS',
        pcsPerUnit: item.pcsPerUnit || 1,
        unitPrice: item.unitPrice,
        lineTotal: item.qty * item.unitPrice
      });
    }
  }

  return {
    invoiceNumber: sale.invoiceNumber,
    date: sale.date,
    customer: sale.customer ? {
      name: sale.customer.name,
      phone: sale.customer.phone,
      address: sale.customer.address
    } : null,
    categorizedItems,
    items: sale.items,
    grossTotal: sale.grossTotal,
    discountAmount: sale.discountAmount,
    netTotal: sale.netTotal,
    amountPaid: sale.amountPaid || 0,
    balance: (sale.netTotal - (sale.amountPaid || 0)),
    previousBalance: sale.previousBalance,
    newBalance: sale.newBalance,
    isCredit: sale.isCredit,
    totalProfit: sale.totalProfit,
    paymentMethod: sale.paymentMethod || 'cash',

    // Invoice metadata fields
    customerNo: sale.customerNo,
    area: sale.area,
    deliveredBy: sale.deliveredBy,
    deliveredByNo: sale.deliveredByNo,
    bookedBy: sale.bookedBy,
    orderByNo: sale.orderByNo,
    licenseNo: sale.licenseNo,
    cnic: sale.cnic,
    orderNo: sale.orderNo,
    dueDate: sale.dueDate
  };
};

const createSale = async (req, res) => {
  /**
   payload example:
   {
     customerId: "...", // optional for cash sale
     items: [{ productId, qty, unitPrice }], // unitPrice = selling price used
     discountAmount: 50, // optional fixed discount
     isCredit: true/false
   }
  */

  const schema = Joi.object({
    customerId: Joi.string().allow(null, ''),
    items: Joi.array().items(Joi.object({
      productId: Joi.string().required(),
      qty: Joi.number().min(1).required(), // Total pieces
      qtyInUnits: Joi.number().min(0).optional(), // Quantity in product's unit
      unit: Joi.string().allow('').optional(), // Unit type
      pcsPerUnit: Joi.number().min(1).optional(), // Pieces per unit
      unitPrice: Joi.number().min(0).required()
    })).min(1).required(),
    discountAmount: Joi.number().min(0).default(0),
    amountPaid: Joi.number().min(0).default(0),
    paymentMethod: Joi.string().valid('cash', 'card', 'upi', 'credit').default('cash'),
    isCredit: Joi.boolean().default(false),

    // Invoice metadata fields
    customerNo: Joi.string().allow(''),
    area: Joi.string().allow(''),
    deliveredBy: Joi.string().allow(''),
    deliveredByNo: Joi.number().allow(null, ''),
    bookedBy: Joi.string().allow(''),
    orderByNo: Joi.number().allow(null, ''),
    licenseNo: Joi.string().allow(''),
    cnic: Joi.string().allow(''),
    orderNo: Joi.string().allow(''),
    dueDate: Joi.date().allow(null, '')
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  // fetch customer if credit sale
  let customer = null;
  if (value.customerId) {
    customer = await Customer.findById(value.customerId);
    if (!customer) return res.status(400).json({ message: 'Customer not found' });
    if (customer.status === 'locked') return res.status(400).json({ message: 'Customer is locked due to credit limit' });
  }

  // compute items, check stock
  let grossTotal = 0;
  let totalProfit = 0;
  const itemsDetailed = [];

  for (const it of value.items) {
    const product = await Product.findById(it.productId);
    if (!product) return res.status(400).json({ message: `Product not found: ${it.productId}` });
    if (product.stock < it.qty) {
      return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
    }
    const costPrice = product.costPrice;
    const sellingPrice = it.unitPrice;
    const profitPerItem = (sellingPrice - costPrice);
    const itemProfitTotal = profitPerItem * it.qty;
    grossTotal += sellingPrice * it.qty;
    totalProfit += itemProfitTotal;

    itemsDetailed.push({
      product: product._id,
      name: product.name,
      qty: it.qty, // Total pieces
      qtyInUnits: it.qtyInUnits || 0,
      unit: it.unit || product.unit || 'PCS',
      pcsPerUnit: it.pcsPerUnit || product.pcsPerUnit || 1,
      unitPrice: sellingPrice,
      costPrice,
      profitPerItem,
      totalProfit: itemProfitTotal
    });
  }

  const netTotal = grossTotal - (value.discountAmount || 0);
  const amountPaid = value.amountPaid || 0;
  const currentBillBalance = netTotal - amountPaid; // Balance for this bill only

  // handle customer balance
  const previousBalance = customer ? customer.runningBalance : 0;
  // New balance = previous balance + current bill balance (what's still owed from this transaction)
  const newBalance = customer ? (previousBalance + currentBillBalance) : 0;

  // check credit limit
  if (customer && customer.creditLimit > 0) {
    if (newBalance > customer.creditLimit) {
      // lock customer
      customer.status = 'locked';
      await customer.save();
      return res.status(400).json({ message: 'Credit limit exceeded. Customer locked.' });
    }
  }

  // reduce stock and add stock ledger
  for (const it of itemsDetailed) {
    await Product.findByIdAndUpdate(it.product, {
      $inc: { stock: -it.qty },
      $push: { stockLedger: { type: 'out', qty: it.qty, note: 'sale' } }
    });
  }

  // create sale
  const invoiceNumber = await generateInvoiceNumber();
  const sale = await Sale.create({
    invoiceNumber,
    customer: customer ? customer._id : null,
    items: itemsDetailed,
    discountAmount: value.discountAmount,
    grossTotal,
    netTotal,
    totalProfit,
    amountPaid: value.amountPaid || 0,
    paymentMethod: value.paymentMethod || 'cash',
    previousBalance,
    newBalance,
    isCredit: value.isCredit,

    // Invoice metadata fields
    customerNo: value.customerNo,
    area: value.area,
    deliveredBy: value.deliveredBy,
    deliveredByNo: value.deliveredByNo,
    bookedBy: value.bookedBy,
    orderByNo: value.orderByNo,
    licenseNo: value.licenseNo,
    cnic: value.cnic,
    orderNo: value.orderNo,
    dueDate: value.dueDate
  });

  // update customer ledger & running balance
  if (customer) {
    customer.runningBalance = newBalance;

    // Add invoice to ledger
    customer.ledger.push({
      type: 'invoice',
      amount: netTotal,
      reference: invoiceNumber,
      date: new Date(),
      note: value.isCredit ? 'Credit sale' : 'Sale'
    });

    // If payment was made, add payment entry
    if (amountPaid > 0) {
      customer.ledger.push({
        type: 'payment',
        amount: -amountPaid, // Negative because it reduces balance
        reference: invoiceNumber,
        date: new Date(),
        note: `Payment for ${invoiceNumber}`
      });
    }

    await customer.save();
  }

  // Populate sale for printing
  const populatedSale = await Sale.findById(sale._id).populate('customer').populate('items.product');
  const printData = await formatSaleForPrint(populatedSale);

  res.json({
    sale: populatedSale,
    printData // Formatted data ready for printing
  });
};

const getSales = async (req, res) => {
  let { page = 1, limit = 20, customerId, from, to } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const filter = {};
  if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
    filter.customer = customerId;
  }
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const total = await Sale.countDocuments(filter);
  const sales = await Sale.find(filter)
    .populate('customer')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ meta: { total, page, limit, pages: Math.ceil(total / limit) }, data: { sales } });
};

const getSale = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid sale id' });
  }
  const sale = await Sale.findById(id).populate('customer').populate('items.product');
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  res.json(sale);
};

const reprintSale = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid sale id' });
  }
  const sale = await Sale.findById(id).populate('customer').populate('items.product');
  if (!sale) return res.status(404).json({ message: 'Sale not found' });

  // Format sale data for printing with dynamic categories
  const printData = await formatSaleForPrint(sale);

  res.json({
    message: 'Sale invoice ready for reprint',
    sale: sale,
    printData // Formatted data ready for printing with categorized items
  });
};

/**
 * Get formatted bill/invoice for a sale
 * This endpoint returns only the print-ready formatted data
 */
const getSaleBill = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid sale id' });
  }
  const sale = await Sale.findById(id).populate('customer').populate('items.product');
  if (!sale) return res.status(404).json({ message: 'Sale not found' });

  const printData = await formatSaleForPrint(sale);
  res.json(printData);
};

module.exports = { createSale, getSales, getSale, reprintSale, getSaleBill };
