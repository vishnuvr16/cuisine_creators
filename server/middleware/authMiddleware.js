const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticateToken = async (req, res, next) => {
  try {
    // Debug logs
    console.log('All Cookies:', req.cookies);
    console.log('Token from cookies:', req.cookies.token);
    
    // Get token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      // Debug log
      console.log('Token not found in cookies. Cookie names available:', Object.keys(req.cookies));
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ error: 'User not found.' });
      }

      // Attach user to request object
      console.log("user",user);
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Token expired.' });
      }
      if (error.name === 'JsonWebTokenError') {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Invalid token.' });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error in authentication.' });
  }
};