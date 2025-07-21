import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CritiqueList() {
  const [critiques, setCritiques] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    axios.get(`http://localhost:3000/api/critiques?page=${page}&limit=${limit}`)
      .then(res => setCritiques(res.data.data))
      .catch(err => console.error('Erreur:', err));
  }, [page]);

  return (
    <div>
      <h2>Liste des Critiques</h2>
      <ul>
        {critiques.map(critique => (
          <li key={critique.id_critique}>{critique.titre} by {critique.pseudo}</li>
        ))}
      </ul>
      <button onClick={() => setPage(page - 1)} disabled={page === 1}>Précédent</button>
      <button onClick={() => setPage(page + 1)}>Suivant</button>
    </div>
  );
}

export default CritiqueList;