#!/usr/bin/env python3
"""
Compare table existence between WordPress MySQL and PostgreSQL
"""

import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

def get_mysql_tables():
    """Get all table names from WordPress MySQL"""
    logger.info("Getting MySQL table list...")
    
    result = execute_wordpress_mysql_command("SHOW TABLES;")
    tables = set()
    
    if result.returncode == 0:
        lines = result.stdout.strip().split('\n')[1:]  # Skip header
        for line in lines:
            if line.strip():
                tables.add(line.strip())
    
    logger.info(f"Found {len(tables)} tables in MySQL")
    return tables

def get_postgresql_tables():
    """Get all table names from PostgreSQL"""
    logger.info("Getting PostgreSQL table list...")
    
    result = execute_postgresql_command("SELECT tablename FROM pg_tables WHERE schemaname = 'public';")
    tables = set()
    
    if result.returncode == 0:
        lines = result.stdout.strip().split('\n')
        for line in lines[2:-1]:  # Skip header and footer
            line = line.strip()
            if line and line != '(0 rows)':
                tables.add(line)
    
    logger.info(f"Found {len(tables)} tables in PostgreSQL")
    return tables

def analyze_table_differences():
    """Compare tables between databases"""
    logger.info("Analyzing table differences...")
    
    mysql_tables = get_mysql_tables()
    pg_tables = get_postgresql_tables()
    
    # Tables only in MySQL
    mysql_only = mysql_tables - pg_tables
    
    # Tables only in PostgreSQL  
    pg_only = pg_tables - mysql_tables
    
    # Tables in both
    common_tables = mysql_tables & pg_tables
    
    print("\n" + "="*80)
    print("DATABASE TABLE COMPARISON ANALYSIS")
    print("="*80)
    
    print(f"\n📊 SUMMARY:")
    print(f"   MySQL tables: {len(mysql_tables)}")
    print(f"   PostgreSQL tables: {len(pg_tables)}")
    print(f"   Common tables: {len(common_tables)}")
    print(f"   MySQL-only tables: {len(mysql_only)}")
    print(f"   PostgreSQL-only tables: {len(pg_only)}")
    
    if mysql_only:
        print(f"\n🚨 TABLES MISSING IN POSTGRESQL ({len(mysql_only)} tables):")
        print("-" * 60)
        
        # Group by category
        ak_tables = [t for t in mysql_only if t.startswith('ak_')]
        smf_tables = [t for t in mysql_only if t.startswith('smf_')]
        collection_tables = [t for t in mysql_only if t.startswith('collection_')]
        wp_tables = [t for t in mysql_only if t.startswith('wp_')]
        other_tables = [t for t in mysql_only if not any(t.startswith(p) for p in ['ak_', 'smf_', 'collection_', 'wp_'])]
        
        if ak_tables:
            print(f"\n   AK System Tables ({len(ak_tables)}):")
            for table in sorted(ak_tables):
                print(f"      - {table}")
        
        if smf_tables:
            print(f"\n   SMF Forum Tables ({len(smf_tables)}):")
            for table in sorted(smf_tables):
                print(f"      - {table}")
        
        if collection_tables:
            print(f"\n   Collection Tables ({len(collection_tables)}):")
            for table in sorted(collection_tables):
                print(f"      - {table}")
        
        if wp_tables:
            print(f"\n   WordPress Tables ({len(wp_tables)}):")
            for table in sorted(wp_tables):
                print(f"      - {table}")
        
        if other_tables:
            print(f"\n   Other Tables ({len(other_tables)}):")
            for table in sorted(other_tables):
                print(f"      - {table}")
    
    if pg_only:
        print(f"\n✅ POSTGRESQL-ONLY TABLES ({len(pg_only)} tables):")
        print("-" * 60)
        for table in sorted(pg_only):
            print(f"      - {table}")
    
    print(f"\n🔄 COMMON TABLES ({len(common_tables)} tables):")
    print("-" * 60)
    
    # Show some examples of common tables
    common_list = sorted(list(common_tables))
    if len(common_list) > 10:
        print("   First 10 common tables:")
        for table in common_list[:10]:
            print(f"      - {table}")
        print(f"   ... and {len(common_list) - 10} more")
    else:
        for table in common_list:
            print(f"      - {table}")
    
    print("\n" + "="*80)
    
    # Save results to file
    with open('/home/zohardus/www/ak9project/missing_tables_analysis.txt', 'w') as f:
        f.write("DATABASE TABLE COMPARISON ANALYSIS\n")
        f.write("="*80 + "\n\n")
        f.write(f"MySQL tables: {len(mysql_tables)}\n")
        f.write(f"PostgreSQL tables: {len(pg_tables)}\n")
        f.write(f"Common tables: {len(common_tables)}\n")
        f.write(f"MySQL-only tables: {len(mysql_only)}\n")
        f.write(f"PostgreSQL-only tables: {len(pg_only)}\n\n")
        
        if mysql_only:
            f.write(f"TABLES MISSING IN POSTGRESQL ({len(mysql_only)} tables):\n")
            f.write("-" * 60 + "\n")
            for table in sorted(mysql_only):
                f.write(f"- {table}\n")
            f.write("\n")
        
        if pg_only:
            f.write(f"POSTGRESQL-ONLY TABLES ({len(pg_only)} tables):\n")
            f.write("-" * 60 + "\n")
            for table in sorted(pg_only):
                f.write(f"- {table}\n")
    
    logger.info("Analysis saved to missing_tables_analysis.txt")
    
    return mysql_only, pg_only, common_tables

if __name__ == "__main__":
    analyze_table_differences()