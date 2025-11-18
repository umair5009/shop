const Joi = require('joi');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');

const createCustomerPayment = async (req, res) => {
  /**
   * payload example:
   * {
   *   customerId: "...",
   *   amount: 500,
   *   paymentMethod: "cash" | "bank" | "cheque",
   *   reference: "CHQ123", // optional
   *   note: "Payment received" // optional
   * }
   */
  const schema = Joi.object({
    customerId: Joi.string().required(),
    amount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().valid('cash', 'bank', 'cheque', 'other').default('cash'),
    reference: Joi.string().allow('', null).optional(),
    note: Joi.string().allow('', null).optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  if (!mongoose.Types.ObjectId.isValid(value.customerId)) {
    return res.status(400).json({ message: 'Invalid customer id' });
  }

  const customer = await Customer.findById(value.customerId);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  // Reduce customer's running balance (payment reduces what they owe)
  const previousBalance = customer.runningBalance;
  const newBalance = previousBalance - value.amount;

  customer.runningBalance = newBalance;
  customer.ledger.push({
    type: 'payment',
    amount: value.amount,
    date: new Date(),
    reference: value.reference || value.paymentMethod,
    note: value.note || `Payment received via ${value.paymentMethod}`
  });

  // If customer was locked and balance is now within limit, unlock them
  if (customer.status === 'locked' && newBalance <= customer.creditLimit) {
    customer.status = 'active';
  }

  await customer.save();

  res.json({
    message: 'Payment recorded successfully',
    customer: {
      id: customer._id,
      name: customer.name,
      previousBalance,
      newBalance: customer.runningBalance,
      status: customer.status
    }
  });
};

module.exports = { createCustomerPayment };

