const express = require('express');
const Bonus = require('../models/Bonus.js');
const { verifyToken } = require('../middleware/auth.js');

const router = express.Router();

// Get all bonuses
router.get('/', verifyToken, async (req, res) => {
  try {
    const bonuses = await Bonus.find();
    res.json(bonuses);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new bonus (admin only, keeping simple for now)
router.post('/', async (req, res) => {
  try {
    const { title, desc, pdfUrl, price, sku } = req.body;
    const newBonus = new Bonus({ title, desc, pdfUrl, price, sku });
    await newBonus.save();
    res.json(newBonus);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
