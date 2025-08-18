# New Docker Setup for Anime-Kun

This document explains the new Docker configuration that runs both the legacy system and the new NestJS + Nuxt 3 stack simultaneously.

## Architecture Overview

The new setup includes:

- **NestJS API** (Port 3003): Modern TypeScript backend with Prisma ORM
- **Nuxt 3 Frontend V2** (Port 3000): Modern Vue 3 frontend with TypeScript
- **Legacy API** (Port 3001): Original Express.js API (backward compatibility)
- **Legacy Frontend** (Port 3002): Original Nuxt 2 frontend (backward compatibility)
- **PostgreSQL Database** (Port 5432): Shared database for all services
- **Adminer** (Port 8081): Database administration interface
- **Nginx** (Port 80/443): Reverse proxy for production routing

## Files Created

### Docker Configuration
- `Dockerfile.nestjs` - Multi-stage build for NestJS backend
- `Dockerfile.frontendv2` - Multi-stage build for Nuxt 3 frontend
- `docker-compose.new.yml` - Complete orchestration configuration
- `nginx.conf` - Reverse proxy configuration

### Backup
- `docker-backup/` - Contains backup of old Docker configuration

## Usage

### Development Mode
```bash
# Start all services
docker-compose -f docker-compose.new.yml up -d

# Start specific services
docker-compose -f docker-compose.new.yml up nestjs-api frontendv2 anime-kun-postgres

# View logs
docker-compose -f docker-compose.new.yml logs -f nestjs-api
```

### Production Mode
```bash
# Build and start with nginx proxy
docker-compose -f docker-compose.new.yml up -d

# Access via nginx (port 80)
# - Main app: http://localhost/
# - API: http://localhost/api/
# - Legacy frontend: http://localhost/legacy/
# - Legacy API: http://localhost/legacy-api/
```

### Direct Access (Development)
- **New Frontend**: http://localhost:3000
- **New API**: http://localhost:3003
- **Legacy Frontend**: http://localhost:3002
- **Legacy API**: http://localhost:3001
- **Database Admin**: http://localhost:8081

## Environment Variables

### NestJS API
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret (change in production!)
- `PORT`: API port (default: 3003)
- `NODE_ENV`: Environment mode

### Frontend V2
- `API_BASE_URL`: Backend API URL
- `NITRO_PORT`: Frontend port
- `NUXT_PUBLIC_API_BASE`: Public API base URL

## Migration Strategy

1. **Phase 1**: Both systems run simultaneously
2. **Phase 2**: Gradually migrate users to new frontend
3. **Phase 3**: Remove legacy services when migration is complete

## Security Notes

- Change `JWT_SECRET` in production
- Use environment files for sensitive data
- Non-root users in containers
- Health checks included
- Resource limits recommended for production

## Volumes

- `db_data`: PostgreSQL data persistence
- `nestjs_uploads`: File uploads for new API
- `legacy_uploads`: File uploads for legacy API

## Networks

All services communicate via the `anime-kun-network` bridge network for improved security and isolation.