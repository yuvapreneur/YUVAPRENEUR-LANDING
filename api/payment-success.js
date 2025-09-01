// API endpoint for payment success callback
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
      email, 
      name, 
      phone, 
      profession, 
      city, 
      state, 
      password, 
      paymentId, 
      paymentDate 
    } = req.body;
    
    if (!email || !paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and payment ID are required' 
      });
    }
    
    console.log('💳 Payment success callback received:', { email, paymentId });
    
    // Create user data
    const userData = {
      email: email.toLowerCase().trim(),
      name: name || 'User',
      phone: phone || '',
      profession: profession || '',
      city: city || '',
      state: state || '',
      password: password || '',
      status: 'enrolled',
      paymentId: paymentId,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      courseAccess: 'full',
      hasPurchasedCourse: true,
      enrolledAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    // Save to users.json
    const fs = require('fs');
    const path = require('path');
    
    const usersFile = path.join(process.cwd(), 'data', 'users.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(usersFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Read existing users
    let users = [];
    if (fs.existsSync(usersFile)) {
      try {
        users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      } catch (error) {
        console.error('Error reading users file:', error);
      }
    }
    
    // Check if user already exists
    const existingUserIndex = users.findIndex(user => user.email === userData.email);
    
    if (existingUserIndex >= 0) {
      // Update existing user
      users[existingUserIndex] = { ...users[existingUserIndex], ...userData };
      console.log('✅ Updated existing user:', userData.email);
    } else {
      // Add new user
      users.push(userData);
      console.log('✅ Created new user:', userData.email);
    }
    
    // Save to file
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    
    // Save to enrollments.json
    const enrollmentsFile = path.join(process.cwd(), 'enrollments.json');
    
    // Read existing enrollments
    let enrollments = [];
    if (fs.existsSync(enrollmentsFile)) {
      try {
        enrollments = JSON.parse(fs.readFileSync(enrollmentsFile, 'utf8'));
      } catch (error) {
        console.error('Error reading enrollments file:', error);
      }
    }
    
    // Add enrollment record
    const enrollmentData = {
      _id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      profession: userData.profession,
      city: userData.city,
      state: userData.state,
      hasMainCourse: true,
      bonuses: [],
      password: userData.password,
      paymentId: userData.paymentId,
      paymentDate: userData.paymentDate,
      createdAt: userData.enrolledAt,
      updatedAt: new Date().toISOString()
    };
    
    enrollments.push(enrollmentData);
    
    // Save enrollments
    fs.writeFileSync(enrollmentsFile, JSON.stringify(enrollments, null, 2));
    
    console.log('✅ Payment success processed:', { email: userData.email, paymentId });
    
    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      user: {
        email: userData.email,
        name: userData.name,
        status: userData.status,
        courseAccess: userData.courseAccess
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
