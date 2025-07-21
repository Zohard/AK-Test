# PostgreSQL Migration Guide

This guide explains how to migrate from MySQL to PostgreSQL for the Anime-Kun project.

## 🐘 PostgreSQL Setup

### Option 1: Docker Setup (Recommended)

```bash
# Start PostgreSQL with Docker Compose
docker-compose -f docker-compose-postgresql.yml up -d postgres

# Check if PostgreSQL is running
docker-compose -f docker-compose-postgresql.yml ps
```

### Option 2: Local PostgreSQL Installation

1. **Install PostgreSQL** (Ubuntu/Debian):
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

2. **Create database and user**:
   ```bash
   sudo -u postgres psql
   ```
   ```sql
   CREATE DATABASE anime_kun;
   CREATE USER anime_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE anime_kun TO anime_user;
   ALTER USER anime_user CREATEDB;
   \q
   ```

3. **Import the schema**:
   ```bash
   psql -U anime_user -d anime_kun -f schema-postgresql.sql
   ```

## 🔄 Migration Steps

### 1. Install Dependencies
```bash
cd api
npm install pg
```

### 2. Environment Configuration
```bash
# Copy PostgreSQL environment template
cp .env.postgresql.example .env

# Edit the .env file with your PostgreSQL credentials
nano .env
```

### 3. Start the PostgreSQL API Server
```bash
# Development mode
npm run dev:postgresql

# Production mode
npm run start:postgresql
```

## 🔧 Key Differences from MySQL

### Data Types
- `AUTO_INCREMENT` → `SERIAL` or `IDENTITY`
- `TINYINT` → `SMALLINT`
- `DATETIME` → `TIMESTAMP`
- `LONGTEXT` → `TEXT`

### Features Added
- **Full-text search** with `to_tsvector` and `plainto_tsquery`
- **Automatic rating updates** with triggers
- **Better indexing** with GIN indexes for text search
- **Enhanced data validation** with check constraints

### PostgreSQL-Specific Improvements
- **pg_trgm extension** for fuzzy text matching
- **uuid-ossp extension** for UUID generation
- **Optimized queries** using PostgreSQL-specific functions
- **Better connection pooling** with pg pool

## 📊 Performance Benefits

1. **Advanced Text Search**: PostgreSQL's full-text search is more powerful than MySQL's
2. **Better Indexing**: GIN indexes for complex queries
3. **ACID Compliance**: Better transaction handling
4. **JSON Support**: Native JSON data type with indexing
5. **Window Functions**: Advanced analytical queries

## 🔄 Data Migration

If you have existing MySQL data, you can migrate it:

```bash
# Export from MySQL
mysqldump -u root -p anime_kun > mysql_dump.sql

# Convert and import to PostgreSQL
# (You may need to manually adjust the SQL syntax)
```

## 🐳 Full Docker Setup

Start the entire stack with PostgreSQL:

```bash
# Build and start all services
docker-compose -f docker-compose-postgresql.yml up --build

# Access the application
# Frontend: http://localhost
# API: http://localhost:3000
# PostgreSQL: localhost:5432
```

## 🔍 Monitoring and Health Checks

The PostgreSQL API includes:
- Health check endpoint: `GET /api/health`
- Prometheus metrics: `GET /metrics`
- Connection pool monitoring
- Query performance tracking

## 🛠️ Development Tips

1. **Use pgAdmin** for database management:
   ```bash
   docker run -p 8080:80 -e PGADMIN_DEFAULT_EMAIL=admin@admin.com -e PGADMIN_DEFAULT_PASSWORD=admin dpage/pgadmin4
   ```

2. **Enable query logging** in development:
   ```javascript
   // In server-postgresql.js
   const pool = new Pool({
     // ... other config
     log: (messages) => console.log(messages)
   });
   ```

3. **Use database migrations** for schema changes:
   ```bash
   # Create migration files in migrations/ folder
   # Use tools like db-migrate or knex.js
   ```

## 🚨 Troubleshooting

### Connection Issues
- Check PostgreSQL is running: `docker-compose ps`
- Verify credentials in `.env` file
- Check firewall settings for port 5432

### Query Errors
- PostgreSQL is case-sensitive for identifiers
- Use double quotes for column names if needed
- Check data type compatibility

### Performance Issues
- Monitor slow queries with `pg_stat_statements`
- Use `EXPLAIN ANALYZE` for query optimization
- Check index usage with `pg_stat_user_indexes`

## 📚 Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js PostgreSQL Client (pg)](https://node-postgres.com/)
- [PostgreSQL vs MySQL Comparison](https://www.postgresql.org/about/featurematrix/)

---

The PostgreSQL migration enhances the Anime-Kun project with better performance, advanced search capabilities, and more robust data handling.