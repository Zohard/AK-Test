import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AnimeList() {
  const [animes, setAnimes] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    axios.get(`http://localhost:3002/api/animes?page=${page}&limit=${limit}`)
      .then(res => setAnimes(res.data.data))
      .catch(err => console.error('Erreur:', err));
  }, [page]);

  return (
    <div>
      <h2>Liste des Animes</h2>
      <ul>
        {animes.map(anime => (
          <li key={anime.id_anime}>{anime.titre} (Année: {anime.annee})</li>
        ))}
      </ul>
      <button onClick={() => setPage(page - 1)} disabled={page === 1}>Précédent</button>
      <button onClick={() => setPage(page + 1)}>Suivant</button>
    </div>
  );
}

export default AnimeList;