const AnimeController = require('./AnimeController');
const MangaController = require('./MangaController');
const AuthController = require('./AuthController');
const ReviewController = require('./ReviewController');
const BusinessController = require('./BusinessController');

// Create controller instances
const controllers = {
  anime: new AnimeController(),
  manga: new MangaController(),
  auth: new AuthController(),
  review: new ReviewController(),
  business: new BusinessController()
};

module.exports = controllers;