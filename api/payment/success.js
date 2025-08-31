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

    // Fallback mode - create user data without database
    const userData = {
      email: email.toLowerCase().trim(),
      paymentId: paymentId,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      status: 'enrolled',
      courseAccess: 'full',
      hasPurchasedCourse: true,
      enrolledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      id: 'enrolled_' + Date.now()
    };

    // Try to get additional user data from tempUserData if available
    // This would normally come from the registration step
    const tempData = req.body.tempUserData || {};
    if (tempData.name) {
      userData.name = tempData.name;
      userData.phone = tempData.phone;
      userData.profession = tempData.profession;
      userData.city = tempData.city;
      userData.state = tempData.state;
      userData.password = tempData.password;
    }

    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully (fallback mode)',
      user: userData
    });

  } catch (error) {
    console.error('Payment success error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
}
