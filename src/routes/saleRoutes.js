const express = require('express');
const router = express.Router();
const { createSale, getSales, getSale, reprintSale, getSaleBill } = require('../controllers/saleController');
const { auth } = require('../middlewares/auth');

router.post('/', auth, createSale);
router.get('/', auth, getSales);
router.get('/:id', auth, getSale);
router.get('/:id/bill', auth, getSaleBill); // Get formatted bill for printing
router.post('/:id/reprint', auth, reprintSale);

module.exports = router;
