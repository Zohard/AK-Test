const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const pool = require('../config/database');
const { 
  verifyPassword, 
  generateToken, 
  sanitizeUser, 
  generateRefreshToken,
  verifyRefreshToken,
  revokeAllRefreshTokens,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenUsed
} = require('../utils/auth');
const { authenticateToken: authMiddleware } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *     RegisterRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/AuthRequest'
 *         - type: object
 *           required:
 *             - username
 *           properties:
 *             username:
 *               type: string
 *               minLength: 3
 *             realName:
 *               type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Registration failed
 */
router.post('/register', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('username').isLength({ min: 3 }).withMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, username, realName } = req.body;
    
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM smf_members WHERE email_address = $1 OR member_name = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Insert user
    const result = await pool.query(`
      INSERT INTO smf_members (member_name, real_name, email_address, passwd, date_registered, id_group)
      VALUES ($1, $2, $3, $4, EXTRACT(EPOCH FROM NOW())::INTEGER, 0)
      RETURNING id_member, member_name, email_address, real_name, date_registered
    `, [username, realName || username, email, hashedPassword]);
    
    const user = result.rows[0];
    const token = generateToken(user);
    const refreshToken = await generateRefreshToken(
      user,
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent')
    );
    
    res.status(201).json({ 
      token, 
      refreshToken,
      user: sanitizeUser(user),
      message: 'Inscription réussie'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur et retourne un token JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nom d'utilisateur ou adresse email
 *                 example: "zohard"
 *               password:
 *                 type: string
 *                 description: Mot de passe
 *                 example: "motdepasse123"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT pour l'authentification
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Identifiants incorrects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', [
  body('password').notEmpty().withMessage('Mot de passe requis'),
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.username) {
      throw new Error('Email ou nom d\'utilisateur requis');
    }
    if (req.body.email && !req.body.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Format d\'email invalide');
    }
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, username, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM smf_members WHERE email_address = $1 OR member_name = $2',
      [email, username]
    );
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Verify SMF password
    const isPasswordValid = verifyPassword(
      password, 
      user.passwd, 
      user.member_name, 
      user.password_salt
    );
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await pool.query(
      'UPDATE smf_members SET last_login = EXTRACT(EPOCH FROM NOW())::INTEGER WHERE id_member = $1',
      [user.id_member]
    );
    
    const token = generateToken(user);
    const refreshToken = await generateRefreshToken(
      user,
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent')
    );
    
    res.json({ 
      token, 
      refreshToken,
      user: sanitizeUser(user),
      message: 'Connexion réussie'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authMiddleware, (req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just send a success response as the client
  // will remove the token from storage
  res.json({ message: 'Déconnexion réussie' });
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_member, member_name, real_name, email_address, 
             date_registered, posts, nb_critiques, nb_synopsis, 
             nb_contributions, experience, id_group
      FROM smf_members 
      WHERE id_member = $1
    `, [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    
    const user = result.rows[0];
    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Token is invalid
 */
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    // If we get here, the token is valid (middleware passed)
    const result = await pool.query(`
      SELECT id_member, member_name, real_name, email_address, id_group
      FROM smf_members 
      WHERE id_member = $1
    `, [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    
    res.json({ 
      valid: true, 
      user: sanitizeUser(result.rows[0])
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du token' });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Token de rafraîchissement requis' });
    }
    
    // Verify and consume the refresh token
    const user = await verifyRefreshToken(refreshToken);
    
    if (!user) {
      return res.status(401).json({ error: 'Token de rafraîchissement invalide ou expiré' });
    }
    
    // Generate new tokens
    const newAccessToken = generateToken(user);
    const newRefreshToken = await generateRefreshToken(
      user,
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent')
    );
    
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: sanitizeUser(user),
      message: 'Tokens rafraîchis avec succès'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Erreur lors du rafraîchissement du token' });
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Password reset email sent (always returns success for security)
 *       400:
 *         description: Invalid email format
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Format d\'email invalide')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;
    
    // Find user by email
    const result = await pool.query(
      'SELECT * FROM smf_members WHERE email_address = $1',
      [email]
    );
    
    // Always return success for security (don't reveal if email exists)
    if (result.rows.length === 0) {
      return res.json({ 
        message: 'Si cette adresse email existe, vous recevrez un lien de réinitialisation' 
      });
    }
    
    const user = result.rows[0];
    
    // Generate reset token
    const resetToken = await generatePasswordResetToken(
      user,
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent')
    );
    
    // TODO: Send email with reset link
    // For now, log the token (in production, send email)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);
    
    res.json({ 
      message: 'Si cette adresse email existe, vous recevrez un lien de réinitialisation',
      // Remove this in production:
      resetToken: resetToken // Only for development/testing
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation' });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or password requirements not met
 *       500:
 *         description: Server error
 */
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token de réinitialisation requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { token, newPassword } = req.body;
    
    // Verify reset token
    const tokenData = await verifyPasswordResetToken(token);
    
    if (!tokenData) {
      return res.status(400).json({ error: 'Token de réinitialisation invalide ou expiré' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user password
    await pool.query(
      'UPDATE smf_members SET passwd = $1 WHERE id_member = $2',
      [hashedPassword, tokenData.id_member]
    );
    
    // Mark token as used
    await markPasswordResetTokenUsed(token);
    
    // Revoke all refresh tokens for security
    await revokeAllRefreshTokens(tokenData.id_member);
    
    res.json({ 
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
  }
});

module.exports = router;