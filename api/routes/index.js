const express = require('express');
const router = express.Router();

const animeRoutes = require('./anime');
const mangaRoutes = require('./manga');
const authRoutes = require('./auth');
const userRoutes = require('./user');
const adminRoutes = require('./admin');
const searchRoutes = require('./search');
const reviewRoutes = require('./reviews');
const businessRoutes = require('./business');
const tagsRoutes = require('./tags');

module.exports = (app) => {
  app.use('/api/animes', animeRoutes);
  app.use('/api/mangas', mangaRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/business', businessRoutes);
  app.use('/api/tags', tagsRoutes);
  
  // Root route
  app.get('/', (req, res) => {
    res.json({
      message: 'Anime-Kun API v2.0',
      documentation: '/docs'
    });
  });
};
