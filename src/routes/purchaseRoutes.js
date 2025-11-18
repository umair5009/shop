// src/routes/purchaseRoutes.js
const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middlewares/auth');
const purchaseController = require('../controllers/purchaseController');

router.post('/', auth, adminOnly, purchaseController.createPurchase);
router.get('/', auth, purchaseController.getPurchases);
router.get('/report/by-product', auth, purchaseController.purchaseReportByProduct); // purchase report
router.get('/:id', auth, purchaseController.getPurchase);

module.exports = router;
