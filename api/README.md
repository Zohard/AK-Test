# Anime-Kun API v2.0

A modern, modular REST API for anime and manga database with PostgreSQL support, comprehensive authentication, and business analytics.

## 🚀 Quick Start

```bash
# Database setup
node apply-fixed-schema.js    # Create tables
node final-data-import.js     # Import data

# Start the API (choose one)
node server-modular.js        # Recommended: New modular architecture
node server.js               # Legacy: Original monolithic version
```

## 📋 Prerequisites

- Node.js 16+ installed
- PostgreSQL 12+ database running
- Environment variables configured (see Configuration)

## 🏗️ Architecture

### New Modular Structure (v2.0)
The API has been refactored from a monolithic 3885-line server into a clean, maintainable modular architecture:

```
api/
├── server-modular.js          # 🎯 Main entry point (recommended)
├── server.js                  # Legacy monolithic version
├── config/
│   ├── database.js           # PostgreSQL connection pool
│   ├── middleware.js         # Global middleware setup
│   └── swagger.js            # API documentation config
├── routes/
│   ├── index.js              # Route orchestration
│   ├── auth.js               # Authentication & authorization
│   ├── anime.js              # Anime CRUD & search
│   ├── manga.js              # Manga CRUD & search
│   ├── reviews.js            # User reviews system
│   ├── search.js             # Global search engine
│   ├── user.js               # User profile management
│   ├── admin.js              # Administrative operations
│   ├── business.js           # Analytics & business data
│   └── tags.js               # Tag management
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── utils/
│   ├── auth.js               # Authentication utilities
│   └── formatCritiqueText.js # Text formatting
└── uploads/                  # File upload storage
```

### Key Technologies
- **Framework**: Express.js 4.18+
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT + bcrypt
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: Helmet, CORS, Rate Limiting
- **File Uploads**: Multer
- **Monitoring**: Prometheus metrics
- **Development**: Nodemon for hot reloading

## 🔌 API Endpoints

### Authentication (`/api/auth`)
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User authentication
POST   /api/auth/logout            # User logout
GET    /api/auth/profile           # Get current user profile
PUT    /api/auth/profile           # Update user profile
POST   /api/auth/verify-token      # Verify JWT token
POST   /api/auth/refresh-token     # Refresh JWT token
```

### Anime Management (`/api/animes`)
```
GET    /api/animes                 # List all animes (paginated)
GET    /api/animes/:id             # Get specific anime
POST   /api/animes                 # Create new anime (admin)
PUT    /api/animes/:id             # Update anime (admin)
DELETE /api/animes/:id             # Delete anime (admin)
GET    /api/animes/search          # Search animes
GET    /api/animes/autocomplete    # Autocomplete suggestions
GET    /api/animes/:id/relations   # Get anime relations
POST   /api/animes/:id/screenshot  # Upload screenshot (admin)
GET    /api/animes/:id/business    # Get business analytics
```

### Manga Management (`/api/mangas`)
```
GET    /api/mangas                 # List all mangas (paginated)
GET    /api/mangas/:id             # Get specific manga
POST   /api/mangas                 # Create new manga (admin)
PUT    /api/mangas/:id             # Update manga (admin)
DELETE /api/mangas/:id             # Delete manga (admin)
GET    /api/mangas/search          # Search mangas
GET    /api/mangas/autocomplete    # Autocomplete suggestions
```

### Reviews System (`/api/reviews`)
```
GET    /api/reviews                # List reviews (filtered)
POST   /api/reviews                # Create new review (authenticated)
GET    /api/reviews/:id            # Get specific review
PUT    /api/reviews/:id            # Update review (owner/admin)
DELETE /api/reviews/:id            # Delete review (owner/admin)
```

### Global Search (`/api/search`)
```
GET    /api/search                 # Global search across animes & mangas
GET    /api/search/suggestions     # Search suggestions
GET    /api/search/filters         # Available search filters
```

### User Management (`/api/users`)
```
GET    /api/users/:id              # Get user profile
PUT    /api/users/:id              # Update user profile (owner/admin)
GET    /api/users/:id/reviews      # Get user's reviews
GET    /api/users/:id/favorites    # Get user's favorites
POST   /api/users/:id/favorites    # Add to favorites
DELETE /api/users/:id/favorites/:itemId # Remove from favorites
```

### Administration (`/api/admin`)
```
GET    /api/admin/users            # Manage users (admin only)
GET    /api/admin/stats            # System statistics
GET    /api/admin/logs             # System logs
POST   /api/admin/backup           # Create database backup
POST   /api/admin/restore          # Restore database
```

### Business Analytics (`/api/business`)
```
GET    /api/business/revenue       # Revenue analytics (admin)
GET    /api/business/metrics       # Key performance metrics
GET    /api/business/reports       # Generate reports
```

### Tag Management (`/api/tags`)
```
GET    /api/tags                   # List all tags
POST   /api/tags                   # Create new tag (admin)
PUT    /api/tags/:id               # Update tag (admin)
DELETE /api/tags/:id               # Delete tag (admin)
```

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the API root:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=anime_user
DB_PASSWORD=anime_password
DB_NAME=anime_kun
DB_PORT=5432

# Server Configuration
PORT=3000
EXTERNAL_PORT=3001
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,webp

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
```

### Database Setup
```sql
-- Create database and user
CREATE DATABASE anime_kun;
CREATE USER anime_user WITH PASSWORD 'anime_password';
GRANT ALL PRIVILEGES ON DATABASE anime_kun TO anime_user;

-- Run migrations
node apply-fixed-schema.js
node final-data-import.js
```

## 🚦 Development

### Available Scripts
```bash
npm start              # Production server (server.js)
npm run dev           # Development with nodemon
npm test              # Run test suite
npm run migrate:*     # Database migration scripts
```

### Development Server
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
node apply-fixed-schema.js
node final-data-import.js

# Start development server
npm run dev
```

### API Documentation
- **Swagger UI**: http://localhost:3000/docs
- **API Overview**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 🔒 Authentication & Security

### JWT Authentication
- **Login**: Obtain JWT token via `/api/auth/login`
- **Authorization**: Include token in `Authorization: Bearer <token>` header
- **Token Refresh**: Use `/api/auth/refresh-token` before expiration

### Security Features
- **Helmet**: Security headers protection
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling (100 req/15min)
- **Input Validation**: Express-validator for all inputs
- **Password Hashing**: bcrypt with 12 rounds
- **SQL Injection Protection**: Parameterized queries

### User Roles
- **Guest**: Public read access
- **User**: Authenticated access + reviews
- **Admin**: Full system access

## 📊 Monitoring & Analytics

### Prometheus Metrics
Available at `/metrics`:
- Request duration and count
- Database connection pool status
- Memory and CPU usage
- Error rates by endpoint

### Health Monitoring
```bash
GET /health           # Basic health check
GET /health/detailed  # Comprehensive system status
```

## 🔄 Migration from v1.x

### Backward Compatibility
The modular API maintains 100% compatibility with v1.x clients. All existing endpoints and responses remain unchanged.

### Gradual Migration
```bash
# Step 1: Test with modular server
node server-modular.js

# Step 2: Update package.json main entry
"main": "server-modular.js"

# Step 3: Update deployment scripts
```

### Rollback Strategy
```bash
# Immediate rollback to v1.x
node server.js

# Or use the complete backup
node server-complete.js
```

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify credentials
psql -h localhost -U anime_user -d anime_kun
```

**Port Already in Use**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

**JWT Token Issues**
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Check token format
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/auth/profile
```

### Logging
Logs are available in:
- `server.log` - Application logs
- `api.log` - API request logs
- `server_debug.log` - Debug information

## 📈 Performance

### Optimizations
- **Connection Pooling**: PostgreSQL pool (max 20 connections)
- **Compression**: Gzip compression for responses
- **Caching**: Node-cache for frequently accessed data
- **Indexing**: Optimized database indexes for search

### Benchmarks
- **Response Time**: < 100ms for cached queries
- **Throughput**: 1000+ req/sec on standard hardware
- **Memory Usage**: ~50MB base + ~2MB per 100 concurrent users

## 🤝 Contributing

### Development Guidelines
1. **Code Style**: Follow existing conventions
2. **Testing**: Add tests for new features
3. **Documentation**: Update API docs and README
4. **Security**: Never commit secrets or credentials

### Project Structure Best Practices
- Keep routes focused and single-purpose
- Use middleware for cross-cutting concerns
- Validate all inputs with express-validator
- Handle errors consistently across all routes

## 📝 License

MIT License - see LICENSE file for details.

## 📞 Support

- **Documentation**: `/docs` endpoint
- **Issues**: GitHub Issues
- **Email**: contact@anime-kun.com