const express = require('express');
const { authMiddleware, adminMiddleware } = require('../../middleware/auth');
const controllers = require('../presentation');

const router = express.Router();
const authController = controllers.auth;

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *         username:
 *           type: string
 *           description: Username
 *         email:
 *           type: string
 *           description: Email address
 *         registrationDate:
 *           type: integer
 *           description: Registration timestamp
 *         lastLogin:
 *           type: integer
 *           description: Last login timestamp
 *         posts:
 *           type: integer
 *           description: Number of posts
 *         avatar:
 *           type: string
 *           description: Avatar URL
 *         isAdmin:
 *           type: boolean
 *           description: Admin status
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Username or email
 *         password:
 *           type: string
 *           description: Password
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Username
 *         email:
 *           type: string
 *           description: Email address
 *         password:
 *           type: string
 *           description: Password
 *         realName:
 *           type: string
 *           description: Real name (optional)
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT token
 *         user:
 *           $ref: '#/components/schemas/User'
 */

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
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: User already exists
 *       400:
 *         description: Validation error
 */
router.post('/register', authController.register);

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
router.post('/logout', authMiddleware, authController.logout);

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
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authMiddleware, authController.getProfile);

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
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid token
 */
router.get('/verify', authMiddleware, authController.verifyToken);

// SSO Routes
/**
 * @swagger
 * /sso:
 *   get:
 *     summary: Handle SSO login request from Discourse
 *     tags: [SSO]
 *     parameters:
 *       - in: query
 *         name: sso
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64 encoded SSO payload
 *       - in: query
 *         name: sig
 *         required: true
 *         schema:
 *           type: string
 *         description: HMAC-SHA256 signature
 *     responses:
 *       302:
 *         description: Redirect to login page
 *       400:
 *         description: Invalid SSO parameters
 */
router.get('/sso', authController.handleSSO);

/**
 * @swagger
 * /sso/authenticate:
 *   post:
 *     summary: Authenticate user for SSO
 *     tags: [SSO]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - nonce
 *               - return_sso_url
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               nonce:
 *                 type: string
 *               return_sso_url:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirect to Discourse with SSO response
 *       401:
 *         description: Invalid credentials
 */
router.post('/sso/authenticate', authController.authenticateSSO);

/**
 * @swagger
 * /sso/logout:
 *   post:
 *     summary: SSO logout
 *     tags: [SSO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SSO logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/sso/logout', authMiddleware, authController.logoutSSO);

// User Management Routes
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get('/users/:id', authMiddleware, authController.getUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               realName:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       403:
 *         description: Access denied
 *       501:
 *         description: Not implemented
 */
router.put('/users/:id', authMiddleware, authController.updateUser);

// Admin Routes
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/admin/users', authMiddleware, adminMiddleware, authController.getUsers);

/**
 * @swagger
 * /api/admin/users/statistics:
 *   get:
 *     summary: Get user statistics (admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved
 *       403:
 *         description: Admin access required
 */
router.get('/admin/users/statistics', authMiddleware, adminMiddleware, authController.getUserStatistics);

module.exports = router;