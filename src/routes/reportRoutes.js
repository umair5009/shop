const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const reportController = require('../controllers/reportController');

router.get('/profit', auth, reportController.getProfitReport);
router.get('/category', auth, reportController.getCategoryReport);
router.get('/stock', auth, reportController.getStockReport);
router.get('/outstanding-customers', auth, reportController.getOutstandingCustomers);
router.get('/outstanding-suppliers', auth, reportController.getOutstandingSuppliers);

module.exports = router;

