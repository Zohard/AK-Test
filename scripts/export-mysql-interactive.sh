#!/bin/bash

echo "🔄 MySQL to PostgreSQL Data Export Wizard"
echo "=========================================="
echo ""

# Function to prompt for MySQL credentials
get_mysql_credentials() {
    echo "📋 MySQL Connection Details:"
    echo ""
    
    read -p "MySQL Host (default: localhost): " MYSQL_HOST
    MYSQL_HOST=${MYSQL_HOST:-localhost}
    
    read -p "MySQL User (default: root): " MYSQL_USER
    MYSQL_USER=${MYSQL_USER:-root}
    
    read -s -p "MySQL Password: " MYSQL_PASSWORD
    echo ""
    
    read -p "Database Name (default: anime_kun): " MYSQL_DB
    MYSQL_DB=${MYSQL_DB:-anime_kun}
    
    read -p "MySQL Port (default: 3306): " MYSQL_PORT
    MYSQL_PORT=${MYSQL_PORT:-3306}
}

# Function to test MySQL connection
test_mysql_connection() {
    echo ""
    echo "🔍 Testing MySQL connection..."
    
    if mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DB; SELECT 1;" &>/dev/null; then
        echo "✅ MySQL connection successful!"
        return 0
    else
        echo "❌ MySQL connection failed!"
        echo "Please check your credentials and try again."
        return 1
    fi
}

# Function to show available databases
show_databases() {
    echo ""
    echo "📊 Available databases:"
    mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SHOW DATABASES;" 2>/dev/null | grep -v -E "^(Database|information_schema|performance_schema|mysql|sys)$" | sed 's/^/  - /'
}

# Function to show tables in selected database
show_tables() {
    echo ""
    echo "📋 Tables in database '$MYSQL_DB':"
    mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DB; SHOW TABLES;" 2>/dev/null | tail -n +2 | while read table; do
        count=$(mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DB; SELECT COUNT(*) FROM $table;" 2>/dev/null | tail -n +2)
        echo "  📊 $table ($count records)"
    done
}

# Function to export data
export_data() {
    EXPORT_DIR="./mysql-export-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$EXPORT_DIR"
    
    echo ""
    echo "📦 Exporting data to: $EXPORT_DIR"
    echo ""
    
    # Tables to export (in dependency order)
    tables=(
        "ak_users"
        "ak_animes" 
        "ak_mangas"
        "ak_critique"
        "ak_webzine_articles"
        "ak_article_authors"
        "ak_business"
        "ak_business_to_animes"
        "ak_business_to_mangas"
        "ak_rel_animes"
        "ak_rel_mangas"
    )
    
    total_records=0
    
    for table in "${tables[@]}"; do
        echo "📊 Exporting $table..."
        
        # Check if table exists
        if mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DB; DESCRIBE $table;" &>/dev/null; then
            # Export as SQL INSERT statements
            mysqldump -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
                --no-create-info \
                --skip-triggers \
                --single-transaction \
                --routines=false \
                --events=false \
                "$MYSQL_DB" "$table" > "$EXPORT_DIR/${table}.sql" 2>/dev/null
            
            # Also export as CSV for manual inspection
            mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
                --batch --raw \
                -e "USE $MYSQL_DB; SELECT * FROM $table;" > "$EXPORT_DIR/${table}.tsv" 2>/dev/null
            
            # Count records
            count=$(mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
                -e "USE $MYSQL_DB; SELECT COUNT(*) FROM $table;" 2>/dev/null | tail -n +2)
            
            echo "   ✅ Exported $count records"
            total_records=$((total_records + count))
        else
            echo "   ⚠️  Table $table not found, skipping..."
        fi
    done
    
    # Create import script
    cat > "$EXPORT_DIR/import-to-postgresql.sh" << 'EOF'
#!/bin/bash
echo "🔄 Importing MySQL data to PostgreSQL..."
echo "======================================"

# PostgreSQL connection details
PG_HOST=${PG_HOST:-localhost}
PG_USER=${PG_USER:-anime_user}
PG_PASSWORD=${PG_PASSWORD:-anime_password}
PG_DATABASE=${PG_DATABASE:-anime_kun}
PG_PORT=${PG_PORT:-5432}

echo "🧹 Clearing existing data..."
PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" -c "
TRUNCATE TABLE ak_users RESTART IDENTITY CASCADE;
TRUNCATE TABLE ak_business RESTART IDENTITY CASCADE;
"

echo "📥 Importing tables..."
for sql_file in *.sql; do
    if [ -f "$sql_file" ]; then
        table_name=$(basename "$sql_file" .sql)
        echo "📊 Importing $table_name..."
        
        # Convert MySQL syntax to PostgreSQL
        sed -e "s/\`//g" \
            -e "s/AUTO_INCREMENT//g" \
            -e "s/ENGINE=InnoDB//g" \
            -e "s/DEFAULT CHARSET=utf8mb4//g" \
            -e "s/COLLATE=utf8mb4_unicode_ci//g" \
            "$sql_file" | \
        PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" 2>/dev/null
        
        echo "   ✅ Imported $table_name"
    fi
done

echo "🔧 Updating sequences..."
PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" -c "
SELECT setval('ak_users_id_membre_seq', (SELECT COALESCE(MAX(id_membre), 1) FROM ak_users));
SELECT setval('ak_animes_id_anime_seq', (SELECT COALESCE(MAX(id_anime), 1) FROM ak_animes));
SELECT setval('ak_mangas_id_manga_seq', (SELECT COALESCE(MAX(id_manga), 1) FROM ak_mangas));
SELECT setval('ak_critique_id_critique_seq', (SELECT COALESCE(MAX(id_critique), 1) FROM ak_critique));
SELECT setval('ak_business_id_business_seq', (SELECT COALESCE(MAX(id_business), 1) FROM ak_business));
"

echo "🎉 Import completed!"
EOF

    chmod +x "$EXPORT_DIR/import-to-postgresql.sh"
    
    # Create summary file
    cat > "$EXPORT_DIR/export-summary.txt" << EOF
MySQL Export Summary
===================
Date: $(date)
Source Database: $MYSQL_DB@$MYSQL_HOST:$MYSQL_PORT
Total Records: $total_records

Files Created:
- *.sql - SQL INSERT statements for each table
- *.tsv - Tab-separated values for manual inspection
- import-to-postgresql.sh - Script to import to PostgreSQL

Next Steps:
1. Review the exported data in the .tsv files
2. Run: ./import-to-postgresql.sh
3. Test your application with the real data
EOF
    
    echo ""
    echo "🎉 Export completed successfully!"
    echo "📁 Files exported to: $EXPORT_DIR"
    echo "📊 Total records exported: $total_records"
    echo ""
    echo "📋 Next steps:"
    echo "1. Review exported data: ls -la $EXPORT_DIR"
    echo "2. Import to PostgreSQL: cd $EXPORT_DIR && ./import-to-postgresql.sh"
    echo "3. Or use the migration script: node migrate-mysql-to-postgresql.js"
}

# Main script flow
main() {
    get_mysql_credentials
    
    if test_mysql_connection; then
        show_databases
        
        echo ""
        read -p "Is '$MYSQL_DB' the correct database? (y/n): " confirm
        if [[ $confirm != [yY] ]]; then
            echo "Please restart the script with the correct database name."
            exit 1
        fi
        
        show_tables
        
        echo ""
        read -p "Proceed with export? (y/n): " proceed
        if [[ $proceed == [yY] ]]; then
            export_data
        else
            echo "Export cancelled."
        fi
    else
        echo ""
        echo "💡 Troubleshooting tips:"
        echo "- Check if MySQL service is running: sudo systemctl status mysql"
        echo "- Try connecting manually: mysql -u root -p"
        echo "- Check if user has privileges: GRANT ALL ON anime_kun.* TO 'root'@'localhost';"
    fi
}

# Run the main function
main