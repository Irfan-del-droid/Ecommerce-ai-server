/**
 * User Routes
 * User management endpoints
 */

import express from 'express';
import {
  getUsers,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser,
  deactivateAccount,
  getUserStats,
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { validateObjectId, validatePagination } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Protected routes (logged in users)
router.patch('/profile', protect, updateProfile);
router.delete('/profile', protect, deactivateAccount);

// Admin routes
router.get('/', protect, adminOnly, validatePagination, getUsers);
router.get('/stats', protect, adminOnly, getUserStats);
router.get('/:id', protect, adminOnly, validateObjectId('id'), getUserById);
router.patch('/:id', protect, adminOnly, validateObjectId('id'), updateUser);
router.delete('/:id', protect, adminOnly, validateObjectId('id'), deleteUser);

export default router;
