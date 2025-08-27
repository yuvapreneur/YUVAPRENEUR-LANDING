import { verifyToken } from './auth';

export function withAuth(handler) {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      req.userId = decoded.userId;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  };
}
