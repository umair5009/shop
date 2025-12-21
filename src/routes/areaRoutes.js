const express = require('express');
const router = express.Router();
const { createArea, getAreas, updateArea, deleteArea } = require('../controllers/areaController');
const { auth, adminOnly } = require('../middlewares/auth');

router.get('/', auth, getAreas);
router.post('/', auth, adminOnly, createArea);
router.put('/:id', auth, adminOnly, updateArea);
router.delete('/:id', auth, adminOnly, deleteArea);

module.exports = router;
