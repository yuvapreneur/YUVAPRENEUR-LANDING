const express = require('express');
const User = require('../models/User.js');
const Course = require('../models/Course.js');
const Bonus = require('../models/Bonus.js');
const { verifyToken } = require('../middleware/auth.js');

const router = express.Router();

// Get purchased courses for logged-in user
router.get('/my-courses', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const purchasedCourses = await Course.find({ sku: { $in: user.purchasedCourses } });
    res.json(purchasedCourses);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get purchased bonuses for logged-in user
router.get('/my-bonuses', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const purchasedBonuses = await Bonus.find({ sku: { $in: user.purchasedBonuses } });
    res.json(purchasedBonuses);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
