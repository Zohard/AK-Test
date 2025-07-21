#!/bin/bash

echo "🔍 MySQL ak_users Table Viewer"
echo "=============================="
echo ""

# Prompt for credentials
read -p "MySQL Host (default: localhost): " MYSQL_HOST
MYSQL_HOST=${MYSQL_HOST:-localhost}

read -p "MySQL User (default: root): " MYSQL_USER  
MYSQL_USER=${MYSQL_USER:-root}

read -s -p "MySQL Password: " MYSQL_PASSWORD
echo ""

read -p "Database Name (default: anime_kun): " MYSQL_DB
MYSQL_DB=${MYSQL_DB:-anime_kun}

echo ""
echo "🔌 Connecting to MySQL..."

# Test connection
if ! mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DB;" &>/dev/null; then
    echo "❌ Connection failed! Please check your credentials."
    exit 1
fi

echo "✅ Connected successfully!"
echo ""

# Show ak_users table structure
echo "📋 Table Structure:"
mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DB; DESCRIBE ak_users;" 2>/dev/null

echo ""

# Count total users
total_users=$(mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DB; SELECT COUNT(*) FROM ak_users;" 2>/dev/null | tail -n +2)
echo "👥 Total Users: $total_users"

echo ""
echo "📊 User Data:"

# Show user data (hiding sensitive information)
mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "
USE $MYSQL_DB; 
SELECT 
    id_membre,
    pseudo,
    email,
    DATE(date_inscription) as date_inscription,
    statut,
    CASE 
        WHEN avatar IS NULL OR avatar = '' THEN 'No avatar'
        ELSE 'Has avatar' 
    END as avatar_status,
    CASE 
        WHEN signature IS NULL OR signature = '' THEN 'No signature' 
        ELSE LEFT(signature, 50) 
    END as signature_preview
FROM ak_users 
ORDER BY id_membre 
LIMIT 20;
" 2>/dev/null

echo ""
echo "🎯 Sample critiques by these users:"

# Show some critiques to see the user relationships
mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "
USE $MYSQL_DB;
SELECT 
    u.pseudo as username,
    COUNT(c.id_critique) as critique_count,
    AVG(c.notation) as avg_rating
FROM ak_users u
LEFT JOIN ak_critique c ON u.id_membre = c.id_membre
GROUP BY u.id_membre, u.pseudo
ORDER BY critique_count DESC
LIMIT 10;
" 2>/dev/null

echo ""
echo "✨ Recent critiques:"

mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "
USE $MYSQL_DB;
SELECT 
    u.pseudo as author,
    c.titre as critique_title,
    c.notation as rating,
    DATE(c.date_critique) as date
FROM ak_critique c
JOIN ak_users u ON c.id_membre = u.id_membre
ORDER BY c.date_critique DESC
LIMIT 5;
" 2>/dev/null