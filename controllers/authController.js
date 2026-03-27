/**
 * Auth Controller
 * Handles user authentication operations
 */

import jwt from 'jsonwebtoken';
import User from '../model/User.js';
import { AppError, asyncHandler } from '../middleware/errorMiddleware.js';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'loki-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Generate JWT Token
 */
const generateToken = (userId, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn });
};

/**
 * Generate Refresh Token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
};

/**
 * Create and send token response
 */
const createSendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Remove password from output
  const userResponse = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
  };

  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    user: userResponse,
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, phone, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('Email already registered. Please use a different email or login.', 400));
  }

  // Create new user
  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    password,
  });

  // Generate token and send response
  createSendToken(user, 201, res);
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user and verify credentials
  const user = await User.findByCredentials(email.toLowerCase(), password);

  // Generate token and send response
  createSendToken(user, 200, res);
});

/**
 * @desc    Google OAuth authentication
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res, next) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return next(new AppError('Google access token is required', 400));
  }

  try {
    // Fetch user info from Google
    const googleResponse = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    );

    if (!googleResponse.ok) {
      return next(new AppError('Failed to verify Google token', 401));
    }

    const googleUser = await googleResponse.json();

    if (!googleUser.email) {
      return next(new AppError('Could not retrieve email from Google', 400));
    }

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email.toLowerCase() });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        user.isEmailVerified = true;
        if (googleUser.picture && !user.avatar) {
          user.avatar = googleUser.picture;
        }
        await user.save();
      }
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user from Google data
      user = await User.create({
        firstName: googleUser.given_name || googleUser.name?.split(' ')[0] || 'User',
        lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
        email: googleUser.email.toLowerCase(),
        googleId: googleUser.sub,
        isEmailVerified: true,
        avatar: googleUser.picture,
        password: Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16), // Random password
      });
    }

    // Generate token and send response
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Google Auth Error:', error);
    return next(new AppError('Google authentication failed', 500));
  }
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return next(new AppError('Invalid refresh token', 401));
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new AppError('User not found or inactive', 401));
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      status: 'success',
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    user,
  });
});

/**
 * @desc    Update user password
 * @route   PATCH /api/auth/password
 * @access  Private
 */
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Current password and new password are required', 400));
  }

  if (newPassword.length < 8) {
    return next(new AppError('New password must be at least 8 characters', 400));
  }

  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  createSendToken(user, 200, res);
});

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res, next) => {
  // In a stateless JWT setup, logout is handled client-side
  // This endpoint can be used to invalidate refresh tokens if stored in DB

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

export default {
  signup,
  login,
  googleAuth,
  refreshToken,
  getMe,
  updatePassword,
  logout,
};
