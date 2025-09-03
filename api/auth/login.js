import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Read enrollments from file
    const enrollmentsPath = path.join(process.cwd(), 'enrollments.json');
    let enrollments = [];
    
    try {
      const data = fs.readFileSync(enrollmentsPath, 'utf8');
      enrollments = JSON.parse(data);
    } catch (error) {
      console.error('Error reading enrollments:', error);
      return res.status(500).json({
        success: false,
        error: 'Unable to read user data'
      });
    }

    console.log('📋 Total enrollments in system:', enrollments.length);
    console.log('🔍 Searching for email:', email.toLowerCase().trim());
    
    // Case-insensitive email search
    const user = enrollments.find(e => 
      e.email && e.email.toLowerCase().trim() === email.toLowerCase().trim()
    );
    
    console.log('👤 User lookup result:', user ? 'Found' : 'Not found');
    if (user) {
      console.log('📊 User details:', {
        id: user._id,
        name: user.name,
        email: user.email,
        hasMainCourse: user.hasMainCourse,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        passwordMatch: user.password === password,
        passwordProvided: password.length,
        createdAt: user.createdAt
      });
    } else {
      console.log('❌ No user found with email:', email);
      console.log('📧 Available emails in system:', enrollments.map(e => e.email).slice(0, 5));
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Please check your email or purchase the course first.',
        suggestions: [
          'Make sure you have purchased the course',
          'Check if your email is correct',
          'Try the forgot password option if you have an account'
        ]
      });
    }

    // Check if user has password
    if (!user.password) {
      console.log('❌ User has no password set:', email);
      return res.status(401).json({
        success: false,
        error: 'No password set for this account. Please use forgot password to set a password.',
        needsPasswordReset: true
      });
    }

    // Strict password check with detailed logging
    console.log('🔐 Password validation:', {
      providedPassword: password,
      storedPassword: user.password,
      passwordMatch: password === user.password,
      providedLength: password.length,
      storedLength: user.password ? user.password.length : 0,
      providedTrimmed: password.trim(),
      storedTrimmed: user.password ? user.password.trim() : '',
      trimmedMatch: password.trim() === user.password.trim()
    });
    
    // Check password with trimming
    if (password.trim() !== user.password.trim()) {
      console.log('❌ Password mismatch for user:', email);
      console.log('❌ Provided password (trimmed):', password.trim());
      console.log('❌ Stored password (trimmed):', user.password.trim());
      return res.status(401).json({
        success: false,
        error: 'Invalid password. Please check your password and try again.',
        suggestions: [
          'Check if Caps Lock is on',
          'Make sure you are using the correct password',
          'Try the forgot password option'
        ]
      });
    }

    // Check if user has purchased the main course
    if (!user.hasMainCourse) {
      console.log('⚠️ User has no main course access:', email);
      console.log('⚠️ User can login but needs to purchase course');
      
      // Allow login but show warning
      console.log('✅ User logged in successfully (no course access):', email);
      
      return res.status(200).json({
        success: true,
        message: 'Login successful! Please purchase the course to access content.',
        needsPurchase: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          hasMainCourse: false,
          bonuses: user.bonuses || []
        },
        warning: 'You need to purchase the course to access the dashboard content.'
      });
    }

    // Successful login with course access
    console.log('✅ User logged in successfully with course access:', email);
    
    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        hasMainCourse: true,
        bonuses: user.bonuses || [],
        paymentId: user.paymentId,
        paymentDate: user.paymentDate
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
