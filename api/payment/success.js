import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, paymentId, paymentDate } = req.body;

    if (!email || !paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and payment ID are required' 
      });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update user with payment success
    const updateData = {
      status: 'enrolled',
      paymentId: paymentId,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      courseAccess: 'full',
      hasPurchasedCourse: true,
      enrolledAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.updateOne(
      { _id: user._id },
      { $set: updateData }
    );

    if (result.modifiedCount > 0) {
      // Get updated user data
      const updatedUser = await usersCollection.findOne({ _id: user._id });
      const { password: _, ...userWithoutPassword } = updatedUser;

      return res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        user: {
          ...userWithoutPassword,
          id: updatedUser._id
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to update user payment status'
      });
    }

  } catch (error) {
    console.error('Payment success error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
