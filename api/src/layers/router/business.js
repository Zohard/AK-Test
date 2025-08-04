const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken: authMiddleware, requireAdmin: adminMiddleware } = require('../../../middleware/auth');
const controllers = require('../presentation');

const router = express.Router();
const businessController = controllers.business;

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../../../frontend/public/images/business/'));
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${name}-${timestamp}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Business:
 *       type: object
 *       properties:
 *         id_business:
 *           type: integer
 *           description: Unique business ID
 *         type:
 *           type: string
 *           description: Business type
 *           enum: [Personnalité, Editeur, Studio, Chaîne TV, Association, Magazine, Evénement, Divers]
 *         denomination:
 *           type: string
 *           description: Business denomination (main name)
 *         autres_denominations:
 *           type: string
 *           description: Other denominations (alternative names)
 *         image:
 *           type: string
 *           description: Image filename/path
 *         date:
 *           type: string
 *           description: Creation/birth date
 *         origine:
 *           type: string
 *           description: Country of origin
 *         site_officiel:
 *           type: string
 *           format: uri
 *           description: Official website URL
 *         statut:
 *           type: string
 *           description: Business status
 *       required:
 *         - type
 *         - denomination
 *     BusinessInput:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           description: Business type
 *           enum: [Personnalité, Editeur, Studio, Chaîne TV, Association, Magazine, Evénement, Divers]
 *         denomination:
 *           type: string
 *           description: Business denomination (main name)
 *         autres_denominations:
 *           type: string
 *           description: Other denominations (alternative names)
 *         image:
 *           type: string
 *           description: Image filename/path
 *         date:
 *           type: string
 *           description: Creation/birth date
 *         origine:
 *           type: string
 *           description: Country of origin
 *         site_officiel:
 *           type: string
 *           format: uri
 *           description: Official website URL
 *       required:
 *         - type
 *         - denomination
 */

/**
 * @swagger
 * /api/admin/business/types:
 *   get:
 *     summary: Get available business types
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
/**
 * @swagger
 * /api/admin/business/upload-image:
 *   post:
 *     summary: Upload image for business
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 filename:
 *                   type: string
 *                   description: Uploaded filename
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid file or upload error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/upload-image', authMiddleware, adminMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    res.json({
      success: true,
      filename: req.file.filename,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

router.get('/types', authMiddleware, adminMiddleware, businessController.getBusinessTypes);

/**
 * @swagger
 * /api/admin/business/countries:
 *   get:
 *     summary: Get available business countries
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business countries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/countries', authMiddleware, adminMiddleware, businessController.getBusinessCountries);

/**
 * @swagger
 * /api/admin/business:
 *   get:
 *     summary: Get all businesses with pagination and filtering
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in denomination and other denominations
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by business type
 *       - in: query
 *         name: origine
 *         schema:
 *           type: string
 *         description: Filter by country of origin
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [denomination, type, origine, date]
 *           default: denomination
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Businesses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Business'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', authMiddleware, adminMiddleware, businessController.getBusinesses);

/**
 * @swagger
 * /api/admin/business:
 *   post:
 *     summary: Create a new business
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusinessInput'
 *     responses:
 *       201:
 *         description: Business created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Business'
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', authMiddleware, adminMiddleware, businessController.createBusiness);

/**
 * @swagger
 * /api/admin/business/{id}:
 *   get:
 *     summary: Get business by ID
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Business retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Business'
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *       404:
 *         description: Business not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:id', authMiddleware, adminMiddleware, businessController.getBusinessById);

/**
 * @swagger
 * /api/admin/business/{id}:
 *   put:
 *     summary: Update business by ID
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusinessInput'
 *     responses:
 *       200:
 *         description: Business updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Business'
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Business not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/:id', authMiddleware, adminMiddleware, businessController.updateBusiness);

/**
 * @swagger
 * /api/admin/business/{id}:
 *   delete:
 *     summary: Delete business by ID
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Business deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *       404:
 *         description: Business not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.delete('/:id', authMiddleware, adminMiddleware, businessController.deleteBusiness);

module.exports = router;