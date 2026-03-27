/**
 * Auth Routes
 * Authentication endpoints
 */

import express from 'express';
import {
  signup,
  login,
  googleAuth,
  refreshToken,
  getMe,
  updatePassword,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateSignup, validateLogin } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/google', googleAuth);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', protect, getMe);
router.patch('/password', protect, updatePassword);
router.post('/logout', protect, logout);

export default router;
