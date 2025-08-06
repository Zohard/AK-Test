const express = require('express');
const router = express.Router();

const animeRoutes = require('./anime');
const mangaRoutes = require('./manga');
const authRoutes = require('./auth');
const userRoutes = require('./user');
const adminRoutes = require('./admin');
const searchRoutes = require('./search');
const businessRoutes = require('./business');

module.exports = (app) => {
  app.use('/api/animes', animeRoutes);
  app.use('/api/mangas', mangaRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/business', businessRoutes);
  
  // Root route
  app.get('/', (req, res) => {
    res.json({
      message: 'Anime-Kun API v2.0',
      documentation: '/docs'
    });
  });
};
