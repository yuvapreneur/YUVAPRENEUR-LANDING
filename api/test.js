export default async function handler(req, res) {
  try {
    // Test environment variables
    const envCheck = {
      mongodb_uri: process.env.MONGODB_URI ? 'Set' : 'Missing',
      jwt_secret: process.env.JWT_SECRET ? 'Set' : 'Missing',
      razorpay_key: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Missing'
    };

    // Test MongoDB connection
    let mongoStatus = 'Not tested';
    try {
      const { connectToDatabase } = await import('../lib/mongodb.js');
      const { db } = await connectToDatabase();
      mongoStatus = 'Connected successfully';
    } catch (error) {
      mongoStatus = `Error: ${error.message}`;
    }

    return res.status(200).json({
      success: true,
      message: 'API is working',
      environment: envCheck,
      mongodb: mongoStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'API test failed',
      error: error.message
    });
  }
}
