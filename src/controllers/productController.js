const Joi = require('joi');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const createProduct = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    sku: Joi.string().allow('', null).optional(),
    barcode: Joi.string().allow('', null).optional(),
    category: Joi.string().required(),
    unit: Joi.string().allow('', null).optional(),
    costPrice: Joi.number().required(),
    sellingPrice: Joi.number().required(),
    stock: Joi.number().default(0),
    minStock: Joi.number().default(0)
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const p = await Product.create({
    name: value.name,
    sku: value.sku,
    barcode: value.barcode,
    category: value.category,
    unit: value.unit,
    costPrice: value.costPrice,
    sellingPrice: value.sellingPrice,
    stock: value.stock || 0,
    minStock: value.minStock || 0,
    stockLedger: value.stock ? [{ type: 'in', qty: value.stock, note: 'opening' }] : []
  });

  res.json(p);
};

const getProducts = async (req, res) => {
  let { page = 1, limit = 1000, q } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const filter = {};
  if (q) filter.name = { $regex: q, $options: 'i' };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('category')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
    data: { products }
  });
};

const getProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid product id' });
  }
  const product = await Product.findById(id).populate('category');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid product id' });
  }

  const schema = Joi.object({
    name: Joi.string().optional(),
    sku: Joi.string().allow('', null).optional(),
    barcode: Joi.string().allow('', null).optional(),
    category: Joi.string().optional(),
    unit: Joi.string().allow('', null).optional(),
    costPrice: Joi.number().optional(),
    sellingPrice: Joi.number().optional(),
    stock: Joi.number().optional(),
    minStock: Joi.number().optional()
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const product = await Product.findByIdAndUpdate(id, value, { new: true }).populate('category');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid product id' });
  }
  const product = await Product.findByIdAndDelete(id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product deleted successfully' });
};

module.exports = { createProduct, getProducts, getProduct, updateProduct, deleteProduct };
