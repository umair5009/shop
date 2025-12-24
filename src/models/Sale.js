const mongoose = require('mongoose');

const saleItem = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  qty: Number, // Quantity in pieces (total pieces)
  qtyInUnits: Number, // Quantity in the product's unit (e.g., 2 boxes)
  unit: String, // Unit type (PCS, CTN, BOX, KG)
  pcsPerUnit: Number, // Pieces per unit at time of sale
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

  // Invoice metadata fields
  customerNo: String,
  area: String,
  deliveredBy: String,
  deliveredByNo: Number,  // Delivered By reference number
  bookedBy: String,
  orderByNo: Number,  // Order By reference number
  licenseNo: String,
  cnic: String,
  orderNo: String,
  dueDate: Date,

  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
