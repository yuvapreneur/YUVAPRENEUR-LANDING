// API endpoint for payment verification and user creation
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
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
    const { 
      name, 
      email, 
      phone, 
      profession, 
      city, 
      state, 
      password, 
      paymentId, 
      paymentDate 
    } = req.body;
    
    console.log('🔍 DEBUG: Received payment verification request:', {
      name: name ? 'present' : 'missing',
      email: email ? 'present' : 'missing', 
      phone: phone ? 'present' : 'missing',
      profession: profession ? 'present' : 'missing',
      city: city ? 'present' : 'missing',
      state: state ? 'present' : 'missing',
      password: password ? 'present' : 'missing',
      paymentId: paymentId ? 'present' : 'missing',
      paymentDate: paymentDate ? 'present' : 'missing'
    });
    
    // Validate required fields
    if (!name || !email || !paymentId) {
      console.log('❌ Missing required fields:', { name: !!name, email: !!email, paymentId: !!paymentId });
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and payment ID are required' 
      });
    }
    
    console.log('💳 Starting payment verification for:', { name, email, paymentId });
    
    // Step 1: Verify Razorpay payment
    try {
      console.log('🔍 Step 1: Verifying Razorpay payment...');
      
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_RAD4Q0Jypcn82a',
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      
      const payment = await razorpay.payments.fetch(paymentId);
      console.log('📊 Payment details:', {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        captured: payment.captured
      });
      
      // Check if payment is captured
      if (payment.status !== 'captured') {
        console.log('❌ Payment not captured. Status:', payment.status);
        return res.status(400).json({
          success: false,
          message: `Payment not captured. Status: ${payment.status}`
        });
      }
      
      console.log('✅ Payment verification successful');
      
    } catch (paymentError) {
      console.error('❌ Payment verification failed:', paymentError);
      return res.status(400).json({
        success: false,
        message: `Payment verification failed: ${paymentError.message}`
      });
    }
    
    // Step 2: Create user in MongoDB
    try {
      console.log('🔍 Step 2: Creating user in database...');
      
      // Connect to MongoDB
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        console.error('❌ MONGODB_URI is missing - using file-based fallback');
        
        // Fallback to file-based system
        const fs = require('fs');
        const path = require('path');
        
        // Read existing enrollments
        const enrollmentsPath = path.join(process.cwd(), 'enrollments.json');
        let enrollments = [];
        
        if (fs.existsSync(enrollmentsPath)) {
          const data = fs.readFileSync(enrollmentsPath, 'utf8');
          enrollments = JSON.parse(data);
        }
        
        // Hash password if provided
        let hashedPassword = '';
        if (password && password.trim()) {
          hashedPassword = await bcrypt.hash(password.trim(), 10);
          console.log('🔐 Password hashed for new user (file-based)');
          console.log('🔍 Original password:', password.trim());
          console.log('🔍 Hashed password:', hashedPassword);
        }
        
        // Create enrollment data
        const enrollmentData = {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone || '',
          profession: profession || '',
          city: city || '',
          state: state || '',
          hasMainCourse: true,
          bonuses: [],
          password: hashedPassword,
          paymentId: paymentId,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Check if user already exists
        const existingIndex = enrollments.findIndex(e => e.email === enrollmentData.email);
        if (existingIndex >= 0) {
          // Update existing user
          enrollments[existingIndex] = { ...enrollments[existingIndex], ...enrollmentData };
          console.log('✅ Updated existing user in file-based system');
        } else {
          // Add new user
          enrollments.push(enrollmentData);
          console.log('✅ Added new user to file-based system');
        }
        
        // Save to file
        fs.writeFileSync(enrollmentsPath, JSON.stringify(enrollments, null, 2));
        console.log('💾 Saved to enrollments.json');
        
        return res.status(200).json({
          success: true,
          message: 'Payment verified and user created successfully (file-based)',
          user: {
            name: enrollmentData.name,
            email: enrollmentData.email,
            phone: enrollmentData.phone,
            hasMainCourse: enrollmentData.hasMainCourse,
            paymentId: enrollmentData.paymentId,
            createdAt: enrollmentData.createdAt
          }
        });
      }
      
      console.log('🔗 Connecting to MongoDB...');
      const client = new MongoClient(mongoUri);
      await client.connect();
      console.log('✅ Connected to MongoDB successfully');
      
      const db = client.db('cafe_masterclass');
      const enrollments = db.collection('enrollments');
      console.log('📊 Using database: cafe_masterclass, collection: enrollments');
      
      // Hash password if provided
      let hashedPassword = '';
      if (password && password.trim()) {
        hashedPassword = await bcrypt.hash(password.trim(), 10);
        console.log('🔐 Password hashed for new user');
        console.log('🔍 Original password:', password.trim());
        console.log('🔍 Hashed password:', hashedPassword);
        console.log('🔍 Hash starts with $2a$:', hashedPassword.startsWith('$2a$'));
      } else {
        console.log('⚠️ No password provided for user creation');
      }
      
      // Create enrollment data
      const enrollmentData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || '',
        profession: profession || '',
        city: city || '',
        state: state || '',
        hasMainCourse: true,
        bonuses: [],
        password: hashedPassword,
        paymentId: paymentId,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save new enrollment (or update if user already exists) - UPSERT
      console.log('💾 Saving enrollment data to MongoDB...');
      console.log('📝 Enrollment data:', {
        name: enrollmentData.name,
        email: enrollmentData.email,
        hasPassword: !!enrollmentData.password,
        passwordLength: enrollmentData.password ? enrollmentData.password.length : 0,
        paymentId: enrollmentData.paymentId
      });
      
      const result = await enrollments.findOneAndUpdate(
        { email: enrollmentData.email },
        { $set: enrollmentData },
        { 
          upsert: true, 
          returnDocument: 'after'
        }
      );
      
      console.log('✅ Database operation completed');
      await client.close();
      console.log('🔌 MongoDB connection closed');
      
      console.log('✅ User created successfully in MongoDB:', { 
        email: result.value.email, 
        name: result.value.name,
        paymentId: result.value.paymentId 
      });
      
      // Step 3: Return success response
      return res.status(200).json({
        success: true,
        message: 'Payment verified and user created successfully',
        user: {
          _id: result.value._id,
          name: result.value.name,
          email: result.value.email,
          phone: result.value.phone,
          hasMainCourse: result.value.hasMainCourse,
          paymentId: result.value.paymentId,
          createdAt: result.value.createdAt
        }
      });
      
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);
      return res.status(500).json({
        success: false,
        message: `Database operation failed: ${dbError.message}`
      });
    }
    
  } catch (error) {
    console.error('❌ Payment verification and user creation error:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`
    });
  }
}
