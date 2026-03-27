/**
 * Product Controller
 * Handles product-related operations
 */

import Product from '../model/Product.js';
import { AppError, asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * @desc    Get all products with filtering, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = asyncHandler(async (req, res, next) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    sort,
    featured,
    badge,
    page = 1,
    limit = 50,
  } = req.query;

  // Build query
  const query = { isActive: true };

  // Category filter
  if (category && category !== 'All') {
    query.category = category;
  }

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Featured filter
  if (featured === 'true') {
    query.isFeatured = true;
  }

  // Badge filter
  if (badge) {
    query.badge = badge;
  }

  // Sorting
  let sortQuery = { createdAt: -1 }; // Default: newest first
  
  switch (sort) {
    case 'price-asc':
      sortQuery = { price: 1 };
      break;
    case 'price-desc':
      sortQuery = { price: -1 };
      break;
    case 'name-asc':
      sortQuery = { name: 1 };
      break;
    case 'name-desc':
      sortQuery = { name: -1 };
      break;
    case 'rating':
      sortQuery = { 'ratings.average': -1 };
      break;
    case 'popular':
      sortQuery = { soldCount: -1 };
      break;
    case 'discount':
      // Sort by discount percentage (calculated)
      sortQuery = { originalPrice: -1, price: 1 };
      break;
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query),
  ]);

  // Transform products for client
  const transformedProducts = products.map((p) => ({
    id: p._id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice || p.price,
    category: p.category,
    emoji: p.emoji,
    badge: p.badge || 'New',
    glow: p.glow || '#d4af37',
    desc: p.shortDescription || p.description,
    image: p.images?.[0]?.url,
    stock: p.stock,
    rating: p.ratings?.average || 0,
  }));

  // Set pagination headers
  res.setHeader('X-Total-Count', total);
  res.setHeader('X-Page', pageNum);
  res.setHeader('X-Limit', limitNum);
  res.setHeader('X-Total-Pages', Math.ceil(total / limitNum));

  res.status(200).json(transformedProducts);
});

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Increment view count
  product.viewCount += 1;
  await product.save();

  res.status(200).json({
    status: 'success',
    product,
  });
});

/**
 * @desc    Get product by slug
 * @route   GET /api/products/slug/:slug
 * @access  Public
 */
export const getProductBySlug = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Increment view count
  product.viewCount += 1;
  await product.save();

  res.status(200).json({
    status: 'success',
    product,
  });
});

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.create(req.body);

  res.status(201).json({
    status: 'success',
    product,
  });
});

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    status: 'success',
    product,
  });
});

/**
 * @desc    Delete a product (soft delete)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Product deleted successfully',
  });
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
export const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 8;
  
  const products = await Product.findFeatured(limit);

  const transformedProducts = products.map((p) => ({
    id: p._id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice || p.price,
    category: p.category,
    emoji: p.emoji,
    badge: p.badge || 'Featured',
    glow: p.glow || '#d4af37',
    desc: p.shortDescription || p.description,
  }));

  res.status(200).json(transformedProducts);
});

/**
 * @desc    Get product categories with counts
 * @route   GET /api/products/categories
 * @access  Public
 */
export const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    status: 'success',
    categories: categories.map((c) => ({
      name: c._id,
      count: c.count,
    })),
  });
});

/**
 * @desc    Search products
 * @route   GET /api/products/search
 * @access  Public
 */
export const searchProducts = asyncHandler(async (req, res, next) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.length < 2) {
    return res.status(200).json([]);
  }

  const products = await Product.find({
    isActive: true,
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } },
    ],
  })
    .limit(parseInt(limit))
    .select('name price category emoji badge')
    .lean();

  res.status(200).json(products);
});

export default {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getCategories,
  searchProducts,
};
