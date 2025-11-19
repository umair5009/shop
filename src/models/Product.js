const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema({
  type: { type: String, enum: ['in','out'], required: true },
  qty: { type: Number, required: true },
  note: String,
  date: { type: Date, default: Date.now },
  referenceId: String
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: String,
  barcode: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  unit: String, // CTN, PCS, KG, BOX
  pcsPerUnit: { type: Number, default: 1 }, // How many pieces per unit (e.g., 20 pieces per box)
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  stock: { type: Number, default: 0 }, // Stock in pieces
  minStock: { type: Number, default: 0 },
  stockLedger: [stockLedgerSchema]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
