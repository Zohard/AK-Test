const AnimeService = require('./AnimeService');
const MangaService = require('./MangaService');
const AuthService = require('./AuthService');
const ReviewService = require('./ReviewService');
const BusinessService = require('./BusinessService');

// Create service instances
const services = {
  anime: new AnimeService(),
  manga: new MangaService(),
  auth: new AuthService(),
  review: new ReviewService(),
  business: new BusinessService()
};

module.exports = services;