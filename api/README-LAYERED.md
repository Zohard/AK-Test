# Anime-Kun API v2.0 - Layered Architecture

This is the reorganized version of the Anime-Kun API using a **4-layer architecture** pattern for better maintainability, scalability, and code organization.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                PRESENTATION LAYER                           │
│                 (Controllers)                               │
│  • Handle HTTP requests/responses                           │
│  • Input validation                                         │
│  • Response formatting                                      │
│  • Error handling                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  ROUTER LAYER                               │
│                (API Endpoints)                              │
│  • Route definitions                                        │
│  • Middleware application                                   │
│  • Swagger documentation                                    │
│  • Authentication checks                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 SERVICE LAYER                               │
│               (Business Logic)                              │
│  • Business rules and validation                            │
│  • Data transformation                                      │
│  • Complex operations                                       │
│  • Integration logic                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              DATA ACCESS LAYER                              │
│              (Repository Pattern)                           │
│  • Database queries                                         │
│  • Data persistence                                         │
│  • Connection management                                    │
│  • Query optimization                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   DATABASE                                  │
│                 (PostgreSQL)                               │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
api/
├── src/
│   ├── layers/
│   │   ├── presentation/          # Controllers (HTTP request/response handling)
│   │   │   ├── BaseController.js
│   │   │   ├── AnimeController.js
│   │   │   ├── MangaController.js
│   │   │   ├── AuthController.js
│   │   │   ├── ReviewController.js
│   │   │   └── index.js
│   │   ├── router/               # Route definitions and middleware
│   │   │   ├── anime.js
│   │   │   ├── manga.js
│   │   │   ├── auth.js
│   │   │   ├── review.js
│   │   │   └── index.js
│   │   ├── service/              # Business logic and validation
│   │   │   ├── BaseService.js
│   │   │   ├── AnimeService.js
│   │   │   ├── MangaService.js
│   │   │   ├── AuthService.js
│   │   │   ├── ReviewService.js
│   │   │   └── index.js
│   │   └── data/                 # Repository pattern for data access
│   │       ├── BaseRepository.js
│   │       ├── AnimeRepository.js
│   │       ├── MangaRepository.js
│   │       ├── UserRepository.js
│   │       ├── ReviewRepository.js
│   │       └── index.js
│   ├── config/                   # Configuration files
│   │   ├── database.js
│   │   ├── swagger.js
│   │   └── multer.js
│   ├── shared/                   # Shared utilities
│   │   ├── constants/
│   │   │   └── index.js
│   │   └── validators/
│   │       └── index.js
│   ├── middleware/               # Custom middleware (existing)
│   │   └── auth.js
│   └── utils/                    # Utility functions (existing)
│       └── auth.js
├── migrations/                   # Database migrations (existing)
├── uploads/                      # File uploads (existing)
├── server-layered.js            # New layered server entry point
├── server.js                    # Original monolithic server
└── package.json
```

## 🚀 Quick Start

### Running the Layered Architecture Version

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run the layered architecture server
node server-layered.js

# Or use nodemon for development
nodemon server-layered.js
```

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anime_kun
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# SSO
DISCOURSE_SSO_SECRET=your-discourse-sso-secret

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

## 🎯 Key Features

### ✅ **Separation of Concerns**
- Each layer has a single responsibility
- Clear boundaries between layers
- Easy to test individual components

### ✅ **Repository Pattern**
- Abstracted database access
- Consistent query interface
- Easy to mock for testing

### ✅ **Service Layer**
- Business logic centralization
- Input validation and sanitization
- Error handling and transformation

### ✅ **Controller Layer**
- HTTP-specific logic only
- Response formatting
- Status code management

### ✅ **Router Layer**
- Clean route definitions
- Middleware composition
- Swagger documentation

## 📊 API Endpoints

### 🎬 Animes
- `GET /api/animes` - List animes with pagination/filters
- `GET /api/animes/:id` - Get anime by ID
- `GET /api/animes/by-url/:niceUrl` - Get anime by SEO URL
- `GET /api/animes/search?q=term` - Search animes
- `GET /api/animes/autocomplete?q=term` - Autocomplete suggestions
- `GET /api/animes/by-studio/:studio` - Animes by studio
- `GET /api/animes/by-year/:year` - Animes by year
- `GET /api/animes/by-tags?tags=1,2,3` - Animes by tags
- `GET /api/animes/statistics` - Anime statistics

### 📚 Mangas
- `GET /api/mangas` - List mangas with pagination/filters
- `GET /api/mangas/:id` - Get manga by ID
- `GET /api/mangas/by-url/:niceUrl` - Get manga by SEO URL
- `GET /api/mangas/search?q=term` - Search mangas
- `GET /api/mangas/autocomplete?q=term` - Autocomplete suggestions
- `GET /api/mangas/by-author/:author` - Mangas by author
- `GET /api/mangas/by-year/:year` - Mangas by year
- `GET /api/mangas/by-tags?tags=1,2,3` - Mangas by tags
- `GET /api/mangas/statistics` - Manga statistics

### 🔐 Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify` - Verify JWT token
- `GET /sso` - SSO login initiation
- `POST /sso/authenticate` - SSO authentication

### ⭐ Reviews
- `GET /api/reviews` - List reviews with filters
- `POST /api/reviews` - Create review (auth required)
- `GET /api/reviews/:id` - Get review by ID
- `PUT /api/reviews/:id` - Update review (auth required)
- `DELETE /api/reviews/:id` - Delete review (auth required)
- `GET /api/:mediaType/:mediaId/reviews` - Reviews for media
- `GET /api/:mediaType/:mediaId/rating` - Average rating for media
- `GET /api/users/:userId/reviews` - User's reviews
- `GET /api/reviews/top-rated/:mediaType` - Top rated media
- `GET /api/reviews/statistics` - Review statistics

### 👑 Admin Endpoints
- `GET /api/admin/animes` - Admin anime management
- `POST /api/admin/animes` - Create anime
- `PUT /api/admin/animes/:id` - Update anime
- `DELETE /api/admin/animes/:id` - Delete anime
- `GET /api/admin/mangas` - Admin manga management
- `POST /api/admin/mangas` - Create manga
- `PUT /api/admin/mangas/:id` - Update manga
- `DELETE /api/admin/mangas/:id` - Delete manga
- `GET /api/admin/users` - User management
- `GET /api/admin/reviews` - Review management

### 📊 System
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /docs` - Swagger documentation

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Cross-origin request security
- **Helmet Security** - HTTP security headers
- **Input Validation** - Request sanitization
- **SQL Injection Protection** - Parameterized queries
- **Admin Authorization** - Role-based access control

## 📚 Documentation

- **Swagger UI**: `http://localhost:3000/docs`
- **API JSON**: `http://localhost:3000/docs.json`
- **Health Check**: `http://localhost:3000/health`
- **Metrics**: `http://localhost:3000/metrics`

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:unit
npm run test:integration
```

## 🔄 Migration from Monolithic Version

The new layered architecture is designed to be backward-compatible with the existing API. To migrate:

1. **Test the new server**: `node server-layered.js`
2. **Compare responses**: Ensure API responses match
3. **Update deployment**: Switch entry point to `server-layered.js`
4. **Monitor**: Check logs and metrics after deployment

## 🏗️ Development Guidelines

### Adding New Features

1. **Data Layer**: Create repository methods
2. **Service Layer**: Implement business logic
3. **Controller Layer**: Handle HTTP requests
4. **Router Layer**: Define routes and middleware
5. **Documentation**: Update Swagger annotations

### Code Standards

- **ESLint** for code linting
- **Prettier** for code formatting
- **JSDoc** for function documentation
- **Consistent error handling** across layers
- **Input validation** at service layer
- **Response formatting** at controller layer

## 🚀 Deployment

### Production Considerations

- Set `NODE_ENV=production`
- Use process manager (PM2, systemd)
- Configure database connection pooling
- Set up monitoring and logging
- Enable metrics collection
- Configure rate limiting
- Set up SSL/TLS termination

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server-layered.js"]
```

### Health Checks

The `/health` endpoint provides:
- Service status
- Uptime information
- Memory usage
- Database connectivity (when implemented)

## 📈 Performance Benefits

1. **Better Caching**: Service layer enables efficient caching
2. **Database Optimization**: Repository pattern centralizes queries
3. **Error Handling**: Consistent error responses
4. **Request Validation**: Early input validation
5. **Code Reusability**: Shared business logic
6. **Testing**: Easier unit and integration testing

## 🔍 Monitoring

- **Prometheus Metrics**: `/metrics` endpoint
- **Health Checks**: `/health` endpoint
- **Request Logging**: Morgan middleware
- **Error Tracking**: Centralized error handling
- **Performance Monitoring**: Request duration tracking

---

**Note**: This layered architecture provides a solid foundation for scaling the Anime-Kun API while maintaining backward compatibility with existing clients.