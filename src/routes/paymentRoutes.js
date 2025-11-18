const express = require('express');
const router = express.Router();
const { createCustomerPayment } = require('../controllers/paymentController');
const { auth } = require('../middlewares/auth');

router.post('/customer', auth, createCustomerPayment);

module.exports = router;

