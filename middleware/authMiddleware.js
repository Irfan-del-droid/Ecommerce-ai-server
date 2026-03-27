/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */

import jwt from 'jsonwebtoken';
import User from '../model/User.js';
import { AppError } from './errorMiddleware.js';

/**
 * Protect routes - Verify JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies (alternative)
    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'loki-secret-key-2024');

    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated.', 401));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired.', 401));
    }
    next(error);
  }
};

/**
 * Optional authentication - Attaches user if token exists
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'loki-secret-key-2024');
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

/**
 * Restrict routes to specific roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    next();
  };
};

/**
 * Admin only middleware
 */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('You must be logged in.', 401));
  }

  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required.', 403));
  }

  next();
};

/**
 * Rate limiting by user
 */
const userRequestCounts = new Map();

export const userRateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const userId = req.user?._id?.toString() || req.ip;
    const now = Date.now();

    if (!userRequestCounts.has(userId)) {
      userRequestCounts.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userLimit = userRequestCounts.get(userId);

    if (now > userLimit.resetTime) {
      userRequestCounts.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return next(new AppError('Too many requests. Please try again later.', 429));
    }

    userLimit.count++;
    next();
  };
};

export default { protect, optionalAuth, restrictTo, adminOnly, userRateLimit };
