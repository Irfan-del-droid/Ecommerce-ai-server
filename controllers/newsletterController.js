/**
 * Newsletter Controller
 * Handles newsletter subscription operations
 */

import Newsletter from '../model/Newsletter.js';
import { AppError, asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * @desc    Subscribe to newsletter
 * @route   POST /api/newsletter
 * @access  Public
 */
export const subscribe = asyncHandler(async (req, res, next) => {
  const { email, source = 'website', preferences } = req.body;

  // Check if already subscribed
  const existingSubscription = await Newsletter.findOne({
    email: email.toLowerCase(),
  });

  if (existingSubscription) {
    if (existingSubscription.isActive) {
      return res.status(200).json({
        status: 'success',
        message: 'You are already subscribed to our newsletter!',
        isExisting: true,
      });
    } else {
      // Resubscribe
      await existingSubscription.resubscribe();
      return res.status(200).json({
        status: 'success',
        message: 'Welcome back! You have been resubscribed to our newsletter.',
        isResubscribed: true,
      });
    }
  }

  // Create new subscription
  const subscription = await Newsletter.create({
    email: email.toLowerCase(),
    source,
    preferences: preferences || {
      newArrivals: true,
      sales: true,
      news: true,
    },
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({
    status: 'success',
    message: 'Successfully subscribed to the Loki newsletter! Prepare for divine updates.',
    subscriptionId: subscription._id,
    unsubscribeToken: subscription.unsubscribeToken,
  });
});

/**
 * @desc    Unsubscribe from newsletter
 * @route   POST /api/newsletter/unsubscribe
 * @access  Public
 */
export const unsubscribe = asyncHandler(async (req, res, next) => {
  const { email, token, reason } = req.body;

  let subscription;

  // Find by token or email
  if (token) {
    subscription = await Newsletter.findOne({ unsubscribeToken: token });
  } else if (email) {
    subscription = await Newsletter.findOne({ email: email.toLowerCase() });
  } else {
    return next(new AppError('Email or unsubscribe token is required', 400));
  }

  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  if (!subscription.isActive) {
    return res.status(200).json({
      status: 'success',
      message: 'You are already unsubscribed from our newsletter.',
    });
  }

  // Unsubscribe
  await subscription.unsubscribe(reason);

  res.status(200).json({
    status: 'success',
    message: 'You have been unsubscribed from our newsletter. We hope to see you again!',
  });
});

/**
 * @desc    Update subscription preferences
 * @route   PATCH /api/newsletter/preferences
 * @access  Public
 */
export const updatePreferences = asyncHandler(async (req, res, next) => {
  const { email, token, preferences } = req.body;

  let subscription;

  // Find by token or email
  if (token) {
    subscription = await Newsletter.findOne({ unsubscribeToken: token });
  } else if (email) {
    subscription = await Newsletter.findOne({ email: email.toLowerCase() });
  } else {
    return next(new AppError('Email or token is required', 400));
  }

  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  // Update preferences
  if (preferences) {
    subscription.preferences = {
      ...subscription.preferences,
      ...preferences,
    };
    await subscription.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Preferences updated successfully',
    preferences: subscription.preferences,
  });
});

/**
 * @desc    Get all subscribers (Admin)
 * @route   GET /api/newsletter
 * @access  Private/Admin
 */
export const getSubscribers = asyncHandler(async (req, res, next) => {
  const {
    active,
    search,
    source,
    page = 1,
    limit = 50,
    sort = '-createdAt',
  } = req.query;

  // Build query
  const query = {};

  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  if (source) {
    query.source = source;
  }

  if (search) {
    query.email = { $regex: search, $options: 'i' };
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const [subscribers, total] = await Promise.all([
    Newsletter.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
    Newsletter.countDocuments(query),
  ]);

  res.status(200).json({
    status: 'success',
    results: subscribers.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    subscribers,
  });
});

/**
 * @desc    Get newsletter statistics (Admin)
 * @route   GET /api/newsletter/stats
 * @access  Private/Admin
 */
export const getStats = asyncHandler(async (req, res, next) => {
  const stats = await Newsletter.getStats();

  // Get source breakdown
  const sourceStats = await Newsletter.aggregate([
    { $group: { _id: '$source', count: { $sum: 1 } } },
  ]);

  // Get recent subscriptions (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentStats = await Newsletter.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    stats: {
      ...stats,
      bySource: sourceStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      last7Days: recentStats,
    },
  });
});

/**
 * @desc    Delete subscriber (Admin)
 * @route   DELETE /api/newsletter/:id
 * @access  Private/Admin
 */
export const deleteSubscriber = asyncHandler(async (req, res, next) => {
  const subscriber = await Newsletter.findByIdAndDelete(req.params.id);

  if (!subscriber) {
    return next(new AppError('Subscriber not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Subscriber deleted successfully',
  });
});

/**
 * @desc    Export subscribers (Admin)
 * @route   GET /api/newsletter/export
 * @access  Private/Admin
 */
export const exportSubscribers = asyncHandler(async (req, res, next) => {
  const { active = 'true' } = req.query;

  const query = active === 'true' ? { isActive: true } : {};
  
  const subscribers = await Newsletter.find(query)
    .select('email createdAt source preferences')
    .lean();

  // Format as CSV
  const csv = [
    'Email,Subscribed Date,Source,New Arrivals,Sales,News',
    ...subscribers.map(
      (s) =>
        `${s.email},${s.createdAt.toISOString()},${s.source},${s.preferences?.newArrivals},${s.preferences?.sales},${s.preferences?.news}`
    ),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=newsletter-subscribers.csv');
  res.status(200).send(csv);
});

export default {
  subscribe,
  unsubscribe,
  updatePreferences,
  getSubscribers,
  getStats,
  deleteSubscriber,
  exportSubscribers,
};
