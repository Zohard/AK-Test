const swaggerJsdoc = require('swagger-jsdoc');

const port = process.env.PORT || 3000;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Anime-Kun API',
      version: '2.0.0',
      description: 'RESTful API for anime and manga database with layered architecture',
      contact: {
        name: 'Anime-Kun Team',
        email: 'contact@anime-kun.com',
        url: 'https://anime-kun.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server'
      },
      {
        url: 'https://api.anime-kun.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login'
        }
      }
    },
    tags: [
      {
        name: 'General',
        description: 'General API information and health checks'
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'SSO',
        description: 'Single Sign-On integration with Discourse'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Animes',
        description: 'Anime-related operations'
      },
      {
        name: 'Mangas',
        description: 'Manga-related operations'
      },
      {
        name: 'Reviews',
        description: 'Review and rating operations'
      },
      {
        name: 'Admin - Users',
        description: 'Admin-only user management operations'
      },
      {
        name: 'Admin - Animes',
        description: 'Admin-only anime management operations'
      },
      {
        name: 'Admin - Mangas',
        description: 'Admin-only manga management operations'
      },
      {
        name: 'Admin - Reviews',
        description: 'Admin-only review management operations'
      }
    ]
  },
  apis: [
    './src/layers/router/*.js', // Path to the router files
    './app.js' // Main server file
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = {
  swaggerSpec,
  swaggerOptions
};