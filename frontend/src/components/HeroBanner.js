import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HeroBanner = () => {
  const [animes, setAnimes] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentAnimes();
  }, []);

  useEffect(() => {
    if (animes.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % animes.length);
      }, 5000); // Auto-rotate every 5 seconds

      return () => clearInterval(interval);
    }
  }, [animes.length]);

  const fetchRecentAnimes = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/animes?limit=5&recent=true');
      if (response.data.data && response.data.data.length > 0) {
        setAnimes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recent animes:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % animes.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + animes.length) % animes.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  if (loading) {
    return (
      <div className="hero-carousel">
        <div className="loading">Chargement des animes récents...</div>
      </div>
    );
  }

  if (animes.length === 0) {
    return (
      <div className="hero-carousel">
        <div className="error">Aucun anime trouvé</div>
      </div>
    );
  }

  const currentAnime = animes[currentSlide];

  return (
    <div className="hero-carousel">
      <div className="carousel-container">
        {/* Main slide */}
        <div className="carousel-slide">
          {currentAnime.image && (
            <img 
              src={`/images/${currentAnime.image}`} 
              alt={currentAnime.titre}
              className="hero-image"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <div className="anime-meta">
              <span className="anime-year">{currentAnime.annee}</span>
              <span className="anime-episodes">{currentAnime.nb_ep} épisodes</span>
            </div>
            <h1 className="hero-title">{currentAnime.titre}</h1>
            <p className="hero-subtitle">
              {currentAnime.synopsis ? 
                currentAnime.synopsis.substring(0, 200) + (currentAnime.synopsis.length > 200 ? '...' : '') :
                'Découvrez cet anime passionnant'
              }
            </p>
            <div className="hero-actions">
              <button className="hero-button primary">
                Découvrir
              </button>
              <button className="hero-button secondary">
                Voir la fiche
              </button>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <button 
          className="carousel-nav prev" 
          onClick={prevSlide}
          aria-label="Anime précédent"
        >
          ‹
        </button>
        <button 
          className="carousel-nav next" 
          onClick={nextSlide}
          aria-label="Anime suivant"
        >
          ›
        </button>

        {/* Dots indicator */}
        <div className="carousel-dots">
          {animes.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Aller à l'anime ${index + 1}`}
            />
          ))}
        </div>

        {/* Thumbnails */}
        <div className="carousel-thumbnails">
          {animes.map((anime, index) => (
            <div
              key={anime.id_anime}
              className={`thumbnail ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            >
              {anime.image && (
                <img 
                  src={`/images/${anime.image}`} 
                  alt={anime.titre}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div className="thumbnail-overlay">
                <span className="thumbnail-title">{anime.titre}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;