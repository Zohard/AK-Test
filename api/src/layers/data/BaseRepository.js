const database = require('../../config/database');

class BaseRepository {
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.db = database;
  }

  async findAll(conditions = {}, options = {}) {
    const { limit = 50, offset = 0, orderBy = this.primaryKey, orderDirection = 'ASC' } = options;
    
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];
    let paramIndex = 1;

    // Add WHERE conditions
    if (Object.keys(conditions).length > 0) {
      const conditionStrings = [];
      for (const [key, value] of Object.entries(conditions)) {
        conditionStrings.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
      query += ` WHERE ${conditionStrings.join(' AND ')}`;
    }

    // Add ORDER BY
    query += ` ORDER BY ${orderBy} ${orderDirection}`;
    
    // Add LIMIT and OFFSET
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1 LIMIT 1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findOne(conditions = {}) {
    const query = `SELECT * FROM ${this.tableName} WHERE ${Object.keys(conditions).map((key, index) => `${key} = $${index + 1}`).join(' AND ')} LIMIT 1`;
    const params = Object.values(conditions);
    const result = await this.db.query(query, params);
    return result.rows[0] || null;
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`);

    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE ${this.primaryKey} = $${keys.length + 1}
      RETURNING *
    `;

    const result = await this.db.query(query, [...values, id]);
    return result.rows[0] || null;
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1 RETURNING *`;
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async count(conditions = {}) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const conditionStrings = [];
      let paramIndex = 1;
      for (const [key, value] of Object.entries(conditions)) {
        conditionStrings.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
      query += ` WHERE ${conditionStrings.join(' AND ')}`;
    }

    const result = await this.db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  async exists(conditions) {
    const count = await this.count(conditions);
    return count > 0;
  }
}

module.exports = BaseRepository;