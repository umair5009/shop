const express = require('express');
const router = express.Router();
const { createCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer, getCustomerLedger } = require('../controllers/customerController');
const { auth, adminOnly } = require('../middlewares/auth');

router.get('/', auth, getCustomers);
router.post('/', auth, createCustomer);
router.get('/:id', auth, getCustomer);
router.put('/:id', auth, adminOnly, updateCustomer);
router.delete('/:id', auth, adminOnly, deleteCustomer);
router.get('/:id/ledger', auth, getCustomerLedger);

module.exports = router;
