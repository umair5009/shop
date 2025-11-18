// src/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middlewares/auth');
const categoryController = require('../controllers/categoryController');

router.post('/', auth, adminOnly, categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.get('/report/sales-profit', auth, categoryController.categorySalesProfitReport); // reports endpoint
router.get('/:id', auth, categoryController.getCategory);
router.put('/:id', auth, adminOnly, categoryController.updateCategory);
router.delete('/:id', auth, adminOnly, categoryController.deleteCategory);

module.exports = router;
