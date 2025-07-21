import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import ArticleCard from './components/ArticleCard';
import AnimeList from './components/AnimeList';
import MangaList from './components/MangaList';
import BusinessList from './components/BusinessList';
import CritiqueList from './components/CritiqueList';
import ArticleList from './components/ArticleList';
import axios from 'axios';
import './styles/globals.css';

const HomePage = () => {
  const [critiques, setCritiques] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCritiques();
  }, []);

  const fetchCritiques = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/critiques?limit=3');
      setCritiques(response.data.data || []);
    } catch (error) {
      console.error('Error fetching critiques:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-content">
      <HeroBanner />
      
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Dernières critiques</h2>
          <a href="/critiques" className="section-link">
            Voir toutes les critiques →
          </a>
        </div>
        
        {loading ? (
          <div className="loading">Chargement des articles...</div>
        ) : (
          <div className="articles-grid">
            {critiques.map((critique) => (
              <ArticleCard key={critique.id_critique} article={critique} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/animes" element={<AnimeList />} />
            <Route path="/mangas" element={<MangaList />} />
            <Route path="/business" element={<BusinessList />} />
            <Route path="/critiques" element={<CritiqueList />} />
            <Route path="/articles" element={<ArticleList />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;