/**
 * Contact Controller
 * Handles contact form submissions
 */

import Contact from '../model/Contact.js';
import { AppError, asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * @desc    Submit contact form
 * @route   POST /api/contact
 * @access  Public
 */
export const submitContact = asyncHandler(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  // Rate limiting check - prevent spam (max 3 submissions per email per hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentSubmissions = await Contact.countDocuments({
    email: email.toLowerCase(),
    createdAt: { $gte: oneHourAgo },
  });

  if (recentSubmissions >= 3) {
    return next(
      new AppError('Too many submissions. Please try again later.', 429)
    );
  }

  // Create contact submission
  const contact = await Contact.create({
    name,
    email: email.toLowerCase(),
    subject: subject || '',
    message,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({
    status: 'success',
    message: 'Message sent to the realm! We will respond within 24 hours.',
    contactId: contact._id,
  });
});

/**
 * @desc    Get all contacts (Admin)
 * @route   GET /api/contact
 * @access  Private/Admin
 */
export const getContacts = asyncHandler(async (req, res, next) => {
  const {
    status,
    priority,
    search,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = req.query;

  // Build query
  const query = {};

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const [contacts, total] = await Promise.all([
    Contact.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('assignedTo', 'firstName lastName email')
      .lean(),
    Contact.countDocuments(query),
  ]);

  res.status(200).json({
    status: 'success',
    results: contacts.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    contacts,
  });
});

/**
 * @desc    Get single contact by ID (Admin)
 * @route   GET /api/contact/:id
 * @access  Private/Admin
 */
export const getContactById = asyncHandler(async (req, res, next) => {
  const contact = await Contact.findById(req.params.id)
    .populate('assignedTo', 'firstName lastName email')
    .populate('responses.responder', 'firstName lastName email');

  if (!contact) {
    return next(new AppError('Contact not found', 404));
  }

  // Mark as read if not already
  if (!contact.isRead) {
    await contact.markAsRead();
  }

  res.status(200).json({
    status: 'success',
    contact,
  });
});

/**
 * @desc    Update contact status (Admin)
 * @route   PATCH /api/contact/:id
 * @access  Private/Admin
 */
export const updateContact = asyncHandler(async (req, res, next) => {
  const { status, priority, assignedTo } = req.body;

  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return next(new AppError('Contact not found', 404));
  }

  // Update fields
  if (status) {
    contact.status = status;
    if (status === 'resolved') {
      contact.resolvedAt = new Date();
    }
  }

  if (priority) {
    contact.priority = priority;
  }

  if (assignedTo !== undefined) {
    contact.assignedTo = assignedTo || null;
  }

  await contact.save();

  res.status(200).json({
    status: 'success',
    contact,
  });
});

/**
 * @desc    Add response to contact (Admin)
 * @route   POST /api/contact/:id/respond
 * @access  Private/Admin
 */
export const respondToContact = asyncHandler(async (req, res, next) => {
  const { message } = req.body;

  if (!message || message.trim().length < 1) {
    return next(new AppError('Response message is required', 400));
  }

  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return next(new AppError('Contact not found', 404));
  }

  // Add response
  contact.responses.push({
    responder: req.user._id,
    message: message.trim(),
  });

  // Update status to in-progress if pending
  if (contact.status === 'pending') {
    contact.status = 'in-progress';
  }

  await contact.save();

  res.status(200).json({
    status: 'success',
    message: 'Response added successfully',
    contact,
  });
});

/**
 * @desc    Delete contact (Admin)
 * @route   DELETE /api/contact/:id
 * @access  Private/Admin
 */
export const deleteContact = asyncHandler(async (req, res, next) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);

  if (!contact) {
    return next(new AppError('Contact not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Contact deleted successfully',
  });
});

/**
 * @desc    Get contact statistics (Admin)
 * @route   GET /api/contact/stats
 * @access  Private/Admin
 */
export const getContactStats = asyncHandler(async (req, res, next) => {
  const [statusStats, priorityStats, totalToday] = await Promise.all([
    Contact.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Contact.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Contact.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  res.status(200).json({
    status: 'success',
    stats: {
      byStatus: statusStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      byPriority: priorityStats.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {}),
      today: totalToday,
    },
  });
});

export default {
  submitContact,
  getContacts,
  getContactById,
  updateContact,
  respondToContact,
  deleteContact,
  getContactStats,
};
