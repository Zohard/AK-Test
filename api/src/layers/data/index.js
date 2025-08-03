const AnimeRepository = require('./AnimeRepository');
const MangaRepository = require('./MangaRepository');
const UserRepository = require('./UserRepository');
const ReviewRepository = require('./ReviewRepository');

// Create repository instances
const repositories = {
  anime: new AnimeRepository(),
  manga: new MangaRepository(),
  user: new UserRepository(),
  review: new ReviewRepository()
};

module.exports = repositories;