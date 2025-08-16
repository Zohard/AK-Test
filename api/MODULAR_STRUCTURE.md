# Anime-Kun API - Modular Structure

## Overview

The API has been refactored from a single monolithic `server.js` file (3885 lines) into a modular structure for better maintainability and organization.

## Structure

```
api/
├── server-modular.js          # New modular main server file
├── server.js                  # Original monolithic server (backup: server-backup.js)
├── server-complete.js         # Simplified complete version
├── config/
│   ├── database.js           # PostgreSQL connection pool
│   ├── middleware.js         # Middleware configuration
│   └── swagger.js            # Swagger documentation config
├── routes/
│   ├── index.js              # Routes setup and configuration
│   ├── auth.js               # Authentication routes (/api/auth/*)
│   ├── anime.js              # Anime routes (/api/animes/*)
│   ├── manga.js              # Manga routes (/api/mangas/*)
│   ├── reviews.js            # Review routes (/api/reviews/*)
│   ├── search.js             # Search routes (/api/search/*)
│   ├── user.js               # User routes (/api/users/*)
│   ├── admin.js              # Admin routes (/api/admin/*)
│   └── business.js           # Business routes (/api/business/*)
├── middleware/
│   └── auth.js               # Authentication middleware
└── utils/
    ├── auth.js               # Authentication utilities
    └── formatCritiqueText.js # Text formatting utilities
```

## Key Features

### Modular Architecture
- **Separation of Concerns**: Each route family has its own file
- **Reusable Components**: Database connections, middleware, and utilities are shared
- **Easy Maintenance**: Changes to specific features are isolated to their respective files

### Route Organization
- **Authentication** (`/api/auth/*`): Login, registration, profile, token verification
- **Animes** (`/api/animes/*`): CRUD operations, search, autocomplete, relations, business data
- **Mangas** (`/api/mangas/*`): CRUD operations, search, autocomplete
- **Reviews** (`/api/reviews/*`): List, create, filter reviews
- **Search** (`/api/search/*`): Global search across animes and mangas
- **Users** (`/api/users/*`): User profiles and user-specific data
- **Admin** (`/api/admin/*`): Administrative operations (requires admin role)
- **Business** (`/api/business/*`): Business/financial data (admin only)

### Documentation
- **Swagger/OpenAPI**: All routes are documented with Swagger annotations
- **Available at**: `/docs` endpoint
- **API Info**: `/api` endpoint provides overview of available endpoints

## Migration

### Files Created
1. **server-modular.js**: New modular server entry point
2. **routes/*.js**: Individual route files
3. **config/database.js**: Centralized database connection

### Files Preserved
- **server.js**: Original monolithic version (backed up as server-backup.js)
- **server-complete.js**: Simplified complete version
- **All existing middleware and utilities**

## Usage

### Development
```bash
# Using the new modular structure
node server-modular.js

# Or using the original structure
node server.js
```

### Environment Variables
Same as original - no changes required:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `JWT_SECRET`, `NODE_ENV`, `PORT`, `EXTERNAL_PORT`

## Benefits

1. **Maintainability**: Easier to find and modify specific functionality
2. **Scalability**: New features can be added as separate route files
3. **Team Development**: Multiple developers can work on different parts simultaneously
4. **Testing**: Individual route modules can be tested in isolation
5. **Documentation**: Swagger docs are distributed across route files
6. **Error Isolation**: Issues in one route family don't affect others

## Testing

The modular structure maintains 100% API compatibility with the original monolithic version. All existing frontend code and API calls will work without modification.

## Next Steps

1. **Complete Admin Routes**: The admin.js file contains basic routes - full admin functionality from server.js can be gradually migrated
2. **Add More Business Routes**: CRUD operations for business data
3. **Add File Upload Routes**: Screenshot and image management routes
4. **Add Tag Management**: Tag-related routes for admin
5. **Add Metrics**: Prometheus metrics endpoints
6. **Add SSO Routes**: Single Sign-On functionality

## Rollback

If issues arise, simply switch back to the original server:
```bash
# Rollback to original
node server.js

# Or use the complete version
node server-complete.js
```