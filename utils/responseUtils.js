/**
 * Response Utilities
 * Standardized API response helpers
 */

/**
 * Success response
 */
export const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    ...data,
  });
};

/**
 * Created response
 */
export const createdResponse = (res, data) => {
  return successResponse(res, data, 201);
};

/**
 * Error response
 */
export const errorResponse = (res, message, statusCode = 400, errors = null) => {
  const response = {
    status: 'fail',
    error: message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Not found response
 */
export const notFoundResponse = (res, resource = 'Resource') => {
  return errorResponse(res, `${resource} not found`, 404);
};

/**
 * Unauthorized response
 */
export const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 401);
};

/**
 * Forbidden response
 */
export const forbiddenResponse = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 403);
};

/**
 * Validation error response
 */
export const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    status: 'fail',
    error: 'Validation failed',
    errors: Array.isArray(errors) ? errors : [errors],
  });
};

/**
 * Paginated response
 */
export const paginatedResponse = (res, data, pagination) => {
  const { total, page, limit, items } = pagination;
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    status: 'success',
    results: items.length,
    pagination: {
      total,
      page,
      limit,
      pages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    [data]: items,
  });
};

export default {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  paginatedResponse,
};
