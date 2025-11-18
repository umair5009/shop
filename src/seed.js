// src/seed.js
require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');
const Sale = require('./models/Sale');
const Purchase = require('./models/Purchase');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log('🔗 Connected to database');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Supplier.deleteMany({});
    await Sale.deleteMany({});
    await Purchase.deleteMany({});

    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@shop.com',
      password: hash,
      role: 'admin'
    });
    console.log('✅ Admin created:', admin.email, '/ password123');

    // 2. Create Categories
    console.log('📁 Creating categories...');
    const categories = await Category.insertMany([
      { name: 'Electronics', description: 'Electronic items and gadgets' },
      { name: 'Groceries', description: 'Food and grocery items' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Stationery', description: 'Office and school supplies' },
      { name: 'Home & Kitchen', description: 'Household items' },
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // 3. Create Suppliers
    console.log('🏭 Creating suppliers...');
    const suppliers = await Supplier.insertMany([
      {
        name: 'Tech Distributors Ltd',
        phone: '9876543210',
        email: 'contact@techdist.com',
        address: '123 Tech Park, Mumbai',
        runningBalance: 0,
        ledger: []
      },
      {
        name: 'Fresh Foods Wholesale',
        phone: '9876543211',
        email: 'sales@freshfoods.com',
        address: '456 Market Street, Delhi',
        runningBalance: 0,
        ledger: []
      },
      {
        name: 'Fashion Hub Suppliers',
        phone: '9876543212',
        email: 'info@fashionhub.com',
        address: '789 Garment District, Bangalore',
        runningBalance: 0,
        ledger: []
      },
      {
        name: 'Office Supplies Co',
        phone: '9876543213',
        email: 'orders@officesupplies.com',
        address: '321 Business Park, Pune',
        runningBalance: 0,
        ledger: []
      },
    ]);
    console.log(`✅ Created ${suppliers.length} suppliers`);

    // 4. Create Products
    console.log('📦 Creating products...');
    const products = await Product.insertMany([
      // Electronics
      {
        name: 'Wireless Mouse',
        sku: 'ELEC001',
        category: categories[0]._id,
        unit: 'pcs',
        costPrice: 250,
        sellingPrice: 399,
        stock: 50,
        minStock: 10,
        barcode: '1234567890001',
        stockLedger: [{ type: 'in', qty: 50, note: 'opening stock' }]
      },
      {
        name: 'USB Cable Type-C',
        sku: 'ELEC002',
        category: categories[0]._id,
        unit: 'pcs',
        costPrice: 80,
        sellingPrice: 149,
        stock: 100,
        minStock: 20,
        barcode: '1234567890002',
        stockLedger: [{ type: 'in', qty: 100, note: 'opening stock' }]
      },
      {
        name: 'Power Bank 10000mAh',
        sku: 'ELEC003',
        category: categories[0]._id,
        unit: 'pcs',
        costPrice: 600,
        sellingPrice: 999,
        stock: 30,
        minStock: 5,
        barcode: '1234567890003',
        stockLedger: [{ type: 'in', qty: 30, note: 'opening stock' }]
      },
      // Groceries
      {
        name: 'Basmati Rice 1kg',
        sku: 'GROC001',
        category: categories[1]._id,
        unit: 'kg',
        costPrice: 80,
        sellingPrice: 120,
        stock: 200,
        minStock: 50,
        barcode: '1234567890004',
        stockLedger: [{ type: 'in', qty: 200, note: 'opening stock' }]
      },
      {
        name: 'Sugar 1kg',
        sku: 'GROC002',
        category: categories[1]._id,
        unit: 'kg',
        costPrice: 40,
        sellingPrice: 60,
        stock: 150,
        minStock: 30,
        barcode: '1234567890005',
        stockLedger: [{ type: 'in', qty: 150, note: 'opening stock' }]
      },
      {
        name: 'Cooking Oil 1L',
        sku: 'GROC003',
        category: categories[1]._id,
        unit: 'ltr',
        costPrice: 120,
        sellingPrice: 180,
        stock: 80,
        minStock: 20,
        barcode: '1234567890006',
        stockLedger: [{ type: 'in', qty: 80, note: 'opening stock' }]
      },
      // Clothing
      {
        name: 'Cotton T-Shirt',
        sku: 'CLTH001',
        category: categories[2]._id,
        unit: 'pcs',
        costPrice: 200,
        sellingPrice: 399,
        stock: 40,
        minStock: 10,
        barcode: '1234567890007',
        stockLedger: [{ type: 'in', qty: 40, note: 'opening stock' }]
      },
      {
        name: 'Jeans Pant',
        sku: 'CLTH002',
        category: categories[2]._id,
        unit: 'pcs',
        costPrice: 500,
        sellingPrice: 899,
        stock: 25,
        minStock: 5,
        barcode: '1234567890008',
        stockLedger: [{ type: 'in', qty: 25, note: 'opening stock' }]
      },
      // Stationery
      {
        name: 'A4 Paper Ream',
        sku: 'STAT001',
        category: categories[3]._id,
        unit: 'ream',
        costPrice: 200,
        sellingPrice: 299,
        stock: 60,
        minStock: 15,
        barcode: '1234567890009',
        stockLedger: [{ type: 'in', qty: 60, note: 'opening stock' }]
      },
      {
        name: 'Pen Set (10 pcs)',
        sku: 'STAT002',
        category: categories[3]._id,
        unit: 'set',
        costPrice: 50,
        sellingPrice: 99,
        stock: 100,
        minStock: 20,
        barcode: '1234567890010',
        stockLedger: [{ type: 'in', qty: 100, note: 'opening stock' }]
      },
      // Home & Kitchen
      {
        name: 'Dinner Plate Set',
        sku: 'HOME001',
        category: categories[4]._id,
        unit: 'set',
        costPrice: 400,
        sellingPrice: 699,
        stock: 20,
        minStock: 5,
        barcode: '1234567890011',
        stockLedger: [{ type: 'in', qty: 20, note: 'opening stock' }]
      },
      {
        name: 'Kitchen Knife Set',
        sku: 'HOME002',
        category: categories[4]._id,
        unit: 'set',
        costPrice: 300,
        sellingPrice: 549,
        stock: 15,
        minStock: 3,
        barcode: '1234567890012',
        stockLedger: [{ type: 'in', qty: 15, note: 'opening stock' }]
      },
    ]);
    console.log(`✅ Created ${products.length} products`);

    // 5. Create Customers
    console.log('👥 Creating customers...');
    const customers = await Customer.insertMany([
      {
        name: 'Rajesh Kumar',
        phone: '9123456780',
        email: 'rajesh@example.com',
        address: '12 MG Road, Mumbai',
        creditLimit: 10000,
        runningBalance: 0,
        status: 'active',
        ledger: []
      },
      {
        name: 'Priya Sharma',
        phone: '9123456781',
        email: 'priya@example.com',
        address: '45 Park Street, Delhi',
        creditLimit: 5000,
        runningBalance: 0,
        status: 'active',
        ledger: []
      },
      {
        name: 'Amit Patel',
        phone: '9123456782',
        email: 'amit@example.com',
        address: '78 Brigade Road, Bangalore',
        creditLimit: 15000,
        runningBalance: 0,
        status: 'active',
        ledger: []
      },
      {
        name: 'Sneha Reddy',
        phone: '9123456783',
        email: 'sneha@example.com',
        address: '23 FC Road, Pune',
        creditLimit: 8000,
        runningBalance: 0,
        status: 'active',
        ledger: []
      },
      {
        name: 'Vikram Singh',
        phone: '9123456784',
        email: 'vikram@example.com',
        address: '56 Mall Road, Jaipur',
        creditLimit: 12000,
        runningBalance: 0,
        status: 'active',
        ledger: []
      },
    ]);
    console.log(`✅ Created ${customers.length} customers`);

    // 6. Create Sample Purchases
    console.log('🛒 Creating sample purchases...');
    const purchases = await Purchase.insertMany([
      {
        supplier: suppliers[0]._id,
        product: products[0]._id,
        quantity: 50,
        costPrice: 250,
        totalAmount: 50 * 250,
        paymentMethod: 'cash',
        amountPaid: 50 * 250,
        date: new Date('2025-11-01')
      },
      {
        supplier: suppliers[0]._id,
        product: products[1]._id,
        quantity: 100,
        costPrice: 80,
        totalAmount: 100 * 80,
        paymentMethod: 'cash',
        amountPaid: 100 * 80,
        date: new Date('2025-11-02')
      },
      {
        supplier: suppliers[1]._id,
        product: products[3]._id,
        quantity: 200,
        costPrice: 80,
        totalAmount: 200 * 80,
        paymentMethod: 'credit',
        amountPaid: 10000,
        date: new Date('2025-11-05')
      },
      {
        supplier: suppliers[1]._id,
        product: products[4]._id,
        quantity: 150,
        costPrice: 40,
        totalAmount: 150 * 40,
        paymentMethod: 'cash',
        amountPaid: 150 * 40,
        date: new Date('2025-11-06')
      },
      {
        supplier: suppliers[2]._id,
        product: products[6]._id,
        quantity: 40,
        costPrice: 200,
        totalAmount: 40 * 200,
        paymentMethod: 'upi',
        amountPaid: 40 * 200,
        date: new Date('2025-11-10')
      },
    ]);
    console.log(`✅ Created ${purchases.length} purchases`);

    // Update supplier balances for credit purchases
    await Supplier.findByIdAndUpdate(suppliers[1]._id, {
      $inc: { runningBalance: 200 * 80 - 10000 },
      $push: {
        ledger: {
          type: 'purchase',
          amount: 200 * 80 - 10000,
          date: new Date('2025-11-05'),
          note: 'Purchase - Basmati Rice 1kg',
          referenceId: purchases[2]._id
        }
      }
    });

    // 7. Create Sample Sales
    console.log('💰 Creating sample sales...');
    let invoiceCounter = 1000;

    const sales = await Sale.insertMany([
      {
        invoiceNumber: `INV-${Date.now()}-${invoiceCounter++}`,
        customer: customers[0]._id,
        items: [
          {
            product: products[0]._id,
            name: products[0].name,
            qty: 2,
            unitPrice: products[0].sellingPrice,
            costPrice: products[0].costPrice,
            profitPerItem: products[0].sellingPrice - products[0].costPrice,
            totalProfit: 2 * (products[0].sellingPrice - products[0].costPrice)
          },
          {
            product: products[1]._id,
            name: products[1].name,
            qty: 3,
            unitPrice: products[1].sellingPrice,
            costPrice: products[1].costPrice,
            profitPerItem: products[1].sellingPrice - products[1].costPrice,
            totalProfit: 3 * (products[1].sellingPrice - products[1].costPrice)
          },
        ],
        discountAmount: 50,
        grossTotal: 2 * products[0].sellingPrice + 3 * products[1].sellingPrice,
        netTotal: 2 * products[0].sellingPrice + 3 * products[1].sellingPrice - 50,
        totalProfit: 2 * (products[0].sellingPrice - products[0].costPrice) + 3 * (products[1].sellingPrice - products[1].costPrice),
        previousBalance: 0,
        newBalance: 0,
        isCredit: false,
        date: new Date('2025-11-15')
      },
      {
        invoiceNumber: `INV-${Date.now()}-${invoiceCounter++}`,
        customer: customers[1]._id,
        items: [
          {
            product: products[3]._id,
            name: products[3].name,
            qty: 5,
            unitPrice: products[3].sellingPrice,
            costPrice: products[3].costPrice,
            profitPerItem: products[3].sellingPrice - products[3].costPrice,
            totalProfit: 5 * (products[3].sellingPrice - products[3].costPrice)
          },
          {
            product: products[5]._id,
            name: products[5].name,
            qty: 2,
            unitPrice: products[5].sellingPrice,
            costPrice: products[5].costPrice,
            profitPerItem: products[5].sellingPrice - products[5].costPrice,
            totalProfit: 2 * (products[5].sellingPrice - products[5].costPrice)
          },
        ],
        discountAmount: 0,
        grossTotal: 5 * products[3].sellingPrice + 2 * products[5].sellingPrice,
        netTotal: 5 * products[3].sellingPrice + 2 * products[5].sellingPrice,
        totalProfit: 5 * (products[3].sellingPrice - products[3].costPrice) + 2 * (products[5].sellingPrice - products[5].costPrice),
        previousBalance: 0,
        newBalance: 0,
        isCredit: false,
        date: new Date('2025-11-16')
      },
      {
        invoiceNumber: `INV-${Date.now()}-${invoiceCounter++}`,
        customer: customers[2]._id,
        items: [
          {
            product: products[6]._id,
            name: products[6].name,
            qty: 3,
            unitPrice: products[6].sellingPrice,
            costPrice: products[6].costPrice,
            profitPerItem: products[6].sellingPrice - products[6].costPrice,
            totalProfit: 3 * (products[6].sellingPrice - products[6].costPrice)
          },
        ],
        discountAmount: 100,
        grossTotal: 3 * products[6].sellingPrice,
        netTotal: 3 * products[6].sellingPrice - 100,
        totalProfit: 3 * (products[6].sellingPrice - products[6].costPrice),
        previousBalance: 0,
        newBalance: 0,
        isCredit: false,
        date: new Date('2025-11-17')
      },
    ]);
    console.log(`✅ Created ${sales.length} sales`);

    // Update product stock based on sales
    console.log('📊 Updating product stock...');
    await Product.findByIdAndUpdate(products[0]._id, {
      $inc: { stock: -2 },
      $push: { stockLedger: { type: 'out', qty: 2, note: 'sale', referenceId: sales[0]._id } }
    });
    await Product.findByIdAndUpdate(products[1]._id, {
      $inc: { stock: -3 },
      $push: { stockLedger: { type: 'out', qty: 3, note: 'sale', referenceId: sales[0]._id } }
    });
    await Product.findByIdAndUpdate(products[3]._id, {
      $inc: { stock: -5 },
      $push: { stockLedger: { type: 'out', qty: 5, note: 'sale', referenceId: sales[1]._id } }
    });
    await Product.findByIdAndUpdate(products[5]._id, {
      $inc: { stock: -2 },
      $push: { stockLedger: { type: 'out', qty: 2, note: 'sale', referenceId: sales[1]._id } }
    });
    await Product.findByIdAndUpdate(products[6]._id, {
      $inc: { stock: -3 },
      $push: { stockLedger: { type: 'out', qty: 3, note: 'sale', referenceId: sales[2]._id } }
    });

    console.log('\n✨ ========================================');
    console.log('✨ SEED DATA CREATED SUCCESSFULLY!');
    console.log('✨ ========================================\n');
    console.log('📊 Summary:');
    console.log(`   👤 Users: 1 (admin@shop.com / password123)`);
    console.log(`   📁 Categories: ${categories.length}`);
    console.log(`   📦 Products: ${products.length}`);
    console.log(`   👥 Customers: ${customers.length}`);
    console.log(`   🏭 Suppliers: ${suppliers.length}`);
    console.log(`   🛒 Purchases: ${purchases.length}`);
    console.log(`   💰 Sales: ${sales.length}`);
    console.log('\n🚀 You can now login with:');
    console.log('   Email: admin@shop.com');
    console.log('   Password: password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
    