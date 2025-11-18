const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

/**
 * GET /reports/profit
 * Returns overall profit report with optional date filtering
 * Query params: from, to (date strings)
 */
const getProfitReport = async (req, res) => {
  const { from, to } = req.query;
  const matchDate = {};
  if (from) matchDate.$gte = new Date(from);
  if (to) matchDate.$lte = new Date(to);

  const pipeline = [
    ...(from || to ? [{ $match: { date: matchDate } }] : []),
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$netTotal' },
        totalProfit: { $sum: '$totalProfit' },
        totalDiscount: { $sum: '$discountAmount' },
        totalTransactions: { $sum: 1 }
      }
    }
  ];

  const result = await Sale.aggregate(pipeline);
  const data = result.length > 0 ? result[0] : {
    totalSales: 0,
    totalProfit: 0,
    totalDiscount: 0,
    totalTransactions: 0
  };

  res.json({ data });
};

/**
 * GET /reports/category
 * Returns sales and profit grouped by category
 * Query params: from, to (date strings)
 */
const getCategoryReport = async (req, res) => {
  const { from, to } = req.query;
  const matchDate = {};
  if (from) matchDate.$gte = new Date(from);
  if (to) matchDate.$lte = new Date(to);

  const pipeline = [
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productDoc'
      }
    },
    { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'categories',
        localField: 'productDoc.category',
        foreignField: '_id',
        as: 'categoryDoc'
      }
    },
    { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
    ...(from || to ? [{ $match: { date: matchDate } }] : []),
    {
      $group: {
        _id: { categoryId: '$categoryDoc._id', categoryName: '$categoryDoc.name' },
        totalQty: { $sum: '$items.qty' },
        totalSales: { $sum: { $multiply: ['$items.unitPrice', '$items.qty'] } },
        totalProfit: { $sum: '$items.totalProfit' }
      }
    },
    {
      $project: {
        _id: 0,
        categoryId: '$_id.categoryId',
        categoryName: '$_id.categoryName',
        totalQty: 1,
        totalSales: 1,
        totalProfit: 1
      }
    },
    { $sort: { totalSales: -1 } }
  ];

  const result = await Sale.aggregate(pipeline);
  res.json({ data: result });
};

/**
 * GET /reports/stock
 * Returns current stock levels for all products
 * Query params: lowStock (boolean) - filter products with stock below a threshold
 */
const getStockReport = async (req, res) => {
  const { lowStock, threshold = 10 } = req.query;
  const filter = {};
  
  if (lowStock === 'true') {
    filter.stock = { $lte: parseInt(threshold, 10) };
  }

  const products = await Product.find(filter)
    .populate('category')
    .select('name sku category stock costPrice sellingPrice')
    .sort({ stock: 1 });

  const data = products.map(p => ({
    productId: p._id,
    name: p.name,
    sku: p.sku,
    category: p.category?.name || 'N/A',
    stock: p.stock,
    costPrice: p.costPrice,
    sellingPrice: p.sellingPrice,
    stockValue: p.stock * p.costPrice
  }));

  res.json({ data });
};

/**
 * GET /reports/outstanding-customers
 * Returns customers with outstanding balances (runningBalance > 0)
 */
const getOutstandingCustomers = async (req, res) => {
  const customers = await Customer.find({ runningBalance: { $gt: 0 } })
    .select('name phone address creditLimit runningBalance status')
    .sort({ runningBalance: -1 });

  const data = customers.map(c => ({
    customerId: c._id,
    name: c.name,
    phone: c.phone,
    address: c.address,
    creditLimit: c.creditLimit,
    outstandingBalance: c.runningBalance,
    status: c.status
  }));

  res.json({ data, total: data.length });
};

/**
 * GET /reports/outstanding-suppliers
 * Returns suppliers with outstanding balances (runningBalance > 0)
 */
const getOutstandingSuppliers = async (req, res) => {
  const suppliers = await Supplier.find({ runningBalance: { $gt: 0 } })
    .select('name phone address runningBalance')
    .sort({ runningBalance: -1 });

  const data = suppliers.map(s => ({
    supplierId: s._id,
    name: s.name,
    phone: s.phone,
    address: s.address,
    outstandingBalance: s.runningBalance
  }));

  res.json({ data, total: data.length });
};

module.exports = {
  getProfitReport,
  getCategoryReport,
  getStockReport,
  getOutstandingCustomers,
  getOutstandingSuppliers
};

