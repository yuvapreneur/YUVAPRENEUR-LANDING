// API endpoint for payment success callback using MongoDB
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

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
    return res.status(405).json({ error: 'Method not allowed' });
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
    
    if (!name || !email || !paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and payment ID are required' 
      });
    }
    
    console.log('💳 Payment success callback received:', { name, email, paymentId });
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing. Set it in Vercel → Project → Settings → Environment Variables');
    }
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('cafe_masterclass');
    const enrollments = db.collection('enrollments');
    
    // Hash password if provided
    let hashedPassword = '';
    if (password && password.trim()) {
      hashedPassword = await bcrypt.hash(password.trim(), 10);
      console.log('🔐 Password hashed for new user');
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
    const result = await enrollments.findOneAndUpdate(
      { email: enrollmentData.email },
      { $set: enrollmentData },
      { 
        upsert: true, 
        returnDocument: 'after'
      }
    );
    
    await client.close();
    
    console.log('✅ Enrollment saved/updated in MongoDB:', { 
      email: result.value.email, 
      name: result.value.name,
      paymentId: result.value.paymentId 
    });
    
    return res.status(200).json({
      success: true,
      message: 'Enrollment saved successfully',
      enrollment: {
        _id: result.value._id,
        name: result.value.name,
        email: result.value.email,
        phone: result.value.phone,
        hasMainCourse: result.value.hasMainCourse,
        paymentId: result.value.paymentId,
        createdAt: result.value.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Payment success error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
}
