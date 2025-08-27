import { connectToDatabase } from '../../lib/mongodb';
import { hashPassword } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, phone, profession, city, state, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !profession || !city || !state || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ 
      email: email.toLowerCase() 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user document
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      profession: profession.trim(),
      city: city.trim(),
      state: state.trim(),
      password: hashedPassword,
      status: 'pending_payment',
      courseAccess: 'none',
      hasPurchasedCourse: false,
      enrolledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert user into database
    const result = await usersCollection.insertOne(userData);

    if (result.insertedId) {
      // Remove password from response
      const { password: _, ...userWithoutPassword } = userData;
      
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          ...userWithoutPassword,
          id: result.insertedId
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
