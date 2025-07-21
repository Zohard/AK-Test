import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BusinessList() {
  const [business, setBusiness] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    axios.get(`http://localhost:3000/api/anime-business?page=${page}&limit=${limit}`)
      .then(res => setBusiness(res.data.data))
      .catch(err => console.error('Erreur:', err));
  }, [page]);

  return (
    <div>
      <h2>Relations d'Affaires (Animes)</h2>
      <ul>
        {business.map(b => (
          <li key={b.id_relation}>{b.titre} - {b.studio_name} ({b.type})</li>
        ))}
      </ul>
      <button onClick={() => setPage(page - 1)} disabled={page === 1}>Précédent</button>
      <button onClick={() => setPage(page + 1)}>Suivant</button>
    </div>
  );
}

export default BusinessList;