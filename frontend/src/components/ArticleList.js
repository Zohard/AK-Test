import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    axios.get(`http://localhost:3000/api/articles?page=${page}&limit=${limit}`)
      .then(res => setArticles(res.data.data))
      .catch(err => console.error('Erreur:', err));
  }, [page]);

  return (
    <div>
      <h2>Liste des Articles</h2>
      <ul>
        {articles.map(article => (
          <li key={article.id_article}>{article.titre} by {article.authors}</li>
        ))}
      </ul>
      <button onClick={() => setPage(page - 1)} disabled={page === 1}>Précédent</button>
      <button onClick={() => setPage(page + 1)}>Suivant</button>
    </div>
  );
}

export default ArticleList;