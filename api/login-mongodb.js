// API endpoint for login using MongoDB
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
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    console.log('🔐 Login attempt:', { email: email.toLowerCase().trim() });
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing. Set it in Vercel → Project → Settings → Environment Variables');
    }
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('cafe_masterclass');
    const enrollments = db.collection('enrollments');
    
    // Find user with case-insensitive email search
    const user = await enrollments.findOne({
      email: { $regex: new RegExp(`^${email.toLowerCase().trim()}$`, 'i') }
    });
    
    await client.close();
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check password (support both hashed and plain text for migration)
    let passwordMatch = false;
    
    if (user.password && user.password.startsWith('$2a$')) {
      // Password is hashed with bcrypt
      passwordMatch = await bcrypt.compare(password.trim(), user.password);
      console.log('🔐 Checking hashed password:', passwordMatch);
    } else {
      // Password is plain text (for existing users)
      passwordMatch = user.password && user.password.trim() === password.trim();
      console.log('🔐 Checking plain text password:', passwordMatch);
    }
    
    if (!passwordMatch) {
      console.log('❌ Password mismatch for user:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password' 
      });
    }
    
    console.log('✅ Login successful for user:', email);
    
    // Don't send password in response
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
}
