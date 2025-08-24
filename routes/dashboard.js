const express = require('express');
const User = require('../models/User');
const { BONUSES } = require('../bonuses.js');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // For now, we'll use a simple approach
    // In production, use proper JWT verification
    const user = await User.findOne({ email: req.query.email || req.body.email });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('❌ Authentication error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ✅ Get user's purchases and bonuses
router.get('/my-purchases', authenticateToken, async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's bonuses
    const userBonuses = user.bonuses || [];
    
    // Map bonuses with purchase status
    const bonusStatus = BONUSES.map(bonus => {
      const purchased = userBonuses.find(ub => ub.sku === bonus.sku);
      return {
        ...bonus,
        purchased: !!purchased,
        purchaseDate: purchased ? purchased.purchasedAt : null,
        paymentId: purchased ? purchased.paymentId : null
      };
    });

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        hasMainCourse: user.hasMainCourse,
        totalBonuses: userBonuses.length
      },
      bonuses: bonusStatus,
      purchases: userBonuses
    });

  } catch (err) {
    console.error('❌ Get purchases error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await User.findOne({ email }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        profession: user.profession,
        city: user.city,
        state: user.state,
        hasMainCourse: user.hasMainCourse,
        totalBonuses: (user.bonuses || []).length,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error('❌ Get profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email, name, phone, profession, city, state } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profession !== undefined) user.profession = profession;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        profession: user.profession,
        city: user.city,
        state: user.state
      }
    });

  } catch (err) {
    console.error('❌ Update profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get user's course access
router.get('/course-access', authenticateToken, async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has main course access
    const hasMainCourse = user.hasMainCourse || false;
    
    // Get available PDFs if user has access
    let availablePdfs = [];
    if (hasMainCourse) {
      const fs = require('fs');
      const path = require('path');
      const pdfDir = path.join(__dirname, '..', 'uploads', 'pdfs');
      
      try {
        if (fs.existsSync(pdfDir)) {
          availablePdfs = fs.readdirSync(pdfDir)
            .filter(file => file.endsWith('.pdf'))
            .map(file => ({
              filename: file,
              displayName: file.replace('.pdf', '').replace(/[_-]/g, ' '),
              downloadUrl: `/pdfs/${encodeURIComponent(file)}`
            }));
        }
      } catch (err) {
        console.error('Error reading PDF directory:', err);
      }
    }

    res.json({
      success: true,
      hasMainCourse,
      availablePdfs,
      message: hasMainCourse 
        ? 'You have access to all course modules' 
        : 'Purchase the main course to access modules'
    });

  } catch (err) {
    console.error('❌ Get course access error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
