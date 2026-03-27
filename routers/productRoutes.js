/**
 * Product Routes
 * Product management endpoints
 */

import express from 'express';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getCategories,
  searchProducts,
} from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { validateObjectId, validatePagination } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', validatePagination, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/search', searchProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', validateObjectId('id'), getProductById);

// Admin routes
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, validateObjectId('id'), updateProduct);
router.delete('/:id', protect, adminOnly, validateObjectId('id'), deleteProduct);

export default router;
