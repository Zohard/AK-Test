#!/usr/bin/env python3
"""
Screenshot migration script: WordPress MySQL to PostgreSQL
Migrates missing screenshot records from WordPress MySQL container to PostgreSQL
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
WORDPRESS_MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root', 
    'password': 'root_password',
    'database': 'animekunnet',
    'port': 3306
}

BATCH_SIZE = 50

def execute_postgresql_command(query):
    """Execute PostgreSQL command via docker exec"""
    cmd = [
        'docker', 'exec', 'anime-kun-postgres',
        'psql', '-U', 'anime_user', '-d', 'anime_kun',
        '-c', query
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result

def execute_wordpress_mysql_command(query):
    """Execute MySQL command via docker exec on WordPress container"""
    cmd = [
        'docker', 'exec', 'wordpress-php56-docker-db-1',
        'mysql', '-u', 'root', '-proot_password', 'animekunnet',
        '-e', query
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result

def get_missing_screenshot_ids():
    """Get screenshot IDs that exist in WordPress MySQL but not in PostgreSQL"""
    logger.info("Finding missing screenshot IDs...")
    
    # Get all WordPress MySQL IDs
    wp_result = execute_wordpress_mysql_command("SELECT id_screen FROM ak_screenshots ORDER BY id_screen;")
    wp_ids = set()
    if wp_result.returncode == 0:
        lines = wp_result.stdout.strip().split('\n')[1:]  # Skip header
        for line in lines:
            if line.strip().isdigit():
                wp_ids.add(int(line.strip()))
    
    # Get all PostgreSQL IDs
    pg_result = execute_postgresql_command("SELECT id_screen FROM ak_screenshots ORDER BY id_screen;")
    pg_ids = set()
    if pg_result.returncode == 0:
        lines = pg_result.stdout.strip().split('\n')
        for line in lines[2:-1]:  # Skip header and footer
            line = line.strip()
            if line and line.isdigit():
                pg_ids.add(int(line))
    
    missing_ids = wp_ids - pg_ids
    logger.info(f"WordPress MySQL IDs: {len(wp_ids)}, PostgreSQL IDs: {len(pg_ids)}, Missing: {len(missing_ids)}")
    
    return sorted(missing_ids)

def migrate_screenshots_batch(ids_batch):
    """Migrate a batch of screenshot records"""
    if not ids_batch:
        return 0
        
    # Get records for this batch from WordPress MySQL
    placeholders = ','.join(str(id) for id in ids_batch)
    query = f"SELECT id_screen, url_screen, id_titre, type FROM ak_screenshots WHERE id_screen IN ({placeholders});"
    
    wp_result = execute_wordpress_mysql_command(query)
    if wp_result.returncode != 0:
        logger.error(f"Failed to fetch WordPress MySQL data: {wp_result.stderr}")
        return 0
    
    # Parse the result
    lines = wp_result.stdout.strip().split('\n')[1:]  # Skip header
    successful_inserts = 0
    
    for line in lines:
        if not line.strip():
            continue
            
        try:
            parts = line.split('\t')
            if len(parts) != 4:
                logger.warning(f"Invalid data format: {line}")
                continue
                
            id_screen, url_screen, id_titre, type_val = parts
            
            # Handle NULL values and prepare data
            if url_screen == 'NULL':
                url_screen = 'NULL'
            else:
                # Add screenshots/ prefix if not present and escape quotes
                if not url_screen.startswith('screenshots/'):
                    url_screen = f"screenshots/{url_screen}"
                url_screen = f"'{url_screen.replace(chr(39), chr(39)+chr(39))}'"
            
            if id_titre == 'NULL':
                id_titre = 'NULL'
            if type_val == 'NULL':
                type_val = '1'  # Default type
            
            # Insert into PostgreSQL with upload_date
            insert_query = f"""
            INSERT INTO ak_screenshots (id_screen, url_screen, id_titre, type, upload_date)
            VALUES ({id_screen}, {url_screen}, {id_titre}, {type_val}, CURRENT_TIMESTAMP);
            """
            
            result = execute_postgresql_command(insert_query)
            if result.returncode == 0:
                successful_inserts += 1
            else:
                logger.warning(f"Failed to insert screenshot ID {id_screen}: {result.stderr}")
                
        except Exception as e:
            logger.error(f"Error processing screenshot record: {e}")
    
    return successful_inserts

def main():
    """Main migration function"""
    logger.info("Starting screenshot migration from WordPress MySQL to PostgreSQL...")
    
    # Get missing IDs
    missing_ids = get_missing_screenshot_ids()
    
    if not missing_ids:
        logger.info("No missing screenshot records found!")
        return
    
    logger.info(f"Found {len(missing_ids)} missing screenshot records to migrate")
    
    # Process in batches
    total_processed = 0
    total_successful = 0
    
    for i in range(0, len(missing_ids), BATCH_SIZE):
        batch = missing_ids[i:i + BATCH_SIZE]
        batch_num = i//BATCH_SIZE + 1
        total_batches = (len(missing_ids) + BATCH_SIZE - 1)//BATCH_SIZE
        
        logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} records)")
        
        successful = migrate_screenshots_batch(batch)
        total_processed += len(batch)
        total_successful += successful
        
        logger.info(f"Batch completed: {successful}/{len(batch)} successful")
        time.sleep(0.1)  # Small delay to avoid overwhelming the database
    
    logger.info(f"Screenshot migration completed: {total_successful}/{total_processed} records migrated successfully")
    
    # Verify final counts
    wp_result = execute_wordpress_mysql_command("SELECT COUNT(*) FROM ak_screenshots;")
    wp_count = 0
    if wp_result.returncode == 0:
        lines = wp_result.stdout.strip().split('\n')
        if len(lines) > 1:
            wp_count = int(lines[1].strip())
    
    pg_result = execute_postgresql_command("SELECT COUNT(*) FROM ak_screenshots;")
    pg_count = 0
    if pg_result.returncode == 0:
        lines = pg_result.stdout.strip().split('\n')
        if len(lines) > 2:
            pg_count = int(lines[2].strip())
    
    logger.info(f"Final counts - WordPress MySQL: {wp_count}, PostgreSQL: {pg_count}")
    
    if wp_count == pg_count:
        logger.info("✅ Screenshot migration successful - counts match!")
    else:
        logger.warning(f"⚠️ Screenshot migration incomplete - missing {wp_count - pg_count} records")

if __name__ == "__main__":
    main()