// API endpoint for user registration using MongoDB with bcrypt
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
    const { name, email, password, phone, profession, city, state } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }
    
    console.log('📝 Registration attempt:', { name, email: email.toLowerCase().trim() });
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing. Set it in Vercel → Project → Settings → Environment Variables');
    }
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('cafe_masterclass');
    const enrollments = db.collection('enrollments');
    
    // Check if user already exists
    const existingUser = await enrollments.findOne({
      email: { $regex: new RegExp(`^${email.toLowerCase().trim()}$`, 'i') }
    });
    
    if (existingUser) {
      await client.close();
      console.log('❌ User already exists:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    console.log('🔐 Password hashed for registration');
    
    // Create user data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      profession: profession || '',
      city: city || '',
      state: state || '',
      password: hashedPassword,
      hasMainCourse: false,
      bonuses: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert new user
    const result = await enrollments.insertOne(userData);
    
    await client.close();
    
    console.log('✅ User registered successfully:', { 
      email: userData.email, 
      name: userData.name,
      id: result.insertedId 
    });
    
    // Don't send password in response
    const { password: _, ...userWithoutPassword } = userData;
    
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        _id: result.insertedId,
        ...userWithoutPassword
      }
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
}
