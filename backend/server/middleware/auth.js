const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and attaches user info to request object
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided or invalid token format' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Token is empty' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID (exclude password from result)
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'User not found or token invalid' 
      });
    }

    // Check if user account is active
    if (user.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Account suspended', 
        message: 'Your account has been suspended. Please contact support.' 
      });
    }

    // Attach user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token', 
        message: 'Token signature is invalid' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired', 
        message: 'Please login again' 
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        error: 'Token not active', 
        message: 'Token is not active yet' 
      });
    }

    res.status(500).json({ 
      error: 'Authentication error', 
      message: 'Server error during authentication' 
    });
  }
};

/**
 * Optional Authentication Middleware
 * Similar to authMiddleware but doesn't fail if no token is provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without auth
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Empty token, continue without auth
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.status !== 'suspended') {
      req.user = {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role || 'user'
      };
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Resource ownership middleware
 * Ensures user can only access their own resources
 */
const requireOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }

      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({ 
          error: 'Resource not found' 
        });
      }

      if (resource.userId.toString() !== req.user.userId.toString()) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only access your own resources'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ 
        error: 'Authorization error' 
      });
    }
  };
};

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRole,
  requireOwnership
};