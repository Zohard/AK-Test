#!/bin/bash

# Stop All Anime-Kun Services
# Stops all running development and production processes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} ✅ $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} ⚠️  $1"
}

print_status "🛑 Stopping all Anime-Kun services..."
echo

# Stop Docker containers
if command -v docker-compose &> /dev/null; then
    if docker-compose ps -q 2>/dev/null | grep -q .; then
        print_status "Stopping Docker containers..."
        docker-compose down
        print_success "Docker containers stopped"
    fi
elif docker compose version &> /dev/null 2>&1; then
    if docker compose ps -q 2>/dev/null | grep -q .; then
        print_status "Stopping Docker containers..."
        docker compose down
        print_success "Docker containers stopped"
    fi
fi

# Kill processes on specific ports
kill_port() {
    local port=$1
    local service=$2
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pids" ]; then
        print_status "Killing $service processes on port $port..."
        echo $pids | xargs kill -9 2>/dev/null || true
        print_success "$service stopped (port $port)"
    fi
}

# Stop services on known ports
kill_port 3003 "NestJS API"
kill_port 3004 "Frontend V2"
kill_port 5432 "PostgreSQL"
kill_port 8081 "Adminer"

# Kill any npm/node processes related to our projects
print_status "Stopping any remaining npm/node processes..."

# Kill npm processes
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "npm.*preview" 2>/dev/null || true

# Kill node processes from our directories
pkill -f "anime-kun-nestjs-v2" 2>/dev/null || true
pkill -f "frontendv2" 2>/dev/null || true

# Give processes time to clean up
sleep 2

echo
print_success "🎉 All Anime-Kun services have been stopped!"
echo

# Show any remaining processes on our ports
remaining_processes=0
for port in 3003 3004 5432 8081; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        if [ $remaining_processes -eq 0 ]; then
            print_warning "Some processes are still running:"
            remaining_processes=1
        fi
        echo "  Port $port: $(lsof -Pi :$port -sTCP:LISTEN)"
    fi
done

if [ $remaining_processes -eq 0 ]; then
    print_success "All ports are now free ✨"
fi

echo
print_status "You can now:"
print_status "  • Run ./launch-dev.sh for development"
print_status "  • Run ./launch-prod.sh for production"
print_status "  • Run ./launch-docker.sh for Docker"