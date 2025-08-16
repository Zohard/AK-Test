#!/usr/bin/env python3
"""
Migration script to sync MySQL data to PostgreSQL
- Migrates missing records from MySQL to PostgreSQL
- Updates existing records in PostgreSQL with MySQL data where IDs match
"""

import mysql.connector
import psycopg2
import psycopg2.extras
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configurations
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'animekunnet',
    'password': 'animekun77',
    'database': 'animekunnet',
    'charset': 'utf8mb4'
}

POSTGRESQL_CONFIG = {
    'host': 'localhost',
    'user': 'anime_user',
    'password': 'anime_password',
    'database': 'anime_kun',
    'port': 5432
}

def get_mysql_connection():
    """Get MySQL connection"""
    return mysql.connector.connect(**MYSQL_CONFIG)

def get_postgresql_connection():
    """Get PostgreSQL connection via Docker container"""
    import subprocess
    return psycopg2.connect(
        host='localhost',
        user='anime_user',
        password='anime_password',
        database='anime_kun',
        port=5432
    )

def execute_postgresql_command(query, params=None):
    """Execute PostgreSQL command via docker exec"""
    import subprocess
    import json
    
    if params:
        # Escape single quotes in parameters
        escaped_params = []
        for param in params:
            if isinstance(param, str):
                escaped_params.append(param.replace("'", "''"))
            else:
                escaped_params.append(str(param))
        
        formatted_query = query % tuple(escaped_params)
    else:
        formatted_query = query
    
    cmd = [
        'docker', 'exec', 'anime-kun-postgres',
        'psql', '-U', 'anime_user', '-d', 'anime_kun',
        '-c', formatted_query
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result

def migrate_ak_mangas():
    """Migrate ak_mangas table from MySQL to PostgreSQL"""
    logger.info("Starting ak_mangas migration...")
    
    try:
        # Get MySQL connection
        mysql_conn = get_mysql_connection()
        mysql_cursor = mysql_conn.cursor(dictionary=True)
        
        # Get all manga records from MySQL
        mysql_cursor.execute("SELECT * FROM ak_mangas ORDER BY id_manga")
        mysql_records = mysql_cursor.fetchall()
        logger.info(f"Found {len(mysql_records)} records in MySQL ak_mangas")
        
        # Get existing IDs from PostgreSQL
        pg_result = execute_postgresql_command("SELECT id_manga FROM ak_mangas;")
        existing_ids = set()
        if pg_result.returncode == 0:
            lines = pg_result.stdout.strip().split('\n')
            for line in lines[2:-1]:  # Skip header and footer
                line = line.strip()
                if line and line.isdigit():
                    existing_ids.add(int(line))
        
        logger.info(f"Found {len(existing_ids)} existing records in PostgreSQL ak_mangas")
        
        # Process each record
        inserted_count = 0
        updated_count = 0
        
        for record in mysql_records:
            record_id = record['id_manga']
            
            # Prepare values, handling None/NULL values
            values = []
            columns = []
            for key, value in record.items():
                # Convert column names to lowercase for PostgreSQL
                pg_column = key.lower()
                if pg_column == 'label':  # Handle case difference
                    pg_column = 'label'
                elif pg_column == 'moyennenotes':  # Handle case difference
                    pg_column = 'moyennenotes'
                    
                columns.append(pg_column)
                if value is None:
                    values.append('NULL')
                elif isinstance(value, str):
                    # Escape single quotes
                    escaped_value = value.replace("'", "''")
                    values.append(f"'{escaped_value}'")
                else:
                    values.append(str(value))
            
            column_list = ', '.join(columns)
            value_list = ', '.join(values)
            
            if record_id in existing_ids:
                # Update existing record
                update_pairs = []
                for i, col in enumerate(columns):
                    if col != 'id_manga':  # Don't update the ID
                        update_pairs.append(f"{col} = {values[i]}")
                
                update_query = f"""
                UPDATE ak_mangas 
                SET {', '.join(update_pairs)}
                WHERE id_manga = {record_id};
                """
                
                result = execute_postgresql_command(update_query)
                if result.returncode == 0:
                    updated_count += 1
                else:
                    logger.error(f"Failed to update record {record_id}: {result.stderr}")
            else:
                # Insert new record
                insert_query = f"""
                INSERT INTO ak_mangas ({column_list})
                VALUES ({value_list});
                """
                
                result = execute_postgresql_command(insert_query)
                if result.returncode == 0:
                    inserted_count += 1
                else:
                    logger.error(f"Failed to insert record {record_id}: {result.stderr}")
        
        logger.info(f"Migration completed: {inserted_count} inserted, {updated_count} updated")
        
        mysql_cursor.close()
        mysql_conn.close()
        
        return True
        
    except Exception as e:
        logger.error(f"Error during migration: {e}")
        return False

def verify_migration():
    """Verify the migration was successful"""
    logger.info("Verifying migration...")
    
    # Count records in both databases
    mysql_conn = get_mysql_connection()
    mysql_cursor = mysql_conn.cursor()
    mysql_cursor.execute("SELECT COUNT(*) FROM ak_mangas")
    mysql_count = mysql_cursor.fetchone()[0]
    mysql_cursor.close()
    mysql_conn.close()
    
    pg_result = execute_postgresql_command("SELECT COUNT(*) FROM ak_mangas;")
    if pg_result.returncode == 0:
        lines = pg_result.stdout.strip().split('\n')
        pg_count = int(lines[2].strip())
    else:
        logger.error("Failed to get PostgreSQL count")
        return False
    
    logger.info(f"MySQL count: {mysql_count}, PostgreSQL count: {pg_count}")
    
    if mysql_count == pg_count:
        logger.info("✅ Migration verification successful - counts match!")
        return True
    else:
        logger.warning("⚠️ Migration verification failed - counts don't match")
        return False

def main():
    """Main migration function"""
    logger.info("Starting MySQL to PostgreSQL migration...")
    
    # Migrate ak_mangas table
    if migrate_ak_mangas():
        logger.info("✅ ak_mangas migration completed successfully")
    else:
        logger.error("❌ ak_mangas migration failed")
        sys.exit(1)
    
    # Verify migration
    if verify_migration():
        logger.info("✅ All migrations completed and verified successfully!")
    else:
        logger.warning("⚠️ Migration completed but verification failed")

if __name__ == "__main__":
    main()