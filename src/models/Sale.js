const mongoose = require('mongoose');

const saleItem = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  qty: Number,
  unitPrice: Number,   // selling price used
  costPrice: Number,   // snapshot of cost
  profitPerItem: Number,
  totalProfit: Number
});

const saleSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  items: [saleItem],
  discountAmount: { type: Number, default: 0 },
  grossTotal: Number,
  netTotal: Number,
  totalProfit: Number,
  amountPaid: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'credit'], default: 'cash' },
  previousBalance: Number,
  newBalance: Number,
  isCredit: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
