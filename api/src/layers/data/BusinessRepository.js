const BaseRepository = require('./BaseRepository');

class BusinessRepository extends BaseRepository {
  constructor() {
    super('ak_business', 'id_business');
  }

  async findWithPagination(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT *
      FROM ${this.tableName}
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    // Add filters
    if (filters.search) {
      query += ` AND (denomination ILIKE $${paramIndex} OR autres_denominations ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.origine) {
      query += ` AND origine = $${paramIndex}`;
      params.push(filters.origine);
      paramIndex++;
    }

    // Add sorting
    const sortField = filters.sort || 'denomination';
    const sortOrder = filters.order === 'desc' ? 'DESC' : 'ASC';
    
    const allowedSortFields = ['denomination', 'type', 'origine', 'date'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'denomination';
    
    query += ` ORDER BY ${validSortField} ${sortOrder}`;
    
    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (filters.search) {
      countQuery += ` AND (denomination ILIKE $${countParamIndex} OR autres_denominations ILIKE $${countParamIndex})`;
      countParams.push(`%${filters.search}%`);
      countParamIndex++;
    }

    if (filters.type) {
      countQuery += ` AND type = $${countParamIndex}`;
      countParams.push(filters.type);
      countParamIndex++;
    }

    if (filters.origine) {
      countQuery += ` AND origine = $${countParamIndex}`;
      countParams.push(filters.origine);
      countParamIndex++;
    }

    const countResult = await this.db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findByDenomination(denomination) {
    const query = `SELECT * FROM ${this.tableName} WHERE denomination = $1 LIMIT 1`;
    const result = await this.db.query(query, [denomination]);
    return result.rows[0] || null;
  }

  async create(businessData) {
    const {
      type,
      denomination,
      autres_denominations,
      image,
      date,
      origine,
      site_officiel
    } = businessData;

    const query = `
      INSERT INTO ${this.tableName} 
      (type, denomination, autres_denominations, image, date, origine, site_officiel, statut)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ok')
      RETURNING *
    `;

    const values = [
      type,
      denomination,
      autres_denominations || null,
      image || null,
      date || null,
      origine || null,
      site_officiel || null
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async update(id, businessData) {
    const {
      type,
      denomination,
      autres_denominations,
      image,
      date,
      origine,
      site_officiel
    } = businessData;

    const query = `
      UPDATE ${this.tableName}
      SET type = $1, denomination = $2, autres_denominations = $3, 
          image = $4, date = $5, origine = $6, site_officiel = $7
      WHERE ${this.primaryKey} = $8
      RETURNING *
    `;

    const values = [
      type,
      denomination,
      autres_denominations || null,
      image || null,
      date || null,
      origine || null,
      site_officiel || null,
      id
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }
}

module.exports = BusinessRepository;