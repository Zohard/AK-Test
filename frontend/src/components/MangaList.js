import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MangaList() {
  const [mangas, setMangas] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    axios.get(`http://localhost:3002/api/mangas?page=${page}&limit=${limit}`)
      .then(res => setMangas(res.data.data))
      .catch(err => console.error('Erreur:', err));
  }, [page]);

  return (
    <div>
      <h2>Liste des Mangas</h2>
      <ul>
        {mangas.map(manga => (
          <li key={manga.id_manga}>{manga.titre} (Année: {manga.annee})</li>
        ))}
      </ul>
      <button onClick={() => setPage(page - 1)} disabled={page === 1}>Précédent</button>
      <button onClick={() => setPage(page + 1)}>Suivant</button>
    </div>
  );
}

export default MangaList;