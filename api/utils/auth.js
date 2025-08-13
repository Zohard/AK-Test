const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * SMF Authentication Utilities
 * Handles SMF 1.x and 2.x password verification
 * Includes Discourse SSO integration and refresh token management
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Shorter access token
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'; // Longer refresh token
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
 * Generate refresh token
 * @param {object} user - User object
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<string>} - Refresh token
 */
async function generateRefreshToken(user, ipAddress = null, userAgent = null) {
  try {
    // Generate secure random token
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Store refresh token in database
    await pool.query(`
      INSERT INTO ak_refresh_tokens (token, user_id, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [token, user.id_member, expiresAt, ipAddress, userAgent]);

    return token;
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Verify and consume refresh token
 * @param {string} token - Refresh token
 * @returns {Promise<object|null>} - User object or null if invalid
 */
async function verifyRefreshToken(token) {
  try {
    const result = await pool.query(`
      SELECT rt.*, sm.id_member, sm.member_name, sm.email_address, sm.id_group
      FROM ak_refresh_tokens rt
      JOIN smf_members sm ON rt.user_id = sm.id_member
      WHERE rt.token = $1 
        AND rt.expires_at > CURRENT_TIMESTAMP 
        AND rt.is_revoked = FALSE
    `, [token]);

    if (result.rows.length === 0) {
      return null;
    }

    const tokenData = result.rows[0];
    
    // Revoke the used refresh token (rotation)
    await pool.query(
      'UPDATE ak_refresh_tokens SET is_revoked = TRUE WHERE token = $1',
      [token]
    );

    return {
      id_member: tokenData.id_member,
      member_name: tokenData.member_name,
      email_address: tokenData.email_address,
      id_group: tokenData.id_group
    };
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return null;
  }
}

/**
 * Revoke all refresh tokens for a user
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function revokeAllRefreshTokens(userId) {
  try {
    await pool.query(
      'UPDATE ak_refresh_tokens SET is_revoked = TRUE WHERE user_id = $1',
      [userId]
    );
  } catch (error) {
    console.error('Error revoking refresh tokens:', error);
    throw new Error('Failed to revoke refresh tokens');
  }
}

/**
 * Revoke specific refresh token
 * @param {string} token - Refresh token to revoke
 * @returns {Promise<void>}
 */
async function revokeRefreshToken(token) {
  try {
    await pool.query(
      'UPDATE ak_refresh_tokens SET is_revoked = TRUE WHERE token = $1',
      [token]
    );
  } catch (error) {
    console.error('Error revoking refresh token:', error);
    throw new Error('Failed to revoke refresh token');
  }
}

/**
 * Generate password reset token
 * @param {object} user - User object
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<string>} - Reset token
 */
async function generatePasswordResetToken(user, ipAddress = null, userAgent = null) {
  try {
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Store reset token in database
    await pool.query(`
      INSERT INTO ak_password_reset_tokens (token, user_id, email, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [token, user.id_member, user.email_address, expiresAt, ipAddress, userAgent]);

    return token;
  } catch (error) {
    console.error('Error generating password reset token:', error);
    throw new Error('Failed to generate password reset token');
  }
}

/**
 * Verify password reset token
 * @param {string} token - Reset token
 * @returns {Promise<object|null>} - Token data or null if invalid
 */
async function verifyPasswordResetToken(token) {
  try {
    const result = await pool.query(`
      SELECT prt.*, sm.id_member, sm.member_name, sm.email_address
      FROM ak_password_reset_tokens prt
      JOIN smf_members sm ON prt.user_id = sm.id_member
      WHERE prt.token = $1 
        AND prt.expires_at > CURRENT_TIMESTAMP 
        AND prt.is_used = FALSE
    `, [token]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error verifying password reset token:', error);
    return null;
  }
}

/**
 * Mark password reset token as used
 * @param {string} token - Reset token
 * @returns {Promise<void>}
 */
async function markPasswordResetTokenUsed(token) {
  try {
    await pool.query(`
      UPDATE ak_password_reset_tokens 
      SET is_used = TRUE, used_at = CURRENT_TIMESTAMP 
      WHERE token = $1
    `, [token]);
  } catch (error) {
    console.error('Error marking password reset token as used:', error);
    throw new Error('Failed to mark token as used');
  }
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
  generateLogoutToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenUsed
};