# 🚀 Anime-Kun Launcher Scripts

Easy-to-use shell scripts to launch your entire Anime-Kun development environment.

## 📋 Available Scripts

### 🔧 **Development Mode**
```bash
./launch-dev.sh
```
- Starts NestJS API on port 3000
- Starts Frontend V2 on port 3001  
- Shows live logs from both services
- Perfect for development and testing

### 🏭 **Production Mode**
```bash
./launch-prod.sh
```
- Builds both applications for production
- Starts optimized production servers
- Better performance and security
- Use for production deployments

### 🐳 **Docker Mode**
```bash
./launch-docker.sh           # Start with logs
./launch-docker.sh --build   # Force rebuild images
./launch-docker.sh --detach  # Run in background
```
- Uses Docker Compose for containerized deployment
- Includes PostgreSQL database and Adminer
- Isolated environment with all dependencies

### 🛑 **Stop All Services**
```bash
./stop-all.sh
```
- Stops all running Anime-Kun processes
- Kills processes on ports 3000, 3001, 5432, 8081
- Cleans up Docker containers
- Frees all resources

## 🎯 Quick Start

1. **For Development:**
   ```bash
   ./launch-dev.sh
   ```
   
2. **Open in Browser:**
   - Frontend: http://localhost:3001
   - API: http://localhost:3000
   - API Docs: http://localhost:3000/api

3. **Stop Everything:**
   ```bash
   # Press Ctrl+C in the terminal, or run:
   ./stop-all.sh
   ```

## ⚙️ What Each Script Does

### `launch-dev.sh`
- ✅ Checks if directories exist
- ✅ Frees up ports 3000 and 3001
- ✅ Installs dependencies if needed
- ✅ Starts NestJS API in development mode
- ✅ Waits for API to be ready
- ✅ Starts Frontend V2 in development mode
- ✅ Shows live logs from both services
- ✅ Cleanup on exit (Ctrl+C)

### `launch-prod.sh`
- ✅ Builds NestJS application
- ✅ Builds Frontend V2 application  
- ✅ Starts both in production mode
- ✅ Optimized for performance
- ✅ Production logging

### `launch-docker.sh`
- ✅ Validates Docker installation
- ✅ Stops existing containers
- ✅ Starts full stack with docker-compose
- ✅ Includes database and admin tools
- ✅ Options for build and detached mode

### `stop-all.sh`
- ✅ Stops Docker containers
- ✅ Kills processes on specific ports
- ✅ Cleans up npm/node processes
- ✅ Reports remaining processes

## 🔧 Prerequisites

### For Development/Production Scripts:
- Node.js 18+ installed
- npm installed
- Both `anime-kun-nestjs-v2` and `frontendv2` directories present

### For Docker Script:
- Docker installed and running
- Docker Compose available
- `docker-compose.yml` file present

## 📊 Monitoring

### Log Files (Development/Production):
- `nestjs.log` / `nestjs-prod.log` - NestJS API logs
- `frontend.log` / `frontend-prod.log` - Frontend V2 logs

### Live Monitoring:
```bash
# View logs in real-time
tail -f nestjs.log frontend.log

# Monitor Docker logs
docker-compose logs -f
```

## 🌐 Service URLs

| Service | Development | Production | Docker |
|---------|-------------|------------|--------|
| Frontend V2 | http://localhost:3001 | http://localhost:3001 | http://localhost:3001 |
| NestJS API | http://localhost:3000 | http://localhost:3000 | http://localhost:3000 |
| API Docs | http://localhost:3000/api | http://localhost:3000/api | http://localhost:3000/api |
| PostgreSQL | - | - | localhost:5432 |
| Adminer | - | - | http://localhost:8081 |

## 🚨 Troubleshooting

### Port Already in Use:
```bash
# The scripts automatically handle this, but if needed:
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
lsof -ti:3001 | xargs kill -9  # Kill process on port 3001
```

### Dependencies Issues:
```bash
# Clean install in both directories:
cd anime-kun-nestjs-v2 && rm -rf node_modules && npm install
cd ../frontendv2 && rm -rf node_modules && npm install
```

### Docker Issues:
```bash
# Reset Docker environment:
docker-compose down
docker system prune -f
./launch-docker.sh --build
```

### Permission Issues:
```bash
# Make scripts executable:
chmod +x *.sh
```

## 💡 Tips

1. **Development**: Use `./launch-dev.sh` for daily development
2. **Testing**: Use `./launch-docker.sh` for full environment testing
3. **Production**: Use `./launch-prod.sh` for production deployments
4. **Quick Stop**: Always use `./stop-all.sh` for clean shutdown

## 🔄 Script Features

- **🎨 Colored Output**: Easy to read status messages
- **⏱️ Health Checks**: Ensures services are ready before proceeding
- **🧹 Auto Cleanup**: Proper shutdown on interruption
- **📝 Detailed Logging**: Comprehensive logs for debugging
- **🔍 Port Management**: Automatic port conflict resolution
- **⚡ Fast Startup**: Optimized startup sequence

## 📞 Support

If you encounter issues:

1. Check the log files for detailed error messages
2. Ensure all prerequisites are installed
3. Try `./stop-all.sh` and restart
4. For Docker issues, try rebuilding with `--build` flag

Happy coding! 🎉