const Joi = require('joi');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');

const createCustomer = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().allow('', null).optional(),
    email: Joi.string().email().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    area: Joi.string().allow('', null).optional(),
    cnic: Joi.string().allow('', null).optional(),
    licenseNo: Joi.string().allow('', null).optional(),
    customerNo: Joi.string().allow('', null).optional()
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const c = await Customer.create({
    name: value.name,
    phone: value.phone,
    email: value.email,
    address: value.address,
    area: value.area,
    cnic: value.cnic,
    licenseNo: value.licenseNo,
    customerNo: value.customerNo
  });
  res.json(c);
};

const getCustomers = async (req, res) => {
  let { page = 1, limit = 1000, q } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const filter = {};
  if (q) filter.name = { $regex: q, $options: 'i' };

  const total = await Customer.countDocuments(filter);
  const customers = await Customer.find(filter)
    .select('name phone email address area cnic licenseNo customerNo runningBalance status')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Map runningBalance to balance for frontend compatibility
  const customersWithBalance = customers.map(c => ({
    ...c.toObject(),
    balance: c.runningBalance
  }));

  res.json({
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
    data: { customers: customersWithBalance }
  });
};

const getCustomer = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid customer id' });
  }
  const customer = await Customer.findById(id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
};

const updateCustomer = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid customer id' });
  }

  const schema = Joi.object({
    name: Joi.string().optional(),
    phone: Joi.string().allow('', null).optional(),
    email: Joi.string().email().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    area: Joi.string().allow('', null).optional(),
    cnic: Joi.string().allow('', null).optional(),
    licenseNo: Joi.string().allow('', null).optional(),
    customerNo: Joi.string().allow('', null).optional(),
    status: Joi.string().valid('active', 'locked').optional()
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const customer = await Customer.findByIdAndUpdate(id, value, { new: true });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid customer id' });
  }
  const customer = await Customer.findByIdAndDelete(id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json({ message: 'Customer deleted successfully' });
};

const getCustomerLedger = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid customer id' });
  }
  const customer = await Customer.findById(id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  res.json({
    customerId: customer._id,
    customerName: customer.name,
    runningBalance: customer.runningBalance,
    ledger: customer.ledger
  });
};

module.exports = { createCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer, getCustomerLedger };
