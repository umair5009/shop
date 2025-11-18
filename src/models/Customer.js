const mongoose = require('mongoose');

const ledgerItem = new mongoose.Schema({
  type: { type: String, enum: ['invoice','payment','adjustment'], required: true },
  amount: Number,
  date: { type: Date, default: Date.now },
  reference: String,
  note: String
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  email: String,
  address: String,
  creditLimit: { type: Number, default: 0 },
  runningBalance: { type: Number, default: 0 }, // positive = customer owes
  status: { type: String, enum: ['active','locked'], default: 'active' },
  ledger: [ledgerItem]
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
