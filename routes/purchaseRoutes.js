const express = require('express');
const Purchase = require('../models/Purchase.js');
const { verifyToken } = require('../middleware/auth.js');

const router = express.Router();

// Get all purchases of logged-in user
router.get('/my-purchases', verifyToken, async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.user.id });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
