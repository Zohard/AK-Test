#!/usr/bin/env python3
"""
Batch migration script to sync MySQL data to PostgreSQL efficiently
"""

import mysql.connector
import subprocess
import sys
import logging
import time

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

BATCH_SIZE = 100

def execute_postgresql_command(query):
    """Execute PostgreSQL command via docker exec"""
    cmd = [
        'docker', 'exec', 'anime-kun-postgres',
        'psql', '-U', 'anime_user', '-d', 'anime_kun',
        '-c', query
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result

def get_missing_ids():
    """Get IDs that exist in MySQL but not in PostgreSQL"""
    logger.info("Finding missing manga IDs...")
    
    # Get all MySQL IDs
    mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
    mysql_cursor = mysql_conn.cursor()
    mysql_cursor.execute("SELECT id_manga FROM ak_mangas ORDER BY id_manga")
    mysql_ids = set(row[0] for row in mysql_cursor.fetchall())
    mysql_cursor.close()
    mysql_conn.close()
    
    # Get all PostgreSQL IDs
    pg_result = execute_postgresql_command("SELECT id_manga FROM ak_mangas;")
    pg_ids = set()
    if pg_result.returncode == 0:
        lines = pg_result.stdout.strip().split('\n')
        for line in lines[2:-1]:  # Skip header and footer
            line = line.strip()
            if line and line != '(0 rows)' and line.isdigit():
                pg_ids.add(int(line))
    
    missing_ids = mysql_ids - pg_ids
    logger.info(f"MySQL IDs: {len(mysql_ids)}, PostgreSQL IDs: {len(pg_ids)}, Missing: {len(missing_ids)}")
    
    return sorted(missing_ids)

def migrate_batch(ids_batch):
    """Migrate a batch of manga records"""
    if not ids_batch:
        return 0
        
    mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
    mysql_cursor = mysql_conn.cursor(dictionary=True)
    
    # Get records for this batch
    placeholders = ','.join(['%s'] * len(ids_batch))
    query = f"SELECT * FROM ak_mangas WHERE id_manga IN ({placeholders})"
    mysql_cursor.execute(query, ids_batch)
    records = mysql_cursor.fetchall()
    
    successful_inserts = 0
    
    for record in records:
        try:
            # Prepare INSERT statement
            columns = []
            values = []
            
            for key, value in record.items():
                columns.append(key.lower())
                if value is None:
                    values.append('NULL')
                elif isinstance(value, str):
                    # Escape single quotes and handle special characters
                    escaped_value = value.replace("'", "''").replace('\\', '\\\\')
                    values.append(f"'{escaped_value}'")
                elif isinstance(value, (int, float)):
                    values.append(str(value))
                else:
                    values.append(f"'{str(value)}'")
            
            column_list = ', '.join(columns)
            value_list = ', '.join(values)
            
            insert_query = f"INSERT INTO ak_mangas ({column_list}) VALUES ({value_list});"
            
            result = execute_postgresql_command(insert_query)
            if result.returncode == 0:
                successful_inserts += 1
            else:
                logger.warning(f"Failed to insert ID {record['id_manga']}: {result.stderr}")
                
        except Exception as e:
            logger.error(f"Error processing record {record.get('id_manga', 'unknown')}: {e}")
    
    mysql_cursor.close()
    mysql_conn.close()
    
    return successful_inserts

def main():
    """Main migration function"""
    logger.info("Starting batch migration...")
    
    # Get missing IDs
    missing_ids = get_missing_ids()
    
    if not missing_ids:
        logger.info("No missing records found!")
        return
    
    logger.info(f"Found {len(missing_ids)} missing records to migrate")
    
    # Process in batches
    total_processed = 0
    total_successful = 0
    
    for i in range(0, len(missing_ids), BATCH_SIZE):
        batch = missing_ids[i:i + BATCH_SIZE]
        logger.info(f"Processing batch {i//BATCH_SIZE + 1}/{(len(missing_ids) + BATCH_SIZE - 1)//BATCH_SIZE} ({len(batch)} records)")
        
        successful = migrate_batch(batch)
        total_processed += len(batch)
        total_successful += successful
        
        logger.info(f"Batch completed: {successful}/{len(batch)} successful")
        time.sleep(0.1)  # Small delay to avoid overwhelming the database
    
    logger.info(f"Migration completed: {total_successful}/{total_processed} records migrated successfully")
    
    # Verify final counts
    mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
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
        pg_count = 0
    
    logger.info(f"Final counts - MySQL: {mysql_count}, PostgreSQL: {pg_count}")
    
    if mysql_count == pg_count:
        logger.info("✅ Migration successful - counts match!")
    else:
        logger.warning(f"⚠️ Migration incomplete - missing {mysql_count - pg_count} records")

if __name__ == "__main__":
    main()