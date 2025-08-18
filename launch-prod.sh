#!/bin/bash

# Anime-Kun Production Launcher
# Builds and launches both services in production mode

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

# Cleanup function
cleanup() {
    print_status "Stopping all processes..."
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
        print_status "Stopped NestJS API (PID: $API_PID)"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_status "Stopped Frontend V2 (PID: $FRONTEND_PID)"
    fi
    print_success "All processes stopped. Goodbye! 👋"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

print_status "🏗️  Building Anime-Kun Production Environment"
echo

# Check if directories exist
if [ ! -d "anime-kun-nestjs-v2" ]; then
    print_error "NestJS directory 'anime-kun-nestjs-v2' not found!"
    exit 1
fi

if [ ! -d "frontendv2" ]; then
    print_error "Frontend directory 'frontendv2' not found!"
    exit 1
fi

# Check if ports are available
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port is already in use (needed for $service)"
        read -p "Kill process on port $port? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
            sleep 1
            print_success "Port $port is now available"
        else
            print_error "Cannot proceed with port $port occupied"
            exit 1
        fi
    fi
}

check_port 3003 "NestJS API"
check_port 3004 "Frontend V2"

# Build NestJS API
print_status "🔨 Building NestJS API..."
cd anime-kun-nestjs-v2

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_warning "Installing NestJS dependencies..."
    npm ci --only=production
    print_success "NestJS dependencies installed"
fi

# Build the application
print_status "Building NestJS application..."
npm run build
print_success "NestJS build completed"

# Start NestJS in production mode
print_status "Starting NestJS API in production mode..."
NODE_ENV=production PORT=3003 npm run start:prod > ../nestjs-prod.log 2>&1 &
API_PID=$!
cd ..

print_status "NestJS API starting... (PID: $API_PID)"

# Wait for NestJS to start
for i in {1..15}; do
    if curl -s http://localhost:3003 >/dev/null 2>&1; then
        print_success "NestJS API is running on http://localhost:3003"
        break
    fi
    if [ $i -eq 15 ]; then
        print_error "NestJS API is not responding after 15 seconds"
        print_status "Check nestjs-prod.log for details:"
        tail -10 nestjs-prod.log
        exit 1
    fi
    print_status "Waiting for NestJS API to start... ($i/15)"
    sleep 1
done

# Build Frontend V2
print_status "🔨 Building Frontend V2..."
cd frontendv2

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_warning "Installing Frontend dependencies..."
    npm ci --only=production
    print_success "Frontend dependencies installed"
fi

# Set production environment
export NODE_ENV=production
export API_BASE_URL=http://localhost:3003

# Build the application
print_status "Building Frontend V2 application..."
npm run build
print_success "Frontend V2 build completed"

# Start Frontend in production mode
print_status "Starting Frontend V2 in production mode..."
PORT=3004 npm run preview > ../frontend-prod.log 2>&1 &
FRONTEND_PID=$!
cd ..

print_status "Frontend V2 starting... (PID: $FRONTEND_PID)"

# Wait for Frontend to start
for i in {1..15}; do
    if curl -s http://localhost:3004 >/dev/null 2>&1; then
        print_success "Frontend V2 is running on http://localhost:3004"
        break
    fi
    if [ $i -eq 15 ]; then
        print_error "Frontend V2 is not responding after 15 seconds"
        print_status "Check frontend-prod.log for details:"
        tail -10 frontend-prod.log
        exit 1
    fi
    print_status "Waiting for Frontend V2 to start... ($i/15)"
    sleep 1
done

echo
print_success "🚀 Production environment is ready!"
echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📡 NestJS API:${NC}      http://localhost:3003"
echo -e "${GREEN}🎨 Frontend V2:${NC}     http://localhost:3004"
echo -e "${GREEN}📖 API Docs:${NC}        http://localhost:3003/api (Swagger)"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
print_status "Production logs are being written to:"
print_status "  • nestjs-prod.log (NestJS API logs)"
print_status "  • frontend-prod.log (Frontend V2 logs)"
echo
print_warning "Press Ctrl+C to stop both services"
echo

# Show live logs
print_status "📊 Live logs (press Ctrl+C to stop):"
echo
tail -f nestjs-prod.log frontend-prod.log