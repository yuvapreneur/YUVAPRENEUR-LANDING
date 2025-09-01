// API endpoint to update password with bcrypt hashing
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
    const { email, currentPassword, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and new password are required' 
      });
    }
    
    console.log('🔐 Password update attempt:', { email: email.toLowerCase().trim() });
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing. Set it in Vercel → Project → Settings → Environment Variables');
    }
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('cafe_masterclass');
    const enrollments = db.collection('enrollments');
    
    // Find user
    const user = await enrollments.findOne({
      email: { $regex: new RegExp(`^${email.toLowerCase().trim()}$`, 'i') }
    });
    
    if (!user) {
      await client.close();
      console.log('❌ User not found:', email);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Verify current password if provided
    if (currentPassword) {
      let currentPasswordMatch = false;
      
      if (user.password && user.password.startsWith('$2a$')) {
        // Password is hashed
        currentPasswordMatch = await bcrypt.compare(currentPassword.trim(), user.password);
      } else {
        // Password is plain text
        currentPasswordMatch = user.password && user.password.trim() === currentPassword.trim();
      }
      
      if (!currentPasswordMatch) {
        await client.close();
        console.log('❌ Current password mismatch for user:', email);
        return res.status(401).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword.trim(), 10);
    console.log('🔐 New password hashed');
    
    // Update password
    const result = await enrollments.findOneAndUpdate(
      { email: user.email },
      { 
        $set: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );
    
    await client.close();
    
    console.log('✅ Password updated successfully for user:', email);
    
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Password update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
}
