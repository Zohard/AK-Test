const AnimeService = require('./AnimeService');
const MangaService = require('./MangaService');
const AuthService = require('./AuthService');
const ReviewService = require('./ReviewService');

// Create service instances
const services = {
  anime: new AnimeService(),
  manga: new MangaService(),
  auth: new AuthService(),
  review: new ReviewService()
};

module.exports = services;