const { verifyToken, extractToken } = require('../utils/auth');

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
function authenticateToken(req, res, next) {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied. No token provided.' 
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ 
      error: 'Invalid token.' 
    });
  }

  req.user = decoded;
  next();
}

/**
 * Optional authentication middleware
 * Adds user info to request if token is present, but doesn't require it
 */
function optionalAuth(req, res, next) {
  const token = extractToken(req);
  
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  
  next();
}

/**
 * Admin authentication middleware
 * Requires authentication and admin privileges
 */
function requireAdmin(req, res, next) {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        error: 'Admin access required.' 
      });
    }
    
    next();
  });
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin
};