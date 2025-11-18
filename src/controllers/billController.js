// controllers/billController.js
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Category = require("../models/Category");

const generateBill = async (req, res) => {
  try {
    const { items, customerId, discountType, discountValue } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    let total = 0;
    let totalProfit = 0;

    // Dynamic categories object
    let categories = {};

    for (let it of items) {
      const product = await Product.findById(it.productId).populate('category');
      if (!product) continue;

      const lineTotal = product.sellingPrice * it.qty;
      const lineProfit = (product.sellingPrice - product.costPrice) * it.qty;

      total += lineTotal;
      totalProfit += lineProfit;

      // Dynamically group items by category
      const categoryName = product.category?.name || 'Uncategorized';

      if (!categories[categoryName]) {
        categories[categoryName] = [];
      }

      categories[categoryName].push({
        name: product.name,
        qty: it.qty,
        price: product.sellingPrice,
        lineTotal
      });
    }

    // Discount calculations
    let discountAmount = 0;

    if (discountType === "percent") {
      discountAmount = total * (discountValue / 100);
    } else if (discountType === "flat") {
      discountAmount = discountValue;
    }

    const grandTotal = total - discountAmount;

    // Fetch customer for due calculation
    const customer = await Customer.findById(customerId);

    let previousDue = customer?.dueAmount || 0;
    let remaining = previousDue + grandTotal;

    return res.json({
      success: true,
      bill: {
        date: new Date(),
        previousDue,
        categories,
        total,
        discountAmount,
        grandTotal,
        totalProfit,
        remaining
      }
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


module.exports = { generateBill };
