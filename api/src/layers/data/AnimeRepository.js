const BaseRepository = require('./BaseRepository');

class AnimeRepository extends BaseRepository {
  constructor() {
    super('an_anime', 'id_anime');
  }

  async findByNiceUrl(niceUrl) {
    const query = `SELECT * FROM ${this.tableName} WHERE nice_url = $1 AND statut = 1 LIMIT 1`;
    const result = await this.db.query(query, [niceUrl]);
    return result.rows[0] || null;
  }

  async findWithPagination(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT a.*, 
             COALESCE(AVG(r.note)::numeric(3,2), 0) as moyenne_notes,
             COUNT(r.id_review) as nb_reviews
      FROM ${this.tableName} a
      LEFT JOIN an_reviews r ON a.id_anime = r.id_anime AND r.statut = 1
      WHERE a.statut = 1
    `;
    
    const params = [];
    let paramIndex = 1;

    // Add filters
    if (filters.search) {
      query += ` AND (a.titre ILIKE $${paramIndex} OR a.titre_orig ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.year) {
      query += ` AND a.annee = $${paramIndex}`;
      params.push(filters.year);
      paramIndex++;
    }

    if (filters.studio) {
      query += ` AND a.studio ILIKE $${paramIndex}`;
      params.push(`%${filters.studio}%`);
      paramIndex++;
    }

    query += ` GROUP BY a.id_anime, a.nice_url, a.titre, a.titre_orig, a.annee, a.nb_ep, a.studio, a.synopsis, a.image, a.statut`;
    
    // Add sorting
    const sortField = filters.sort || 'titre';
    const sortDirection = filters.direction || 'ASC';
    query += ` ORDER BY ${sortField} ${sortDirection}`;
    
    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async findByStudio(studio, limit = 10) {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE studio ILIKE $1 AND statut = 1 
      ORDER BY annee DESC 
      LIMIT $2
    `;
    const result = await this.db.query(query, [`%${studio}%`, limit]);
    return result.rows;
  }

  async findByYear(year, limit = 20) {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE annee = $1 AND statut = 1 
      ORDER BY titre ASC 
      LIMIT $2
    `;
    const result = await this.db.query(query, [year, limit]);
    return result.rows;
  }

  async searchByTitle(searchTerm, limit = 10) {
    const query = `
      SELECT id_anime, titre, titre_orig, nice_url, annee, image
      FROM ${this.tableName} 
      WHERE (titre ILIKE $1 OR titre_orig ILIKE $1) AND statut = 1 
      ORDER BY titre ASC 
      LIMIT $2
    `;
    const result = await this.db.query(query, [`%${searchTerm}%`, limit]);
    return result.rows;
  }

  async findRelated(animeId) {
    const query = `
      SELECT a.*, r.type_relation, r.description
      FROM ${this.tableName} a
      INNER JOIN an_anime_relations r ON (
        (r.id_anime_1 = $1 AND r.id_anime_2 = a.id_anime) OR
        (r.id_anime_2 = $1 AND r.id_anime_1 = a.id_anime)
      )
      WHERE a.statut = 1 AND a.id_anime != $1
      ORDER BY r.type_relation, a.titre
    `;
    const result = await this.db.query(query, [animeId]);
    return result.rows;
  }

  async findByTags(tagIds, limit = 20) {
    const query = `
      SELECT DISTINCT a.*, 
             COUNT(at.id_tag) as tag_matches
      FROM ${this.tableName} a
      INNER JOIN an_anime_tags at ON a.id_anime = at.id_anime
      WHERE at.id_tag = ANY($1) AND a.statut = 1
      GROUP BY a.id_anime
      ORDER BY tag_matches DESC, a.titre ASC
      LIMIT $2
    `;
    const result = await this.db.query(query, [tagIds, limit]);
    return result.rows;
  }

  async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_animes,
        COUNT(CASE WHEN annee >= EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as current_year,
        AVG(nb_ep) as avg_episodes,
        COUNT(DISTINCT studio) as unique_studios
      FROM ${this.tableName}
      WHERE statut = 1
    `;
    const result = await this.db.query(query);
    return result.rows[0];
  }
}

module.exports = AnimeRepository;