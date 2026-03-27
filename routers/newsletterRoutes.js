/**
 * Newsletter Routes
 * Newsletter subscription endpoints
 */

import express from 'express';
import {
  subscribe,
  unsubscribe,
  updatePreferences,
  getSubscribers,
  getStats,
  deleteSubscriber,
  exportSubscribers,
} from '../controllers/newsletterController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { validateNewsletter, validateObjectId, validatePagination } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.post('/subscribe', validateNewsletter, subscribe);
router.post('/unsubscribe', unsubscribe);
router.patch('/preferences', updatePreferences);

// Admin routes
router.get('/', protect, adminOnly, validatePagination, getSubscribers);
router.get('/stats', protect, adminOnly, getStats);
router.get('/export', protect, adminOnly, exportSubscribers);
router.delete('/:id', protect, adminOnly, validateObjectId('id'), deleteSubscriber);

export default router;
