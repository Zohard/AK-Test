#!/usr/bin/env python3
"""
Migrate missing SMF topics from WordPress MySQL to PostgreSQL
"""

import subprocess
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BATCH_SIZE = 25

def execute_wordpress_mysql_command(query):
    """Execute MySQL command via docker exec on WordPress container"""
    cmd = [
        'docker', 'exec', 'wordpress-php56-docker-db-1',
        'mysql', '-u', 'root', '-proot_password', 'animekunnet',
        '-e', query
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result

def execute_postgresql_command(query):
    """Execute PostgreSQL command via docker exec"""
    cmd = [
        'docker', 'exec', 'anime-kun-postgres',
        'psql', '-U', 'anime_user', '-d', 'anime_kun',
        '-c', query
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result

def get_missing_topic_ids():
    """Get topic IDs that exist in MySQL but not in PostgreSQL"""
    logger.info("Finding missing topic IDs...")
    
    # Get all MySQL topic IDs
    mysql_result = execute_wordpress_mysql_command("SELECT id_topic FROM smf_topics ORDER BY id_topic;")
    mysql_ids = set()
    if mysql_result.returncode == 0:
        lines = mysql_result.stdout.strip().split('\n')[1:]  # Skip header
        for line in lines:
            if line.strip() and line.strip().isdigit():
                mysql_ids.add(int(line.strip()))
    
    # Get all PostgreSQL topic IDs
    pg_result = execute_postgresql_command("SELECT id_topic FROM smf_topics ORDER BY id_topic;")
    pg_ids = set()
    if pg_result.returncode == 0:
        lines = pg_result.stdout.strip().split('\n')
        for line in lines[2:-1]:  # Skip header and footer
            line = line.strip()
            if line and line.isdigit():
                pg_ids.add(int(line))
    
    missing_ids = mysql_ids - pg_ids
    logger.info(f"MySQL IDs: {len(mysql_ids)}, PostgreSQL IDs: {len(pg_ids)}, Missing: {len(missing_ids)}")
    
    return sorted(missing_ids)

def get_postgresql_table_structure():
    """Get PostgreSQL table structure to understand column names"""
    logger.info("Getting PostgreSQL table structure...")
    
    result = execute_postgresql_command("\\d smf_topics")
    if result.returncode == 0:
        logger.info("PostgreSQL table structure retrieved")
        return result.stdout
    else:
        logger.error(f"Failed to get table structure: {result.stderr}")
        return None

def migrate_topics_batch(topic_ids):
    """Migrate a batch of topics"""
    if not topic_ids:
        return 0
    
    successful_migrations = 0
    
    for topic_id in topic_ids:
        try:
            # Get topic data from MySQL
            query = f"""
            SELECT 
                id_topic, is_sticky, id_board, id_first_msg, id_last_msg,
                id_member_started, id_member_updated, id_poll, num_replies, 
                num_views, locked, unapproved_posts, approved, 
                id_previous_board, id_previous_topic
            FROM smf_topics 
            WHERE id_topic = {topic_id};
            """
            
            mysql_result = execute_wordpress_mysql_command(query)
            
            if mysql_result.returncode != 0:
                logger.error(f"Failed to get MySQL data for topic {topic_id}: {mysql_result.stderr}")
                continue
            
            lines = mysql_result.stdout.strip().split('\n')
            if len(lines) < 2:
                logger.warning(f"No data found for topic {topic_id}")
                continue
            
            # Parse the data (tab-separated)
            data = lines[1].split('\t')
            if len(data) < 15:
                logger.warning(f"Incomplete data for topic {topic_id}: {len(data)} fields")
                continue
            
            # Prepare INSERT statement with proper escaping
            # All fields are integers in this table
            values = []
            for value in data:
                if value == 'NULL' or value == '':
                    values.append('0')
                else:
                    values.append(str(value) if value.isdigit() or (value.startswith('-') and value[1:].isdigit()) else '0')
            
            # Insert into PostgreSQL
            insert_query = f"""
            INSERT INTO smf_topics (
                id_topic, is_sticky, id_board, id_first_msg, id_last_msg,
                id_member_started, id_member_updated, id_poll, num_replies, 
                num_views, locked, unapproved_posts, approved, 
                id_previous_board, id_previous_topic
            ) VALUES (
                {', '.join(values)}
            );
            """
            
            pg_result = execute_postgresql_command(insert_query)
            
            if pg_result.returncode == 0:
                successful_migrations += 1
                logger.debug(f"Successfully migrated topic {topic_id}")
            else:
                logger.error(f"Failed to insert topic {topic_id}: {pg_result.stderr}")
                
        except Exception as e:
            logger.error(f"Error processing topic {topic_id}: {e}")
    
    return successful_migrations

def main():
    """Main migration function"""
    logger.info("Starting SMF topics migration...")
    
    # Get PostgreSQL table structure
    structure = get_postgresql_table_structure()
    if not structure:
        logger.error("Cannot proceed without table structure")
        return False
    
    # Get missing topic IDs
    missing_topic_ids = get_missing_topic_ids()
    
    if not missing_topic_ids:
        logger.info("No missing topics found!")
        return True
    
    logger.info(f"Found {len(missing_topic_ids)} missing topics to migrate")
    
    # Process in batches
    total_processed = 0
    total_successful = 0
    
    for i in range(0, len(missing_topic_ids), BATCH_SIZE):
        batch = missing_topic_ids[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(missing_topic_ids) + BATCH_SIZE - 1) // BATCH_SIZE
        
        logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} topics)")
        
        successful = migrate_topics_batch(batch)
        total_processed += len(batch)
        total_successful += successful
        
        logger.info(f"Batch {batch_num} completed: {successful}/{len(batch)} successful")
        time.sleep(0.1)  # Small delay
    
    logger.info(f"Migration completed: {total_successful}/{total_processed} topics migrated")
    
    # Verify final counts
    mysql_result = execute_wordpress_mysql_command("SELECT COUNT(*) FROM smf_topics;")
    mysql_count = 0
    if mysql_result.returncode == 0:
        lines = mysql_result.stdout.strip().split('\n')
        if len(lines) > 1:
            mysql_count = int(lines[1].strip())
    
    pg_result = execute_postgresql_command("SELECT COUNT(*) FROM smf_topics;")
    pg_count = 0
    if pg_result.returncode == 0:
        lines = pg_result.stdout.strip().split('\n')
        if len(lines) > 2:
            pg_count = int(lines[2].strip())
    
    logger.info(f"Final counts - MySQL: {mysql_count}, PostgreSQL: {pg_count}")
    
    if mysql_count == pg_count:
        logger.info("✅ SMF topics migration successful - counts match!")
        return True
    else:
        logger.warning(f"⚠️ Migration incomplete - {mysql_count - pg_count} topics still missing")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 SMF Topics Migration Completed Successfully!")
    else:
        print("\n⚠️ SMF Topics Migration completed with some issues")