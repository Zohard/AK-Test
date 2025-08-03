const AnimeController = require('./AnimeController');
const MangaController = require('./MangaController');
const AuthController = require('./AuthController');
const ReviewController = require('./ReviewController');

// Create controller instances
const controllers = {
  anime: new AnimeController(),
  manga: new MangaController(),
  auth: new AuthController(),
  review: new ReviewController()
};

module.exports = controllers;