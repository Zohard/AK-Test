const BaseRepository = require('./BaseRepository');

class ReviewRepository extends BaseRepository {
  constructor() {
    super('an_reviews', 'id_review');
  }

  async findWithUserInfo(conditions = {}, options = {}) {
    const { limit = 20, offset = 0, orderBy = 'date_creation', orderDirection = 'DESC' } = options;
    
    let query = `
      SELECT 
        r.*,
        u.member_name as username,
        u.avatar,
        u.posts as user_posts,
        CASE 
          WHEN r.id_anime IS NOT NULL THEN a.titre
          WHEN r.id_manga IS NOT NULL THEN m.titre
        END as media_title,
        CASE 
          WHEN r.id_anime IS NOT NULL THEN a.nice_url
          WHEN r.id_manga IS NOT NULL THEN m.nice_url
        END as media_url,
        CASE 
          WHEN r.id_anime IS NOT NULL THEN 'anime'
          WHEN r.id_manga IS NOT NULL THEN 'manga'
        END as media_type
      FROM ${this.tableName} r
      LEFT JOIN smf_members u ON r.id_user = u.id_member
      LEFT JOIN an_anime a ON r.id_anime = a.id_anime
      LEFT JOIN an_manga m ON r.id_manga = m.id_manga
      WHERE r.statut = 1
    `;
    
    const params = [];
    let paramIndex = 1;

    // Add WHERE conditions
    if (conditions.id_anime) {
      query += ` AND r.id_anime = $${paramIndex}`;
      params.push(conditions.id_anime);
      paramIndex++;
    }

    if (conditions.id_manga) {
      query += ` AND r.id_manga = $${paramIndex}`;
      params.push(conditions.id_manga);
      paramIndex++;
    }

    if (conditions.id_user) {
      query += ` AND r.id_user = $${paramIndex}`;
      params.push(conditions.id_user);
      paramIndex++;
    }

    if (conditions.min_note) {
      query += ` AND r.note >= $${paramIndex}`;
      params.push(conditions.min_note);
      paramIndex++;
    }

    // Add ORDER BY
    query += ` ORDER BY r.${orderBy} ${orderDirection}`;
    
    // Add LIMIT and OFFSET
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async findByMediaId(mediaId, mediaType, limit = 10) {
    const mediaField = mediaType === 'anime' ? 'id_anime' : 'id_manga';
    const mediaTable = mediaType === 'anime' ? 'an_anime' : 'an_manga';
    const mediaIdField = mediaType === 'anime' ? 'id_anime' : 'id_manga';

    const query = `
      SELECT 
        r.*,
        u.member_name as username,
        u.avatar,
        u.posts as user_posts,
        m.titre as media_title
      FROM ${this.tableName} r
      LEFT JOIN smf_members u ON r.id_user = u.id_member
      LEFT JOIN ${mediaTable} m ON r.${mediaField} = m.${mediaIdField}
      WHERE r.${mediaField} = $1 AND r.statut = 1
      ORDER BY r.date_creation DESC
      LIMIT $2
    `;
    
    const result = await this.db.query(query, [mediaId, limit]);
    return result.rows;
  }

  async findByUserId(userId, limit = 10) {
    const query = `
      SELECT 
        r.*,
        CASE 
          WHEN r.id_anime IS NOT NULL THEN a.titre
          WHEN r.id_manga IS NOT NULL THEN m.titre
        END as media_title,
        CASE 
          WHEN r.id_anime IS NOT NULL THEN a.nice_url
          WHEN r.id_manga IS NOT NULL THEN m.nice_url
        END as media_url,
        CASE 
          WHEN r.id_anime IS NOT NULL THEN 'anime'
          WHEN r.id_manga IS NOT NULL THEN 'manga'
        END as media_type
      FROM ${this.tableName} r
      LEFT JOIN an_anime a ON r.id_anime = a.id_anime
      LEFT JOIN an_manga m ON r.id_manga = m.id_manga
      WHERE r.id_user = $1 AND r.statut = 1
      ORDER BY r.date_creation DESC
      LIMIT $2
    `;
    
    const result = await this.db.query(query, [userId, limit]);
    return result.rows;
  }

  async getAverageRating(mediaId, mediaType) {
    const mediaField = mediaType === 'anime' ? 'id_anime' : 'id_manga';
    
    const query = `
      SELECT 
        COALESCE(AVG(note)::numeric(3,2), 0) as average_rating,
        COUNT(*) as total_reviews
      FROM ${this.tableName}
      WHERE ${mediaField} = $1 AND statut = 1
    `;
    
    const result = await this.db.query(query, [mediaId]);
    return result.rows[0];
  }

  async getUserReviewForMedia(userId, mediaId, mediaType) {
    const mediaField = mediaType === 'anime' ? 'id_anime' : 'id_manga';
    
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE id_user = $1 AND ${mediaField} = $2 AND statut = 1
      LIMIT 1
    `;
    
    const result = await this.db.query(query, [userId, mediaId]);
    return result.rows[0] || null;
  }

  async createReview(reviewData) {
    const {
      id_user,
      id_anime = null,
      id_manga = null,
      note,
      titre,
      contenu,
      date_creation = Math.floor(Date.now() / 1000),
      statut = 1
    } = reviewData;

    const query = `
      INSERT INTO ${this.tableName} (
        id_user, id_anime, id_manga, note, titre, contenu, date_creation, statut
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [id_user, id_anime, id_manga, note, titre, contenu, date_creation, statut];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getReviewStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(note)::numeric(3,2) as average_rating,
        COUNT(DISTINCT id_user) as unique_reviewers,
        COUNT(CASE WHEN id_anime IS NOT NULL THEN 1 END) as anime_reviews,
        COUNT(CASE WHEN id_manga IS NOT NULL THEN 1 END) as manga_reviews,
        COUNT(CASE WHEN date_creation > EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::bigint THEN 1 END) as recent_reviews
      FROM ${this.tableName}
      WHERE statut = 1
    `;
    
    const result = await this.db.query(query);
    return result.rows[0];
  }

  async getTopRatedMedia(mediaType, limit = 10) {
    const mediaTable = mediaType === 'anime' ? 'an_anime' : 'an_manga';
    const mediaIdField = mediaType === 'anime' ? 'id_anime' : 'id_manga';
    const mediaField = mediaType === 'anime' ? 'id_anime' : 'id_manga';

    const query = `
      SELECT 
        m.*,
        AVG(r.note)::numeric(3,2) as average_rating,
        COUNT(r.id_review) as review_count
      FROM ${mediaTable} m
      INNER JOIN ${this.tableName} r ON m.${mediaIdField} = r.${mediaField}
      WHERE r.statut = 1 AND m.statut = 1
      GROUP BY m.${mediaIdField}
      HAVING COUNT(r.id_review) >= 3
      ORDER BY average_rating DESC, review_count DESC
      LIMIT $1
    `;
    
    const result = await this.db.query(query, [limit]);
    return result.rows;
  }
}

module.exports = ReviewRepository;