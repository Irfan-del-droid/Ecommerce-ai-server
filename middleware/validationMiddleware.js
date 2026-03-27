/**
 * Validation Middleware
 * Request validation and sanitization
 */

import { AppError } from './errorMiddleware.js';

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (10 digits)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 number
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasMinLength && (hasUppercase || hasNumber);
};

/**
 * Sanitize string input
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/<[^>]*>/g, ''); // Remove HTML tags
};

/**
 * Validate signup request
 */
export const validateSignup = (req, res, next) => {
  const { firstName, lastName, email, phone, password } = req.body;
  const errors = [];

  if (!firstName || firstName.trim().length < 1) {
    errors.push('First name is required');
  }

  if (!lastName || lastName.trim().length < 1) {
    errors.push('Last name is required');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (phone && !isValidPhone(phone)) {
    errors.push('Phone number must be 10 digits');
  }

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400, errors));
  }

  // Sanitize inputs
  req.body.firstName = sanitizeString(firstName);
  req.body.lastName = sanitizeString(lastName);
  req.body.email = email.toLowerCase().trim();
  req.body.phone = phone ? phone.trim() : undefined;

  next();
};

/**
 * Validate login request
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400, errors));
  }

  req.body.email = email.toLowerCase().trim();

  next();
};

/**
 * Validate contact form
 */
export const validateContact = (req, res, next) => {
  const { name, email, message } = req.body;
  const errors = [];

  if (!name || name.trim().length < 1) {
    errors.push('Name is required');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!message || message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400, errors));
  }

  // Sanitize inputs
  req.body.name = sanitizeString(name);
  req.body.email = email.toLowerCase().trim();
  req.body.message = sanitizeString(message);
  if (req.body.subject) {
    req.body.subject = sanitizeString(req.body.subject);
  }

  next();
};

/**
 * Validate newsletter subscription
 */
export const validateNewsletter = (req, res, next) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return next(new AppError('Valid email is required', 400));
  }

  req.body.email = email.toLowerCase().trim();

  next();
};

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    if (!id || !objectIdRegex.test(id)) {
      return next(new AppError(`Invalid ${paramName} format`, 400));
    }

    next();
  };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
  let { page, limit } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 20;

  // Enforce limits
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
  };

  next();
};

export default {
  validateSignup,
  validateLogin,
  validateContact,
  validateNewsletter,
  validateObjectId,
  validatePagination,
  isValidEmail,
  isValidPhone,
  sanitizeString,
};
