const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('smf_members', 'id_member');
  }

  async findByUsername(username) {
    const query = `
      SELECT m.*, g.group_name
      FROM ${this.tableName} m
      LEFT JOIN smf_membergroups g ON m.id_group = g.id_group
      WHERE m.member_name = $1 OR m.real_name = $1
      LIMIT 1
    `;
    const result = await this.db.query(query, [username]);
    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const query = `
      SELECT m.*, g.group_name
      FROM ${this.tableName} m
      LEFT JOIN smf_membergroups g ON m.id_group = g.id_group
      WHERE m.email_address = $1
      LIMIT 1
    `;
    const result = await this.db.query(query, [email]);
    return result.rows[0] || null;
  }

  async findByIdWithProfile(id) {
    const query = `
      SELECT 
        m.*,
        g.group_name,
        COUNT(DISTINCT r.id_review) as total_reviews,
        AVG(r.note) as avg_rating_given
      FROM ${this.tableName} m
      LEFT JOIN smf_membergroups g ON m.id_group = g.id_group
      LEFT JOIN an_reviews r ON m.id_member = r.id_user AND r.statut = 1
      WHERE m.id_member = $1
      GROUP BY m.id_member, g.group_name
      LIMIT 1
    `;
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateLastLogin(userId) {
    const query = `
      UPDATE ${this.tableName} 
      SET last_login = EXTRACT(EPOCH FROM NOW())::bigint
      WHERE id_member = $1
      RETURNING *
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows[0] || null;
  }

  async createUser(userData) {
    const {
      member_name,
      real_name,
      email_address,
      passwd,
      password_salt,
      id_group = 0,
      posts = 0,
      date_registered,
      last_login = null,
      avatar = null
    } = userData;

    const query = `
      INSERT INTO ${this.tableName} (
        member_name, real_name, email_address, passwd, password_salt,
        id_group, posts, date_registered, last_login, avatar
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      member_name, real_name, email_address, passwd, password_salt,
      id_group, posts, date_registered, last_login, avatar
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async findAdmins() {
    const query = `
      SELECT m.*, g.group_name
      FROM ${this.tableName} m
      LEFT JOIN smf_membergroups g ON m.id_group = g.id_group
      WHERE m.id_group = 1 OR m.id_member IN (1, 17667)
      ORDER BY m.member_name
    `;
    const result = await this.db.query(query);
    return result.rows;
  }

  async findRecentUsers(limit = 10) {
    const query = `
      SELECT m.id_member, m.member_name, m.real_name, m.date_registered, m.posts
      FROM ${this.tableName} m
      WHERE m.is_activated = 1
      ORDER BY m.date_registered DESC
      LIMIT $1
    `;
    const result = await this.db.query(query, [limit]);
    return result.rows;
  }

  async findActiveUsers(limit = 20) {
    const query = `
      SELECT m.id_member, m.member_name, m.posts, m.last_login
      FROM ${this.tableName} m
      WHERE m.is_activated = 1 AND m.last_login > EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::bigint
      ORDER BY m.last_login DESC
      LIMIT $1
    `;
    const result = await this.db.query(query, [limit]);
    return result.rows;
  }

  async getUserStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_activated = 1 THEN 1 END) as active_users,
        COUNT(CASE WHEN id_group = 1 THEN 1 END) as admin_users,
        COUNT(CASE WHEN date_registered > EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::bigint THEN 1 END) as recent_registrations
      FROM ${this.tableName}
    `;
    const result = await this.db.query(query);
    return result.rows[0];
  }
}

module.exports = UserRepository;