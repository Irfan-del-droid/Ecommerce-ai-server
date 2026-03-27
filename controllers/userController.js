/**
 * User Controller
 * Handles user profile and management operations
 */

import User from '../model/User.js';
import { AppError, asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * @desc    Get all users (Admin)
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getUsers = asyncHandler(async (req, res, next) => {
  const {
    role,
    active,
    search,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = req.query;

  // Build query
  const query = {};

  if (role) {
    query.role = role;
  }

  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const [users, total] = await Promise.all([
    User.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    status: 'success',
    results: users.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    users,
  });
});

/**
 * @desc    Get user by ID (Admin)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
export const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    user,
  });
});

/**
 * @desc    Update user profile
 * @route   PATCH /api/users/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, phone, avatar } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update allowed fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  res.status(200).json({
    status: 'success',
    user,
  });
});

/**
 * @desc    Update user by ID (Admin)
 * @route   PATCH /api/users/:id
 * @access  Private/Admin
 */
export const updateUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, phone, role, isActive, isEmailVerified } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (email) user.email = email.toLowerCase();
  if (phone !== undefined) user.phone = phone;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (isEmailVerified !== undefined) user.isEmailVerified = isEmailVerified;

  await user.save();

  res.status(200).json({
    status: 'success',
    user,
  });
});

/**
 * @desc    Delete user (Admin)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent deleting self
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  // Soft delete
  user.isActive = false;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'User deactivated successfully',
  });
});

/**
 * @desc    Deactivate own account
 * @route   DELETE /api/users/profile
 * @access  Private
 */
export const deactivateAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isActive = false;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Your account has been deactivated',
  });
});

/**
 * @desc    Get user statistics (Admin)
 * @route   GET /api/users/stats
 * @access  Private/Admin
 */
export const getUserStats = asyncHandler(async (req, res, next) => {
  const [totalUsers, activeUsers, roleStats, recentUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  res.status(200).json({
    status: 'success',
    stats: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      newLast30Days: recentUsers,
      byRole: roleStats.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
    },
  });
});

export default {
  getUsers,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser,
  deactivateAccount,
  getUserStats,
};
