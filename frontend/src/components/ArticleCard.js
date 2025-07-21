import React from 'react';
import FormattedText from './FormattedText';

const ArticleCard = ({ article }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Determine which image to show (anime or manga) and the title
  const getImageAndTitle = () => {
    if (article.id_anime && article.id_anime !== 0) {
      return {
        image: article.anime_image,
        title: article.anime_titre || 'Anime',
        type: 'Anime'
      };
    } else if (article.id_manga && article.id_manga !== 0) {
      return {
        image: article.manga_image,
        title: article.manga_titre || 'Manga',
        type: 'Manga'
      };
    }
    return {
      image: null,
      title: article.titre || 'Critique',
      type: 'Critique'
    };
  };

  const { image, title, type } = getImageAndTitle();

  return (
    <div className="article-card">
      {image && (
        <img 
          src={`/images/${image}`} 
          alt={title}
          className="article-image"
          onError={(e) => {
            // Hide image if it fails to load
            e.target.style.display = 'none';
          }}
        />
      )}
      <div className="article-content">
        <div className="article-meta">
          <span className="article-type">{type}</span>
          {article.notation && (
            <span className="article-rating">★ {article.notation}/10</span>
          )}
        </div>
        <h3 className="article-title">{title}</h3>
        {article.critique && (
          <div className="article-excerpt">
            <FormattedText 
              text={article.critique}
              maxLength={150}
              showReadMore={true}
              className="text-sm text-gray-600"
            />
          </div>
        )}
        <div className="article-footer">
          <p className="article-date">
            {formatDate(article.date_critique || article.date_ajout)}
          </p>
          {article.username && (
            <p className="article-author">Par {article.username}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;