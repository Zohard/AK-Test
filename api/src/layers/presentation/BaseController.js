class BaseController {
  constructor(service) {
    this.service = service;
  }

  // Success response helper
  success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Error response helper
  error(res, message, statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Validation error response
  validationError(res, errors) {
    return this.error(res, 'Validation failed', 400, errors);
  }

  // Not found response
  notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  // Unauthorized response
  unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401);
  }

  // Forbidden response
  forbidden(res, message = 'Access forbidden') {
    return this.error(res, message, 403);
  }

  // Handle async controller methods with error catching
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Extract pagination parameters
  getPagination(req) {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 items per page
    return { page, limit };
  }

  // Extract query filters
  getFilters(req, allowedFilters = []) {
    const filters = {};
    allowedFilters.forEach(filter => {
      if (req.query[filter] !== undefined) {
        filters[filter] = req.query[filter];
      }
    });
    return filters;
  }

  // Extract sort parameters
  getSorting(req, allowedFields = []) {
    const sort = req.query.sort;
    const direction = req.query.direction?.toUpperCase();

    if (sort && allowedFields.includes(sort)) {
      return {
        sort,
        direction: ['ASC', 'DESC'].includes(direction) ? direction : 'ASC'
      };
    }

    return {};
  }

  // Validate required fields
  validateRequired(req, fields) {
    const errors = [];
    fields.forEach(field => {
      if (!req.body[field]) {
        errors.push(`${field} is required`);
      }
    });
    return errors;
  }

  // Extract user info from request (set by auth middleware)
  getUser(req) {
    return req.user || null;
  }

  // Check if user is admin
  isAdmin(req) {
    const user = this.getUser(req);
    return user && user.isAdmin === true;
  }

  // Sanitize response data by removing sensitive fields
  sanitizeResponse(data, fieldsToRemove = []) {
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeItem(item, fieldsToRemove));
    }
    return this.sanitizeItem(data, fieldsToRemove);
  }

  sanitizeItem(item, fieldsToRemove) {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const sanitized = { ...item };
    fieldsToRemove.forEach(field => {
      delete sanitized[field];
    });

    return sanitized;
  }
}

module.exports = BaseController;