// src/controllers/purchaseController.js
const Joi = require('joi');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const createPurchase = async (req, res) => {
  const schema = Joi.object({
    supplier: Joi.string().required(),
    product: Joi.string().required(),
    quantity: Joi.number().min(1).required(),
    costPrice: Joi.number().min(0).required(),
    totalAmount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().valid('cash', 'card', 'upi', 'credit').default('cash'),
    amountPaid: Joi.number().min(0).default(0)
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  // Validate supplier
  if (!mongoose.Types.ObjectId.isValid(value.supplier)) {
    return res.status(400).json({ message: 'Invalid supplier id' });
  }
  const supplier = await Supplier.findById(value.supplier);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

  // Validate product
  if (!mongoose.Types.ObjectId.isValid(value.product)) {
    return res.status(400).json({ message: 'Invalid product id' });
  }
  const product = await Product.findById(value.product);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  // Create purchase
  const purchase = await Purchase.create({
    supplier: value.supplier,
    product: value.product,
    quantity: value.quantity,
    costPrice: value.costPrice,
    totalAmount: value.totalAmount,
    paymentMethod: value.paymentMethod,
    amountPaid: value.amountPaid
  });

  // Update product stock and cost price
  await Product.findByIdAndUpdate(value.product, {
    $inc: { stock: value.quantity },
    $push: {
      stockLedger: {
        type: 'in',
        qty: value.quantity,
        note: 'purchase',
        referenceId: purchase._id
      }
    },
    $set: { costPrice: value.costPrice }
  });

  // Update supplier balance if credit
  if (value.paymentMethod === 'credit' || value.amountPaid < value.totalAmount) {
    const balance = value.totalAmount - value.amountPaid;
    await Supplier.findByIdAndUpdate(value.supplier, {
      $inc: { runningBalance: balance },
      $push: {
        ledger: {
          type: 'purchase',
          amount: balance,
          date: new Date(),
          note: `Purchase - ${product.name}`,
          referenceId: purchase._id
        }
      }
    });
  }

  const populatedPurchase = await Purchase.findById(purchase._id)
    .populate('supplier')
    .populate('product');

  res.status(201).json(populatedPurchase);
};

const getPurchases = async (req, res) => {
  let { page = 1, limit = 1000 } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const total = await Purchase.countDocuments();
  const purchases = await Purchase.find()
    .populate('supplier', 'name phone')
    .populate('product', 'name sku')
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
  const purchase = await Purchase.findById(id)
    .populate('supplier')
    .populate('product');
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
