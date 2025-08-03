const BaseRepository = require('./BaseRepository');

class MangaRepository extends BaseRepository {
  constructor() {
    super('an_manga', 'id_manga');
  }

  async findByNiceUrl(niceUrl) {
    const query = `SELECT * FROM ${this.tableName} WHERE nice_url = $1 AND statut = 1 LIMIT 1`;
    const result = await this.db.query(query, [niceUrl]);
    return result.rows[0] || null;
  }

  async findWithPagination(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT m.*, 
             COALESCE(AVG(r.note)::numeric(3,2), 0) as moyenne_notes,
             COUNT(r.id_review) as nb_reviews
      FROM ${this.tableName} m
      LEFT JOIN an_reviews r ON m.id_manga = r.id_manga AND r.statut = 1
      WHERE m.statut = 1
    `;
    
    const params = [];
    let paramIndex = 1;

    // Add filters
    if (filters.search) {
      query += ` AND (m.titre ILIKE $${paramIndex} OR m.auteur ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.year) {
      query += ` AND m.annee = $${paramIndex}`;
      params.push(filters.year);
      paramIndex++;
    }

    if (filters.author) {
      query += ` AND m.auteur ILIKE $${paramIndex}`;
      params.push(`%${filters.author}%`);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND m.statut_publication = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ` GROUP BY m.id_manga, m.nice_url, m.titre, m.auteur, m.annee, m.nb_volumes, m.synopsis, m.image, m.statut, m.statut_publication`;
    
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

  async findByAuthor(author, limit = 10) {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE auteur ILIKE $1 AND statut = 1 
      ORDER BY annee DESC 
      LIMIT $2
    `;
    const result = await this.db.query(query, [`%${author}%`, limit]);
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
      SELECT id_manga, titre, auteur, nice_url, annee, image
      FROM ${this.tableName} 
      WHERE titre ILIKE $1 AND statut = 1 
      ORDER BY titre ASC 
      LIMIT $2
    `;
    const result = await this.db.query(query, [`%${searchTerm}%`, limit]);
    return result.rows;
  }

  async findRelated(mangaId) {
    const query = `
      SELECT m.*, r.type_relation, r.description
      FROM ${this.tableName} m
      INNER JOIN an_manga_relations r ON (
        (r.id_manga_1 = $1 AND r.id_manga_2 = m.id_manga) OR
        (r.id_manga_2 = $1 AND r.id_manga_1 = m.id_manga)
      )
      WHERE m.statut = 1 AND m.id_manga != $1
      ORDER BY r.type_relation, m.titre
    `;
    const result = await this.db.query(query, [mangaId]);
    return result.rows;
  }

  async findByTags(tagIds, limit = 20) {
    const query = `
      SELECT DISTINCT m.*, 
             COUNT(mt.id_tag) as tag_matches
      FROM ${this.tableName} m
      INNER JOIN an_manga_tags mt ON m.id_manga = mt.id_manga
      WHERE mt.id_tag = ANY($1) AND m.statut = 1
      GROUP BY m.id_manga
      ORDER BY tag_matches DESC, m.titre ASC
      LIMIT $2
    `;
    const result = await this.db.query(query, [tagIds, limit]);
    return result.rows;
  }

  async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_mangas,
        COUNT(CASE WHEN annee >= EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as current_year,
        AVG(nb_volumes) as avg_volumes,
        COUNT(DISTINCT auteur) as unique_authors,
        COUNT(CASE WHEN statut_publication = 'En cours' THEN 1 END) as ongoing,
        COUNT(CASE WHEN statut_publication = 'Terminé' THEN 1 END) as completed
      FROM ${this.tableName}
      WHERE statut = 1
    `;
    const result = await this.db.query(query);
    return result.rows[0];
  }
}

module.exports = MangaRepository;