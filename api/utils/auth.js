const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * SMF Authentication Utilities
 * Handles SMF 1.x and 2.x password verification
 * Includes Discourse SSO integration
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SSO_SECRET = process.env.DISCOURSE_SSO_SECRET || 'change-this-discourse-sso-secret-key';

/**
 * Hash password using SMF method
 * @param {string} password - Plain text password
 * @param {string} username - Username (used as salt in SMF 1.x)
 * @param {string} salt - Optional salt for SMF 2.x
 * @returns {string} - Hashed password
 */
function hashPassword(password, username, salt = null) {
  if (salt) {
    // SMF 2.x format: SHA-1(username + password + salt)
    return crypto
      .createHash('sha1')
      .update(username.toLowerCase() + password + salt)
      .digest('hex');
  } else {
    // SMF 1.x format: SHA-1(username + password)
    return crypto
      .createHash('sha1')
      .update(username.toLowerCase() + password)
      .digest('hex');
  }
}

/**
 * Verify SMF password
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - Stored hash from database
 * @param {string} username - Username
 * @param {string} salt - Salt from database (can be null for SMF 1.x)
 * @returns {boolean} - True if password matches
 */
function verifyPassword(password, hashedPassword, username, salt = null) {
  try {
    // Try SMF 2.x format first (with salt)
    if (salt) {
      const computedHashWithSalt = hashPassword(password, username, salt);
      if (computedHashWithSalt === hashedPassword) {
        return true;
      }
    }
    
    // Try SMF 1.x format (without salt)
    const computedHashWithoutSalt = hashPassword(password, username, null);
    if (computedHashWithoutSalt === hashedPassword) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate JWT token for authenticated user
 * @param {object} user - User object
 * @returns {string} - JWT token
 */
function generateToken(user) {
  // Check if user is admin (id_group = 1 is admin in SMF, or specific user IDs)
  const isAdmin = user.id_group === 1 || user.id_member === 1 || user.id_member === 17667; // zohard is admin
  
  const payload = {
    id: user.id_member,
    username: user.member_name,
    email: user.email_address,
    isAdmin: isAdmin,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded token or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Extract token from request headers or cookies
 * @param {object} req - Express request object
 * @returns {string|null} - Token or null if not found
 */
function extractToken(req) {
  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.slice(7);
  }
  
  // Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
}

/**
 * Sanitize user data for client response
 * @param {object} user - User object from database
 * @returns {object} - Sanitized user object
 */
function sanitizeUser(user) {
  // Check if user is admin (id_group = 1 is admin in SMF, or specific user IDs)
  const isAdmin = user.id_group === 1 || user.id_member === 1 || user.id_member === 17667; // zohard is admin
  
  return {
    id: user.id_member,
    username: user.member_name,
    email: user.email_address,
    registrationDate: user.date_registered,
    lastLogin: user.last_login,
    posts: user.posts || 0,
    avatar: user.avatar || null,
    isAdmin: isAdmin
  };
}

/**
 * Validate Discourse SSO signature
 * @param {string} sso - Base64 encoded SSO payload
 * @param {string} sig - HMAC-SHA256 signature
 * @returns {boolean} - True if signature is valid
 */
function validateSSOSignature(sso, sig) {
  const computedSig = crypto.createHmac('sha256', SSO_SECRET).update(sso).digest('hex');
  return sig === computedSig;
}

/**
 * Decode SSO payload
 * @param {string} sso - Base64 encoded SSO payload
 * @returns {object} - Decoded parameters
 */
function decodeSSOPayload(sso) {
  const payload = Buffer.from(sso, 'base64').toString('utf8');
  const params = new URLSearchParams(payload);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * Create SSO response payload
 * @param {object} user - User object
 * @param {string} nonce - Nonce from Discourse request
 * @returns {object} - {sso, sig} for redirect to Discourse
 */
function createSSOResponse(user, nonce) {
  const payload = new URLSearchParams({
    nonce: nonce,
    email: user.email,
    external_id: user.id.toString(),
    username: user.username,
    name: user.username, // Use username as display name
    admin: user.isAdmin ? 'true' : 'false',
    moderator: user.isAdmin ? 'true' : 'false' // Admins are also moderators
  }).toString();

  const base64Payload = Buffer.from(payload).toString('base64');
  const signature = crypto.createHmac('sha256', SSO_SECRET).update(base64Payload).digest('hex');

  return {
    sso: base64Payload,
    sig: signature
  };
}

/**
 * Generate a secure logout token for Discourse
 * @param {object} user - User object
 * @returns {string} - Logout token
 */
function generateLogoutToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    logout: true,
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '5m' }); // Short expiry for logout
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  extractToken,
  sanitizeUser,
  validateSSOSignature,
  decodeSSOPayload,
  createSSOResponse,
  generateLogoutToken
};