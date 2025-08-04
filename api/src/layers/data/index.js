const AnimeRepository = require('./AnimeRepository');
const MangaRepository = require('./MangaRepository');
const UserRepository = require('./UserRepository');
const ReviewRepository = require('./ReviewRepository');
const BusinessRepository = require('./BusinessRepository');

// Create repository instances
const repositories = {
  anime: new AnimeRepository(),
  manga: new MangaRepository(),
  user: new UserRepository(),
  review: new ReviewRepository(),
  business: new BusinessRepository()
};

module.exports = repositories;