#!/bin/bash

echo "🚀 Starting SMF Forums with Docker..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start the forums
echo "📦 Building and starting containers..."
docker-compose -f docker-compose.forums.yml up -d

echo ""
echo "✅ SMF Forums setup complete!"
echo ""
echo "🌐 Access your forum at: http://localhost:8082"
echo "🗄️  Database admin (Adminer) at: http://localhost:8081"
echo ""
echo "📊 Database connection details:"
echo "   Host: postgres-forums"
echo "   Database: smf_forum"
echo "   Username: smf_user"
echo "   Password: smf_password"
echo ""
echo "🛑 To stop the forums, run: docker-compose -f docker-compose.forums.yml down"
echo "💾 To stop and remove all data: docker-compose -f docker-compose.forums.yml down -v"