const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  email: String,
  address: String,
  runningBalance: { type: Number, default: 0 },
  ledger: [{ type: Object }]
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
