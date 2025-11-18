// src/routes/supplierRoutes.js
const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middlewares/auth');
const supplierController = require('../controllers/supplierController');

router.post('/', auth, adminOnly, supplierController.createSupplier);
router.get('/', auth, supplierController.getSuppliers);
router.get('/:id', auth, supplierController.getSupplier);
router.put('/:id', auth, adminOnly, supplierController.updateSupplier);
router.delete('/:id', auth, adminOnly, supplierController.deleteSupplier);
router.get('/:id/ledger', auth, supplierController.getSupplierLedger);

module.exports = router;
