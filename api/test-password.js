// Test endpoint to verify password hashing
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
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password is required' 
      });
    }
    
    console.log('🧪 Testing password hashing...');
    console.log('🔍 Original password:', password);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    console.log('🔍 Hashed password:', hashedPassword);
    console.log('🔍 Hash starts with $2a$:', hashedPassword.startsWith('$2a$'));
    
    // Test comparison
    const isMatch = await bcrypt.compare(password.trim(), hashedPassword);
    console.log('🔍 bcrypt.compare result:', isMatch);
    
    // Test with wrong password
    const wrongMatch = await bcrypt.compare('wrongpassword', hashedPassword);
    console.log('🔍 Wrong password comparison:', wrongMatch);
    
    return res.status(200).json({
      success: true,
      message: 'Password hashing test completed',
      results: {
        originalPassword: password,
        hashedPassword: hashedPassword,
        hashStartsWithDollar2a: hashedPassword.startsWith('$2a$'),
        correctPasswordMatch: isMatch,
        wrongPasswordMatch: wrongMatch
      }
    });
    
  } catch (error) {
    console.error('❌ Password test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
}
