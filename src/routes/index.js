// src/routes/index.js
const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/customers', require('./customerRoutes'));
router.use('/sales', require('./saleRoutes'));

// add these new ones:
router.use('/categories', require('./categoryRoutes'));
router.use('/suppliers', require('./supplierRoutes'));
router.use('/purchases', require('./purchaseRoutes'));
router.use('/bill', require('./billRoutes'));
router.use('/payment', require('./paymentRoutes'));
router.use('/reports', require('./reportRoutes'));

module.exports = router;
