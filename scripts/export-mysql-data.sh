#!/bin/bash

# MySQL to PostgreSQL Data Export Script
echo "🔄 Exporting MySQL data for PostgreSQL import"
echo "=============================================="

# Configuration
MYSQL_HOST=${MYSQL_HOST:-localhost}
MYSQL_USER=${MYSQL_USER:-root}
MYSQL_DB=${MYSQL_DB:-anime_kun}
EXPORT_DIR="./mysql-export"

# Create export directory
mkdir -p "$EXPORT_DIR"

# Check if MySQL database exists
echo "🔍 Checking MySQL database..."
if ! mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p -e "USE $MYSQL_DB;" 2>/dev/null; then
    echo "❌ Cannot connect to MySQL database '$MYSQL_DB'"
    echo "Please ensure MySQL is running and database exists."
    echo ""
    echo "To create a sample database, run:"
    echo "mysql -u root -p < schema.sql"
    exit 1
fi

echo "✅ MySQL database found"

# Export tables as CSV
echo "📦 Exporting tables to CSV..."

tables=(
    "ak_animes"
    "ak_mangas" 
    "ak_users"
    "ak_critique"
    "ak_webzine_articles"
    "ak_article_authors"
    "ak_business"
    "ak_business_to_animes"
    "ak_business_to_mangas"
    "ak_rel_animes"
    "ak_rel_mangas"
)

for table in "${tables[@]}"; do
    echo "📊 Exporting $table..."
    
    # Check if table exists
    if mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM $MYSQL_DB.$table LIMIT 1;" &>/dev/null; then
        # Export with headers
        mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
            -e "SELECT * FROM $table;" \
            --batch --raw \
            "$MYSQL_DB" > "$EXPORT_DIR/${table}.tsv"
        
        # Count records
        count=$(tail -n +2 "$EXPORT_DIR/${table}.tsv" | wc -l)
        echo "   ✅ Exported $count records"
    else
        echo "   ⚠️  Table $table not found, skipping..."
    fi
done

echo ""
echo "🎉 Export completed!"
echo "📁 Files exported to: $EXPORT_DIR"
echo ""
echo "Next steps:"
echo "1. Run: node migrate-mysql-to-postgresql.js"
echo "2. Or manually import using: psql -U anime_user -d anime_kun -f import-data.sql"