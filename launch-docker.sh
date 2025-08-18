#!/bin/bash

# Anime-Kun Docker Launcher
# Launches both services using Docker Compose

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} ✅ $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')]${NC} ❌ $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} ⚠️  $1"
}

print_status "🐳 Starting Anime-Kun with Docker"
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found in current directory!"
    exit 1
fi

# Function to handle cleanup
cleanup() {
    print_status "Stopping Docker containers..."
    if command -v docker-compose &> /dev/null; then
        docker-compose down
    else
        docker compose down
    fi
    print_success "All containers stopped. Goodbye! 👋"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Parse command line arguments
BUILD_FLAG=""
DETACH_FLAG=""
LOGS_FLAG="--follow"

while [[ $# -gt 0 ]]; do
    case $1 in
        --build|-b)
            BUILD_FLAG="--build"
            shift
            ;;
        --detach|-d)
            DETACH_FLAG="--detach"
            LOGS_FLAG=""
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --build, -b     Force rebuild of Docker images"
            echo "  --detach, -d    Run containers in detached mode"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0              # Start with logs"
            echo "  $0 --build      # Rebuild and start"
            echo "  $0 --detach     # Start in background"
            exit 0
            ;;
        *)
            print_warning "Unknown option: $1"
            print_status "Use --help for available options"
            shift
            ;;
    esac
done

# Stop any existing containers
print_status "Stopping existing containers..."
if command -v docker-compose &> /dev/null; then
    docker-compose down 2>/dev/null || true
else
    docker compose down 2>/dev/null || true
fi

# Start services
if [ ! -z "$BUILD_FLAG" ]; then
    print_status "🔨 Building and starting Docker containers..."
else
    print_status "🚀 Starting Docker containers..."
fi

if command -v docker-compose &> /dev/null; then
    docker-compose up $BUILD_FLAG $DETACH_FLAG $LOGS_FLAG
else
    docker compose up $BUILD_FLAG $DETACH_FLAG $LOGS_FLAG
fi

# If running in detached mode, show status and URLs
if [ ! -z "$DETACH_FLAG" ]; then
    sleep 5
    echo
    print_success "🎉 Docker environment is running in background!"
    echo
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📡 NestJS API:${NC}      http://localhost:3003"
    echo -e "${GREEN}🎨 Frontend V2:${NC}     http://localhost:3004"
    echo -e "${GREEN}🗄️  PostgreSQL:${NC}     localhost:5432"
    echo -e "${GREEN}🔧 Adminer:${NC}         http://localhost:8081"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
    print_status "To view logs: docker-compose logs -f"
    print_status "To stop: docker-compose down"
    
    # Don't cleanup automatically in detached mode
    trap - SIGINT SIGTERM EXIT
fi