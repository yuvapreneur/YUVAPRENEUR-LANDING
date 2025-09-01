// Consolidated MongoDB authentication endpoints
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
  
  const { action } = req.query;
  
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing. Set it in Vercel → Project → Settings → Environment Variables');
    }
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('cafe_masterclass');
    const enrollments = db.collection('enrollments');
    
    if (action === 'register' && req.method === 'POST') {
      // Registration endpoint
      const { name, email, password, phone, profession, city, state } = req.body;
      
      if (!name || !email || !password) {
        await client.close();
        return res.status(400).json({ 
          success: false, 
          message: 'Name, email, and password are required' 
        });
      }
      
      console.log('📝 Registration attempt:', { name, email: email.toLowerCase().trim() });
      
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
       console.log('🔍 Original password:', password.trim());
       console.log('🔍 Hashed password:', hashedPassword);
       console.log('🔍 Hash starts with $2a$:', hashedPassword.startsWith('$2a$'));
      
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
      
    } else if (action === 'login' && req.method === 'POST') {
      // Login endpoint
      const { email, password } = req.body;
      
      if (!email || !password) {
        await client.close();
        return res.status(400).json({ 
          success: false, 
          message: 'Email and password are required' 
        });
      }
      
      console.log('🔐 Login attempt:', { email: email.toLowerCase().trim() });
      
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
       
       console.log('🔍 DEBUGGING PASSWORD COMPARISON:');
       console.log('🔍 Entered password:', password.trim());
       console.log('🔍 Stored password:', user.password);
       console.log('🔍 Stored password type:', typeof user.password);
       console.log('🔍 Stored password length:', user.password ? user.password.length : 'null');
       console.log('🔍 Stored password starts with $2a$:', user.password ? user.password.startsWith('$2a$') : 'null');
       
       if (user.password && user.password.startsWith('$2a$')) {
         // Password is hashed with bcrypt
         passwordMatch = await bcrypt.compare(password.trim(), user.password);
         console.log('🔐 Checking hashed password:', passwordMatch);
         console.log('🔐 bcrypt.compare result:', passwordMatch);
       } else {
         // Password is plain text (for existing users)
         passwordMatch = user.password && user.password.trim() === password.trim();
         console.log('🔐 Checking plain text password:', passwordMatch);
         console.log('🔐 Plain text comparison result:', passwordMatch);
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
      
    } else if (action === 'update-password' && req.method === 'POST') {
      // Password update endpoint
      const { email, currentPassword, newPassword } = req.body;
      
      if (!email || !newPassword) {
        await client.close();
        return res.status(400).json({ 
          success: false, 
          message: 'Email and new password are required' 
        });
      }
      
      console.log('🔐 Password update attempt:', { email: email.toLowerCase().trim() });
      
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
      
    } else {
      await client.close();
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
}
