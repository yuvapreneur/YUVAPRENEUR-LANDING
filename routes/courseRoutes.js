const express = require('express');
const Course = require('../models/Course.js');
const { verifyToken } = require('../middleware/auth.js');

const router = express.Router();

// Get all courses
router.get('/', verifyToken, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new course (admin only, keeping simple for now)
router.post('/', async (req, res) => {
  try {
    const { title, desc, pdfUrl, price, sku } = req.body;
    const newCourse = new Course({ title, desc, pdfUrl, price, sku });
    await newCourse.save();
    res.json(newCourse);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
