const BaseController = require('./BaseController');
const services = require('../service');

class AuthController extends BaseController {
  constructor() {
    super(services.auth);
  }

  // POST /api/auth/login
  login = this.asyncHandler(async (req, res) => {
    try {
      const { username, password } = req.body;

      const requiredFields = ['username', 'password'];
      const errors = this.validateRequired(req, requiredFields);
      if (errors.length > 0) {
        return this.validationError(res, errors);
      }

      const result = await this.service.login(username, password);
      
      // Set HTTP-only cookie for token (optional, for web clients)
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return this.success(res, result, 'Login successful');
    } catch (error) {
      if (error.message.includes('Invalid credentials') || error.message.includes('not activated')) {
        return this.unauthorized(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // POST /api/auth/register
  register = this.asyncHandler(async (req, res) => {
    try {
      const { username, email, password, realName } = req.body;

      const requiredFields = ['username', 'email', 'password'];
      const errors = this.validateRequired(req, requiredFields);
      if (errors.length > 0) {
        return this.validationError(res, errors);
      }

      const result = await this.service.register({
        username,
        email,
        password,
        realName
      });

      // Set HTTP-only cookie for token
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return this.success(res, result, 'Registration successful', 201);
    } catch (error) {
      if (error.message.includes('already exists')) {
        return this.error(res, error.message, 409); // Conflict
      }
      return this.error(res, error.message);
    }
  });

  // POST /api/auth/logout
  logout = this.asyncHandler(async (req, res) => {
    try {
      const user = this.getUser(req);
      if (!user) {
        return this.unauthorized(res);
      }

      const result = await this.service.logout(user.id);

      // Clear the cookie
      res.clearCookie('token');

      return this.success(res, result, 'Logout successful');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/auth/profile
  getProfile = this.asyncHandler(async (req, res) => {
    try {
      const user = this.getUser(req);
      if (!user) {
        return this.unauthorized(res);
      }

      const profile = await this.service.getUserProfile(user.id);
      
      return this.success(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/auth/verify
  verifyToken = this.asyncHandler(async (req, res) => {
    try {
      const user = this.getUser(req);
      if (!user) {
        return this.unauthorized(res);
      }

      // Token is already verified by middleware, just return user info
      return this.success(res, {
        valid: true,
        user: user
      }, 'Token is valid');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // SSO Endpoints
  // GET /sso
  handleSSO = this.asyncHandler(async (req, res) => {
    try {
      const { sso, sig } = req.query;

      if (!sso || !sig) {
        return this.validationError(res, ['SSO parameters are required']);
      }

      const ssoData = await this.service.handleSSOLogin(sso, sig);
      
      // Redirect to login page with SSO data
      const loginUrl = `/login?sso=${encodeURIComponent(sso)}&sig=${sig}&return_url=${encodeURIComponent(ssoData.return_sso_url)}`;
      
      return res.redirect(loginUrl);
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // POST /sso/authenticate
  authenticateSSO = this.asyncHandler(async (req, res) => {
    try {
      const { username, password, nonce, return_sso_url } = req.body;

      const requiredFields = ['username', 'password', 'nonce', 'return_sso_url'];
      const errors = this.validateRequired(req, requiredFields);
      if (errors.length > 0) {
        return this.validationError(res, errors);
      }

      // Authenticate user
      const loginResult = await this.service.login(username, password);
      
      // Create SSO response
      const ssoResponse = await this.service.createSSOResponse(loginResult.user, nonce);
      
      // Redirect to Discourse with SSO response
      const redirectUrl = `${return_sso_url}?sso=${encodeURIComponent(ssoResponse.sso)}&sig=${ssoResponse.sig}`;
      
      return res.redirect(redirectUrl);
    } catch (error) {
      if (error.message.includes('Invalid credentials')) {
        return this.unauthorized(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // POST /sso/logout
  logoutSSO = this.asyncHandler(async (req, res) => {
    try {
      const user = this.getUser(req);
      if (!user) {
        return this.unauthorized(res);
      }

      const result = await this.service.logout(user.id);

      // Clear the cookie
      res.clearCookie('token');

      return this.success(res, {
        ...result,
        discourse_logout_url: process.env.DISCOURSE_LOGOUT_URL || '/logout'
      }, 'SSO logout successful');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // Admin endpoints
  // GET /api/admin/users
  getUsers = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      const pagination = this.getPagination(req);
      const filters = this.getFilters(req, ['search', 'group', 'status']);

      const result = await this.service.getUsers(filters, pagination);
      
      return this.success(res, result, 'Users retrieved successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/admin/users/statistics
  getUserStatistics = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      const stats = await this.service.getUserStatistics();
      
      return this.success(res, stats, 'User statistics retrieved');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/users/:id
  getUser = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const requestingUser = this.getUser(req);

      // Users can only view their own profile unless they're admin
      if (!requestingUser || (parseInt(id) !== requestingUser.id && !requestingUser.isAdmin)) {
        return this.forbidden(res);
      }

      const user = await this.service.getUserProfile(parseInt(id));
      
      return this.success(res, user, 'User profile retrieved');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // PUT /api/users/:id
  updateUser = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const requestingUser = this.getUser(req);

      // Users can only update their own profile unless they're admin
      if (!requestingUser || (parseInt(id) !== requestingUser.id && !requestingUser.isAdmin)) {
        return this.forbidden(res);
      }

      // For now, return not implemented as user updates need more complex logic
      return this.error(res, 'User profile updates not yet implemented', 501);
    } catch (error) {
      return this.error(res, error.message);
    }
  });
}

module.exports = AuthController;