// scripts/resetDatabase.js
// This script clears all data and reseeds the database with fresh test data

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Customer = require('../src/models/Customer');
const Supplier = require('../src/models/Supplier');
const Sale = require('../src/models/Sale');
const Purchase = require('../src/models/Purchase');

const resetDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    console.log('\n🗑️  Clearing all collections...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Supplier.deleteMany({});
    await Sale.deleteMany({});
    await Purchase.deleteMany({});
    console.log('✅ All collections cleared');

    // Create admin user
    console.log('\n👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@shop.com',
      password: hashedPassword,
      role: 'admin'
    });
    console.log('✅ Admin user created (email: admin@shop.com, password: admin123)');

    // Create categories
    console.log('\n📁 Creating categories...');
    const categories = await Category.insertMany([
      { name: 'Tea & Beverages', description: 'Tea, coffee, and beverages' },
      { name: 'Spices', description: 'Spices and seasonings' },
      { name: 'Rice & Grains', description: 'Rice, wheat, and grains' },
      { name: 'Snacks', description: 'Snacks and namkeen' },
      { name: 'Cooking Essentials', description: 'Oil, ghee, and cooking essentials' }
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // Create products
    console.log('\n📦 Creating products...');
    const products = await Product.insertMany([
      {
        name: 'Green Tea Premium',
        sku: 'GT001',
        barcode: '1234567890001',
        category: categories[0]._id,
        costPrice: 30,
        sellingPrice: 40,
        stock: 100,
        minStock: 20
      },
      {
        name: 'Black Tea',
        sku: 'BT001',
        barcode: '1234567890002',
        category: categories[0]._id,
        costPrice: 25,
        sellingPrice: 35,
        stock: 150,
        minStock: 30
      },
      {
        name: 'Bombay Biryani 50GM',
        sku: 'BB001',
        barcode: '1234567890003',
        category: categories[1]._id,
        costPrice: 120,
        sellingPrice: 150,
        stock: 200,
        minStock: 50
      },
      {
        name: 'Chicken Cubes',
        sku: 'CC001',
        barcode: '1234567890004',
        category: categories[1]._id,
        costPrice: 1200,
        sellingPrice: 1400,
        stock: 50,
        minStock: 10
      },
      {
        name: 'Kali Mirch Jar 100G',
        sku: 'KM001',
        barcode: '1234567890005',
        category: categories[1]._id,
        costPrice: 410,
        sellingPrice: 500,
        stock: 80,
        minStock: 15
      },
      {
        name: 'Basmati Rice 5KG',
        sku: 'BR001',
        barcode: '1234567890006',
        category: categories[2]._id,
        costPrice: 800,
        sellingPrice: 950,
        stock: 120,
        minStock: 25
      },
      {
        name: 'Cooking Oil 5L',
        sku: 'CO001',
        barcode: '1234567890007',
        category: categories[4]._id,
        costPrice: 1500,
        sellingPrice: 1700,
        stock: 60,
        minStock: 15
      },
      {
        name: 'Namkeen Mix 500G',
        sku: 'NM001',
        barcode: '1234567890008',
        category: categories[3]._id,
        costPrice: 180,
        sellingPrice: 220,
        stock: 90,
        minStock: 20
      }
    ]);
    console.log(`✅ Created ${products.length} products`);

    // Create customers
    console.log('\n👥 Creating customers...');
    const customers = await Customer.insertMany([
      {
        name: 'Naseem & Shafiq Traders',
        phone: '0311-5956044',
        email: 'naseem@example.com',
        address: 'Main Road, Tordher',
        runningBalance: 0,
        ledger: []
      },
      {
        name: 'Ahmed Store',
        phone: '0300-1234567',
        email: 'ahmed@example.com',
        address: 'Market Street, Jehangira',
        runningBalance: 0,
        ledger: []
      },
      {
        name: 'Khan Traders',
        phone: '0321-9876543',
        email: 'khan@example.com',
        address: 'GT Road, Swabi',
        runningBalance: 0,
        ledger: []
      }
    ]);
    console.log(`✅ Created ${customers.length} customers`);

    // Create suppliers
    console.log('\n🏭 Creating suppliers...');
    const suppliers = await Supplier.insertMany([
      {
        name: 'Wholesale Spices Ltd',
        phone: '0333-1111111',
        email: 'wholesale@example.com',
        address: 'Industrial Area, Peshawar',
        runningBalance: 0,
        ledger: []
      },
      {
        name: 'Tea Importers Co',
        phone: '0344-2222222',
        email: 'teaimport@example.com',
        address: 'Karkhano Market, Peshawar',
        runningBalance: 0,
        ledger: []
      },
      {
        name: 'Rice Mills Pvt Ltd',
        phone: '0355-3333333',
        email: 'ricemills@example.com',
        address: 'Charsadda Road',
        runningBalance: 0,
        ledger: []
      }
    ]);
    console.log(`✅ Created ${suppliers.length} suppliers`);

    console.log('\n✨ Database reset complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Admin User: 1`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Customers: ${customers.length}`);
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Email: admin@shop.com');
    console.log('   Password: admin123');
    console.log('\n✅ You can now test the application with fresh data!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();

