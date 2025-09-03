export default async function handler(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: 'API is working correctly!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'API test failed',
      error: error.message
    });
  }
}
