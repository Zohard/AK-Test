const BaseService = require('./BaseService');
const repositories = require('../data');
const { verifyPassword, generateToken, sanitizeUser, validateSSOSignature, decodeSSOPayload, createSSOResponse, generateLogoutToken } = require('../../../utils/auth');

class AuthService extends BaseService {
  constructor() {
    super(repositories.user);
  }

  async login(username, password) {
    try {
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      // Find user by username or email
      const user = await this.repository.findByUsername(username) || 
                   await this.repository.findByEmail(username);

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if user is activated
      if (user.is_activated !== 1) {
        throw new Error('Account is not activated');
      }

      // Verify password using SMF hash method
      const isPasswordValid = verifyPassword(password, user.passwd, user.member_name, user.password_salt);
      
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await this.repository.updateLastLogin(user.id_member);

      // Generate JWT token
      const token = generateToken(user);
      const sanitizedUser = sanitizeUser(user);

      return {
        token,
        user: sanitizedUser
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async register(userData) {
    try {
      const { username, email, password, realName } = userData;

      // Validate input
      this.validateRegistrationData({ username, email, password, realName });

      // Check if user already exists
      const existingUser = await this.repository.findByUsername(username) || 
                           await this.repository.findByEmail(email);

      if (existingUser) {
        throw new Error('User already exists with this username or email');
      }

      // Hash password using SMF method
      const hashedPassword = this.hashPassword(password, username);
      const timestamp = Math.floor(Date.now() / 1000);

      const newUser = await this.repository.createUser({
        member_name: username,
        real_name: realName || username,
        email_address: email,
        passwd: hashedPassword,
        password_salt: null, // SMF 1.x style without salt
        date_registered: timestamp,
        last_login: timestamp,
        is_activated: 1
      });

      // Generate JWT token
      const token = generateToken(newUser);
      const sanitizedUser = sanitizeUser(newUser);

      return {
        token,
        user: sanitizedUser
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await this.repository.findByIdWithProfile(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return sanitizeUser(user);
    } catch (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }

  async verifyToken(token) {
    try {
      if (!token) {
        throw new Error('Token is required');
      }

      const { verifyToken } = require('../../../utils/auth');
      const decoded = verifyToken(token);
      
      if (!decoded) {
        throw new Error('Invalid token');
      }

      // Verify user still exists and is active
      const user = await this.repository.findById(decoded.id);
      if (!user || user.is_activated !== 1) {
        throw new Error('User account is inactive');
      }

      return sanitizeUser(user);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // SSO Methods
  async handleSSOLogin(sso, sig) {
    try {
      // Validate SSO signature
      if (!validateSSOSignature(sso, sig)) {
        throw new Error('Invalid SSO signature');
      }

      // Decode SSO payload
      const ssoData = decodeSSOPayload(sso);
      const { nonce, return_sso_url } = ssoData;

      if (!nonce || !return_sso_url) {
        throw new Error('Invalid SSO data');
      }

      return {
        nonce,
        return_sso_url,
        login_url: `/api/auth/login?sso=${encodeURIComponent(sso)}&sig=${sig}`
      };
    } catch (error) {
      throw new Error(`SSO login failed: ${error.message}`);
    }
  }

  async createSSOResponse(user, nonce) {
    try {
      if (!user || !nonce) {
        throw new Error('User and nonce are required');
      }

      return createSSOResponse(user, nonce);
    } catch (error) {
      throw new Error(`Failed to create SSO response: ${error.message}`);
    }
  }

  async logout(userId) {
    try {
      const user = await this.repository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate logout token for Discourse
      const logoutToken = generateLogoutToken(sanitizeUser(user));

      return {
        success: true,
        logoutToken
      };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  // Admin methods
  async getUsers(filters = {}, pagination = {}) {
    try {
      const { page, limit } = this.validatePagination(pagination.page, pagination.limit);
      
      const conditions = { is_activated: 1 };
      const options = {
        limit,
        offset: (page - 1) * limit,
        orderBy: 'date_registered',
        orderDirection: 'DESC'
      };

      const users = await this.repository.findAll(conditions, options);
      const totalCount = await this.repository.count(conditions);

      return {
        data: users.map(user => sanitizeUser(user)),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  async getUserStatistics() {
    try {
      return await this.repository.getUserStatistics();
    } catch (error) {
      throw new Error(`Failed to fetch user statistics: ${error.message}`);
    }
  }

  // Validation methods
  validateRegistrationData(data) {
    const { username, email, password, realName } = data;

    if (!username || username.length < 3 || username.length > 50) {
      throw new Error('Username must be between 3 and 50 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Valid email address is required');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (realName && realName.length > 100) {
      throw new Error('Real name is too long (max 100 characters)');
    }
  }

  hashPassword(password, username) {
    const crypto = require('crypto');
    return crypto
      .createHash('sha1')
      .update(username.toLowerCase() + password)
      .digest('hex');
  }
}

module.exports = AuthService;