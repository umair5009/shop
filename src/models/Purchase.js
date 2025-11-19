const mongoose = require('mongoose');

// Purchase Item Schema
const purchaseItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  tradePrice: { type: Number, required: true },
  qty: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  ctn: { type: Number, default: 0 },
  pcs: { type: Number, default: 0 },
  kg: { type: Number, default: 0 },
  discPercent: { type: Number, default: 0 },
  sTax: { type: Number, default: 0 },
  scheme: { type: Number, default: 0 },
  less: { type: Number, default: 0 },
  netAmount: { type: Number, required: true }
});

const purchaseSchema = new mongoose.Schema({
  // Invoice Information
  invoiceNo: { type: String, required: true, unique: true },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  orderNo: String,
  pageNo: { type: String, default: '1 of 1' },

  // Supplier/Customer Information
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  customerNo: String,
  customerShopName: String,
  address: String,
  phone: String,
  area: String,
  deliveredBy: String,
  bookedBy: String,
  licenseNo: String,
  cnic: String,
  licenseExpiry: String,
  ntn: String,

  // Items
  items: [purchaseItemSchema],

  // Totals
  noOfItems: { type: Number, default: 0 },
  gross: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  amountInWords: String,

  // Payment
  cashReceived: { type: Number, default: 0 },
  previousBalance: { type: Number, default: 0 },
  netBalance: { type: Number, default: 0 },

  // Additional
  remarks: String,
  checkedBy: String,

  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
