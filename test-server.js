console.log('Testing server startup...');

try {
  // Test basic imports
  const express = require('express');
  console.log('✅ Express loaded');
  
  const path = require('path');
  console.log('✅ Path loaded');
  
  const fs = require('fs');
  console.log('✅ FS loaded');
  
  const nodemailer = require('nodemailer');
  console.log('✅ Nodemailer loaded');
  
  const session = require('express-session');
  console.log('✅ Session loaded');
  
  const Razorpay = require('razorpay');
  console.log('✅ Razorpay loaded');
  
  const crypto = require('crypto');
  console.log('✅ Crypto loaded');
  
  const mongoose = require('mongoose');
  console.log('✅ Mongoose loaded');
  
  // Test route imports
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
  
  const dashboardRoutes = require('./routes/dashboard');
  console.log('✅ Dashboard routes loaded');
  
  const purchaseRoutes = require('./routes/purchaseRoutes');
  console.log('✅ Purchase routes loaded');
  
  const paymentRoutes = require('./routes/paymentRoutes');
  console.log('✅ Payment routes loaded');
  
  const courseRoutes = require('./routes/courseRoutes');
  console.log('✅ Course routes loaded');
  
  const bonusRoutes = require('./routes/bonusRoutes');
  console.log('✅ Bonus routes loaded');
  
  const uploadRoutes = require('./routes/uploadRoutes');
  console.log('✅ Upload routes loaded');
  
  const userRoutes = require('./routes/userRoutes');
  console.log('✅ User routes loaded');
  
  // Test bonuses import
  const { BONUSES } = require('./bonuses.js');
  console.log('✅ Bonuses loaded:', BONUSES.length, 'items');
  
  console.log('🎉 All imports successful! Server should start without issues.');
  
} catch (error) {
  console.log('❌ Import error:', error.message);
  console.log('Stack:', error.stack);
}
