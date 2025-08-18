#!/bin/bash

# Anime-Kun Development Launcher
# Launches both NestJS API and Frontend V2 in development mode

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

# Check if directories exist
if [ ! -d "anime-kun-nestjs-v2" ]; then
    print_error "NestJS directory 'anime-kun-nestjs-v2' not found!"
    exit 1
fi

if [ ! -d "frontendv2" ]; then
    print_error "Frontend directory 'frontendv2' not found!"
    exit 1
fi

print_status "🚀 Starting Anime-Kun Development Environment"
echo
print_status "This will start:"
print_status "  • NestJS API on port 3003"
print_status "  • Frontend V2 on port 3004"
echo

# Check if ports are available
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port is already in use (needed for $service)"
        print_status "Trying to kill process on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_error "Could not free port $port. Please stop the service manually."
            exit 1
        fi
        print_success "Port $port is now available"
    fi
}

check_port 3003 "NestJS API"
check_port 3004 "Frontend V2"

# Start NestJS API
print_status "📡 Starting NestJS API..."
cd anime-kun-nestjs-v2

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "Installing NestJS dependencies..."
    npm install
    print_success "NestJS dependencies installed"
fi

# Start NestJS in background with custom port
PORT=3003 npm run start:dev > ../nestjs.log 2>&1 &
API_PID=$!
cd ..

print_status "NestJS API starting... (PID: $API_PID)"

# Wait a bit for NestJS to start
sleep 3

# Check if NestJS is running
if ! ps -p $API_PID > /dev/null; then
    print_error "Failed to start NestJS API"
    print_status "Check nestjs.log for details:"
    tail -10 nestjs.log
    exit 1
fi

# Check if NestJS is responding
for i in {1..10}; do
    if curl -s http://localhost:3003 >/dev/null 2>&1; then
        print_success "NestJS API is running on http://localhost:3003"
        break
    fi
    if [ $i -eq 10 ]; then
        print_error "NestJS API is not responding after 10 seconds"
        print_status "Check nestjs.log for details:"
        tail -10 nestjs.log
        exit 1
    fi
    print_status "Waiting for NestJS API to start... ($i/10)"
    sleep 1
done

# Start Frontend V2
print_status "🎨 Starting Frontend V2..."
cd frontendv2

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "Installing Frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
fi

# Start Frontend in background with custom port
PORT=3004 npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

print_status "Frontend V2 starting... (PID: $FRONTEND_PID)"

# Wait a bit for Frontend to start
sleep 5

# Check if Frontend is running
if ! ps -p $FRONTEND_PID > /dev/null; then
    print_error "Failed to start Frontend V2"
    print_status "Check frontend.log for details:"
    tail -10 frontend.log
    exit 1
fi

# Check if Frontend is responding
for i in {1..15}; do
    if curl -s http://localhost:3004 >/dev/null 2>&1; then
        print_success "Frontend V2 is running on http://localhost:3004"
        break
    fi
    if [ $i -eq 15 ]; then
        print_error "Frontend V2 is not responding after 15 seconds"
        print_status "Check frontend.log for details:"
        tail -10 frontend.log
        exit 1
    fi
    print_status "Waiting for Frontend V2 to start... ($i/15)"
    sleep 1
done

echo
print_success "🎉 Development environment is ready!"
echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📡 NestJS API:${NC}      http://localhost:3003"
echo -e "${GREEN}🎨 Frontend V2:${NC}     http://localhost:3004"
echo -e "${GREEN}📖 API Docs:${NC}        http://localhost:3003/api (Swagger)"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
print_status "Logs are being written to:"
print_status "  • nestjs.log (NestJS API logs)"
print_status "  • frontend.log (Frontend V2 logs)"
echo
print_warning "Press Ctrl+C to stop both services"
echo

# Keep script running and show live logs
print_status "📊 Live logs (press Ctrl+C to stop):"
echo

# Function to show live logs from both services
show_live_logs() {
    tail -f nestjs.log frontend.log &
    TAIL_PID=$!
    wait $TAIL_PID
}

# Show live logs
show_live_logs