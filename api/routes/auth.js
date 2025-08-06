const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const pool = require('../config/database');
const { verifyPassword, generateToken, sanitizeUser } = require('../utils/auth');
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
    const token = generateToken({
      userId: user.id_member,
      username: user.member_name,
      role: 'user'
    });
    
    res.status(201).json({ 
      token, 
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
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed
 */
router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM smf_members WHERE email_address = $1',
      [email]
    );
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isValidPassword = await verifyPassword(password, user.passwd);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    // Update last login
    await pool.query(
      'UPDATE smf_members SET last_login = EXTRACT(EPOCH FROM NOW())::INTEGER WHERE id_member = $1',
      [user.id_member]
    );
    
    const token = generateToken({
      userId: user.id_member,
      username: user.member_name,
      role: user.id_group === 1 ? 'admin' : 'user'
    });
    
    res.json({ 
      token, 
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

module.exports = router;