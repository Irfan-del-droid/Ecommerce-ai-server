/**
 * Contact Routes
 * Contact form endpoints
 */

import express from 'express';
import {
  submitContact,
  getContacts,
  getContactById,
  updateContact,
  respondToContact,
  deleteContact,
  getContactStats,
} from '../controllers/contactController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { validateContact, validateObjectId, validatePagination } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.post('/', validateContact, submitContact);

// Admin routes
router.get('/', protect, adminOnly, validatePagination, getContacts);
router.get('/stats', protect, adminOnly, getContactStats);
router.get('/:id', protect, adminOnly, validateObjectId('id'), getContactById);
router.patch('/:id', protect, adminOnly, validateObjectId('id'), updateContact);
router.post('/:id/respond', protect, adminOnly, validateObjectId('id'), respondToContact);
router.delete('/:id', protect, adminOnly, validateObjectId('id'), deleteContact);

export default router;
