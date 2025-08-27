import { connectToDatabase } from '../../lib/mongodb';
import { withAuth } from '../../lib/middleware';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user by ID
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(req.userId) 
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      user: {
        ...userWithoutPassword,
        id: user._id
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

export default withAuth(handler);
