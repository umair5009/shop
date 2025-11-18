// src/controllers/categoryController.js
const Joi = require('joi');
const Category = require('../models/Category');
const Sale = require('../models/Sale');
const mongoose = require('mongoose');

const createCategory = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('', null)
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const exists = await Category.findOne({ name: value.name });
  if (exists) return res.status(400).json({ message: 'Category already exists' });

  const cat = await Category.create(value);
  res.status(201).json(cat);
};

const getCategories = async (req, res) => {
  // pagination & optional search
  let { page = 1, limit = 20, q } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  const filter = {};
  if (q) {
    filter.name = { $regex: q, $options: 'i' };
  }

  const total = await Category.countDocuments(filter);
  const categories = await Category.find(filter)
    .skip((page-1)*limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({ meta: { total, page, limit, pages: Math.ceil(total/limit) }, data: { categories } });
};

const getCategory = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
  const cat = await Category.findById(id);
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  res.json(cat);
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const schema = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().allow('', null).optional()
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const cat = await Category.findByIdAndUpdate(id, value, { new: true });
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  res.json(cat);
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const cat = await Category.findByIdAndDelete(id);
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  res.json({ message: 'Category deleted' });
};

/**
 * Category report: returns aggregated sales & profit grouped by category
 * GET /api/categories/report/sales-profit?from=2025-01-01&to=2025-11-01
 */
const categorySalesProfitReport = async (req, res) => {
  const { from, to } = req.query;
  const matchDate = {};
  if (from) matchDate.$gte = new Date(from);
  if (to) matchDate.$lte = new Date(to);

  // Aggregation:
  // - unwind sale items
  // - lookup product to get category
  // - lookup category and group by category
  const pipeline = [
    { $unwind: '$items' },
    // join product to get category id
    { $lookup: {
      from: 'products',
      localField: 'items.product',
      foreignField: '_id',
      as: 'productDoc'
    }},
    { $unwind: '$productDoc' },
    { $lookup: {
      from: 'categories',
      localField: 'productDoc.category',
      foreignField: '_id',
      as: 'categoryDoc'
    }},
    { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
    // optional date filter
    ...(from || to ? [{ $match: { date: matchDate } }] : []),
    { $group: {
      _id: { categoryId: '$categoryDoc._id', categoryName: '$categoryDoc.name' },
      totalQty: { $sum: '$items.qty' },
      totalSales: { $sum: { $multiply: [ '$items.unitPrice', '$items.qty' ] } },
      totalProfit: { $sum: '$items.totalProfit' },
    }},
    { $project: {
      _id: 0,
      categoryId: '$_id.categoryId',
      categoryName: '$_id.categoryName',
      totalQty: 1,
      totalSales: 1,
      totalProfit: 1
    }},
    { $sort: { totalSales: -1 } }
  ];

  const result = await Sale.aggregate(pipeline);
  res.json({ data: result });
};

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  categorySalesProfitReport
};
