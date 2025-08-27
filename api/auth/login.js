import { connectToDatabase } from '../../lib/mongodb';
import { verifyPassword, generateToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if user has purchased the course
    if (!user.hasPurchasedCourse && user.status !== 'enrolled') {
      return res.status(403).json({ 
        success: false, 
        message: 'Please purchase the course first to access login' 
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Update last login
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { updatedAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        ...userWithoutPassword,
        id: user._id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
