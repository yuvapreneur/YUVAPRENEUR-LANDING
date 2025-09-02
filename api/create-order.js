// API endpoint for creating Razorpay orders
import Razorpay from 'razorpay';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    const { amount, currency, receipt } = req.body;
    
    console.log('🔍 Creating Razorpay order:', { amount, currency, receipt });
    
    // Validate required fields
    if (!amount || !currency) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount and currency are required' 
      });
    }
    
    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_RAD4Q0Jypcn82a',
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    
    // Create order
    const order = await razorpay.orders.create({
      amount: amount,
      currency: currency,
      receipt: receipt || 'receipt_' + Date.now(),
      notes: {
        course: 'Café Business Masterclass',
        type: 'main_course_enrollment'
      }
    });
    
    console.log('✅ Order created successfully:', order.id);
    
    return res.status(200).json({
      success: true,
      message: 'Order created successfully',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
    
  } catch (error) {
    console.error('❌ Order creation error:', error);
    return res.status(500).json({
      success: false,
      message: `Order creation failed: ${error.message}`
    });
  }
}
