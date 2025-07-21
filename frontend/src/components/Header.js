import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Header = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="header">
      <div className="header-container">
        <a href="/" className="logo">
          <img src="/logo.png" alt="ANIME-KUN" className="logo-image" />
        </a>
        
        <nav>
          <ul className="nav">
            <li><a href="/">Accueil</a></li>
            <li><a href="/anime">Anime</a></li>
            <li><a href="/manga">Manga</a></li>
            <li><a href="/critiques">Critiques</a></li>
            <li><a href="/webzine">Webzine</a></li>
            <li><a href="/forum">Forum</a></li>
          </ul>
        </nav>

        <div className="header-actions">
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Basculer vers le mode clair' : 'Basculer vers le mode sombre'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <a href="/connexion" className="auth-link">
            Connexion / Inscription
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;