const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Purchase = require('../models/Purchase.js');
const { verifyToken } = require('../middleware/auth.js');

const router = express.Router();

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_R8p0w858yQYzuu',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YN1NQqSwtvKemGAmLk2biNUa'
});

// Create order
router.post('/order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    
    console.log('📝 Creating order with:', { amount, currency, receipt });
    
    // Validate amount
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      console.error('❌ Invalid amount:', amount);
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(numericAmount * 100), // Convert to paise
      currency: currency,
      receipt: receipt || `order_${Date.now()}`,
      payment_capture: 1
    };

    console.log('🔧 Razorpay options:', options);
    console.log('🔑 Using key_id:', process.env.RAZORPAY_KEY_ID || 'fallback');

    const order = await razorpay.orders.create(options);
    console.log('✅ Order created successfully:', order.id);
    
    res.json(order);
  } catch (err) {
    console.error('❌ Order creation error:', {
      statusCode: err?.statusCode,
      code: err?.error?.code,
      description: err?.error?.description,
      message: err?.message,
      fullError: err
    });
    
    const errorMessage = err?.error?.description || err?.message || 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to create order', 
      details: errorMessage,
      code: err?.error?.code
    });
  }
});

// Verify payment and save purchase
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sku, type } = req.body;
    
    const sign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YN1NQqSwtvKemGAmLk2biNUa')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    
    if (sign !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // Save purchase
    const purchase = new Purchase({
      userId: req.user?.id || 'temp-user',
      sku,
      type
    });
    
    await purchase.save();
    res.json({ success: true, purchase });
  } catch (err) {
    console.error('❌ Payment verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Debug endpoint to verify Razorpay configuration
router.get('/debug-key', (req, res) => {
  try {
    res.json({
      key_id: process.env.RAZORPAY_KEY_ID || 'fallback-in-file',
      has_secret: Boolean(process.env.RAZORPAY_KEY_SECRET),
      razorpay_configured: Boolean(razorpay),
      env_loaded: process.env.NODE_ENV || 'development'
    });
  } catch (e) {
    res.status(500).json({ error: 'debug failed' });
  }
});

module.exports = router;
