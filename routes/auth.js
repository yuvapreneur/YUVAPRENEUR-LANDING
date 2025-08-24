const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const router = express.Router();
const JWT_SECRET = 'cafe-masterclass-secret-key-2024'; // Change in production

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Replace with your email
    pass: 'your-app-password'     // Replace with your app password
  }
});

// 📌 Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, profession, city, state, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      profession: profession || '',
      city: city || '',
      state: state || '',
      password: hashedPassword
    });

    await user.save();

    console.log('✅ New user created:', email);
    
    res.json({ 
      success: true, 
      message: 'Account created successfully! Please login.' 
    });

  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    console.log('✅ User logged in:', email);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        hasMainCourse: user.hasMainCourse,
        bonuses: user.bonuses || []
      }
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 Forgot Password (Send OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP via Email (uncomment when you have email credentials)
    /*
    const mailOptions = {
              from: 'support@www.yuvapreneur.in',
      to: email,
      subject: 'Password Reset OTP - Café Business Masterclass',
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    */

    console.log('✅ OTP sent to:', email, 'OTP:', otp);
    
    res.json({ 
      success: true, 
      message: 'OTP sent to your email',
      otp: otp // Remove this in production - only for testing
    });

  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 Reset Password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find user with valid OTP
    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.updatedAt = new Date();
    
    await user.save();

    console.log('✅ Password reset successful for:', email);

    res.json({ 
      success: true, 
      message: 'Password reset successful! Please login with your new password.' 
    });

  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 Verify Token (Protected route middleware)
router.get('/verify-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        hasMainCourse: user.hasMainCourse,
        bonuses: user.bonuses || []
      }
    });

  } catch (err) {
    console.error('❌ Token verification error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
