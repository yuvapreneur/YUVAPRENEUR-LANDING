export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, phone, profession, city, state, password } = req.body;

    // Basic validation
    if (!name || !email || !phone || !profession || !city || !state || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Create user data (fallback mode - no database)
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      profession: profession.trim(),
      city: city.trim(),
      state: state.trim(),
      password: password, // In production, this should be hashed
      status: 'pending_payment',
      courseAccess: 'none',
      hasPurchasedCourse: false,
      enrolledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      id: 'temp_' + Date.now() // Temporary ID
    };

    return res.status(201).json({
      success: true,
      message: 'User registered successfully (fallback mode)',
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
}
