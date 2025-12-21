const Area = require('../models/Area');
const mongoose = require('mongoose');

const createArea = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    try {
        const existing = await Area.findOne({ name });
        if (existing) return res.status(400).json({ message: 'Area already exists' });

        const area = await Area.create({ name });
        res.json(area);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAreas = async (req, res) => {
    try {
        const areas = await Area.find().sort({ name: 1 });
        res.json(areas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateArea = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    try {
        const area = await Area.findByIdAndUpdate(id, { name }, { new: true });
        if (!area) return res.status(404).json({ message: 'Area not found' });
        res.json(area);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteArea = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    try {
        const area = await Area.findByIdAndDelete(id);
        if (!area) return res.status(404).json({ message: 'Area not found' });
        res.json({ message: 'Area deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createArea, getAreas, updateArea, deleteArea };
