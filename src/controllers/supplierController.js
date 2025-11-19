// src/controllers/supplierController.js
const Joi = require('joi');
const Supplier = require('../models/Supplier');
const mongoose = require('mongoose');

const createSupplier = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().allow('', null),
    email: Joi.string().email().allow('', null),
    address: Joi.string().allow('', null),
    area: Joi.string().allow('', null),
    cnic: Joi.string().allow('', null),
    licenseNo: Joi.string().allow('', null),
    supplierNo: Joi.string().allow('', null),
    openingBalance: Joi.number().min(0).default(0)
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const s = await Supplier.create({
    name: value.name,
    phone: value.phone,
    email: value.email,
    address: value.address,
    area: value.area,
    cnic: value.cnic,
    licenseNo: value.licenseNo,
    supplierNo: value.supplierNo,
    runningBalance: value.openingBalance,
    ledger: value.openingBalance ? [{ type: 'opening', amount: value.openingBalance, date: new Date(), note: 'Opening balance' }] : []
  });

  res.status(201).json(s);
};

const getSuppliers = async (req, res) => {
  let { page = 1, limit = 1000, q } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  const filter = {};
  if (q) filter.name = { $regex: q, $options: 'i' };

  const total = await Supplier.countDocuments(filter);
  const suppliers = await Supplier.find(filter)
    .select('name phone email address area cnic licenseNo supplierNo runningBalance')
    .skip((page-1)*limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Map runningBalance to balance for frontend compatibility
  const suppliersWithBalance = suppliers.map(s => ({
    ...s.toObject(),
    balance: s.runningBalance
  }));

  res.json({
    meta: { total, page, limit, pages: Math.ceil(total/limit) },
    data: { suppliers: suppliersWithBalance }
  });
};

const getSupplier = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
  const s = await Supplier.findById(id);
  if (!s) return res.status(404).json({ message: 'Supplier not found' });
  res.json(s);
};

const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const schema = Joi.object({
    name: Joi.string().optional(),
    phone: Joi.string().allow('', null).optional(),
    email: Joi.string().email().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    area: Joi.string().allow('', null).optional(),
    cnic: Joi.string().allow('', null).optional(),
    licenseNo: Joi.string().allow('', null).optional(),
    supplierNo: Joi.string().allow('', null).optional()
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const s = await Supplier.findByIdAndUpdate(id, value, { new: true });
  if (!s) return res.status(404).json({ message: 'Supplier not found' });
  res.json(s);
};

const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  const s = await Supplier.findByIdAndDelete(id);
  if (!s) return res.status(404).json({ message: 'Supplier not found' });
  res.json({ message: 'Supplier deleted' });
};

const getSupplierLedger = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid supplier id' });
  }
  const supplier = await Supplier.findById(id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

  res.json({
    supplierId: supplier._id,
    supplierName: supplier.name,
    runningBalance: supplier.runningBalance,
    ledger: supplier.ledger
  });
};

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierLedger
};
