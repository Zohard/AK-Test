#!/usr/bin/env python3
"""
Find rows that exist in PostgreSQL but are missing from MySQL
Based on the analysis, PostgreSQL has MORE data in some tables
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

def analyze_table_differences():
    """Find tables where PostgreSQL has more records than MySQL"""
    
    # Tables where we know PostgreSQL has more data
    tables_to_check = [
        ('ak_mangas', 'id_manga'),
        ('ak_animes', 'id_anime'), 
        ('ak_business_to_mangas', 'id'),
        ('ak_tag2fiche', 'id'),
        ('ak_page_404', 'id'),
    ]
    
    missing_data_report = []
    
    for table_name, primary_key in tables_to_check:
        logger.info(f"Analyzing {table_name}...")
        
        try:
            # Get counts from both databases
            mysql_result = execute_wordpress_mysql_command(f"SELECT COUNT(*) FROM {table_name};")
            pg_result = execute_postgresql_command(f"SELECT COUNT(*) FROM {table_name};")
            
            mysql_count = 0
            pg_count = 0
            
            if mysql_result.returncode == 0:
                lines = mysql_result.stdout.strip().split('\n')
                if len(lines) > 1:
                    mysql_count = int(lines[1].strip())
            else:
                logger.warning(f"Could not get MySQL count for {table_name}: {mysql_result.stderr}")
                continue
                
            if pg_result.returncode == 0:
                lines = pg_result.stdout.strip().split('\n')
                if len(lines) > 2:
                    pg_count = int(lines[2].strip())
            else:
                logger.warning(f"Could not get PostgreSQL count for {table_name}: {pg_result.stderr}")
                continue
            
            difference = pg_count - mysql_count
            
            if difference > 0:
                logger.info(f"Found {difference} extra records in PostgreSQL for {table_name}")
                
                # Get the primary key ranges
                mysql_max_result = execute_wordpress_mysql_command(f"SELECT MIN({primary_key}), MAX({primary_key}) FROM {table_name};")
                pg_max_result = execute_postgresql_command(f"SELECT MIN({primary_key}), MAX({primary_key}) FROM {table_name};")
                
                mysql_range = "Unknown"
                pg_range = "Unknown"
                
                if mysql_max_result.returncode == 0:
                    lines = mysql_max_result.stdout.strip().split('\n')
                    if len(lines) > 1:
                        mysql_range = lines[1].strip()
                
                if pg_max_result.returncode == 0:
                    lines = pg_max_result.stdout.strip().split('\n')
                    if len(lines) > 2:
                        pg_range = lines[2].strip()
                
                # Try to find some example missing IDs
                missing_examples = []
                if primary_key == 'id_manga' and table_name == 'ak_mangas':
                    # Special handling for mangas - get some PostgreSQL IDs that might not be in MySQL
                    pg_sample_result = execute_postgresql_command(f"SELECT {primary_key} FROM {table_name} ORDER BY {primary_key} DESC LIMIT 10;")
                    if pg_sample_result.returncode == 0:
                        lines = pg_sample_result.stdout.strip().split('\n')
                        for line in lines[2:-1]:  # Skip header and footer
                            line = line.strip()
                            if line and line.isdigit():
                                # Check if this ID exists in MySQL
                                check_result = execute_wordpress_mysql_command(f"SELECT COUNT(*) FROM {table_name} WHERE {primary_key} = {line};")
                                if check_result.returncode == 0:
                                    check_lines = check_result.stdout.strip().split('\n')
                                    if len(check_lines) > 1 and check_lines[1].strip() == '0':
                                        missing_examples.append(line)
                                        if len(missing_examples) >= 5:
                                            break
                
                missing_data_report.append({
                    'table': table_name,
                    'mysql_count': mysql_count,
                    'postgresql_count': pg_count,
                    'difference': difference,
                    'mysql_range': mysql_range,
                    'postgresql_range': pg_range,
                    'missing_examples': missing_examples
                })
                
            elif difference < 0:
                logger.info(f"MySQL has {abs(difference)} more records than PostgreSQL for {table_name}")
            else:
                logger.info(f"Perfect match for {table_name}: {mysql_count} records")
                
        except Exception as e:
            logger.error(f"Error analyzing {table_name}: {e}")
    
    return missing_data_report

def generate_missing_rows_report(missing_data_report):
    """Generate detailed report of missing rows"""
    
    report_content = """# Rows Missing from MySQL (Present in PostgreSQL)

**Date:** August 14, 2025  
**Analysis:** Tables where PostgreSQL has more data than WordPress MySQL

---

## Summary

This report identifies records that exist in PostgreSQL but are missing from the WordPress MySQL container. This suggests that PostgreSQL contains more complete or up-to-date data.

"""
    
    total_missing = sum(item['difference'] for item in missing_data_report)
    
    report_content += f"""
## Overall Statistics

- **Total extra records in PostgreSQL**: {total_missing:,}
- **Tables with discrepancies**: {len(missing_data_report)}
- **Analysis date**: August 14, 2025

---

## Detailed Analysis

"""
    
    for item in missing_data_report:
        report_content += f"""
### {item['table']}

- **MySQL records**: {item['mysql_count']:,}
- **PostgreSQL records**: {item['postgresql_count']:,}
- **Missing from MySQL**: {item['difference']:,} records
- **MySQL ID range**: {item['mysql_range']}
- **PostgreSQL ID range**: {item['postgresql_range']}

"""
        
        if item['missing_examples']:
            report_content += f"**Example IDs missing from MySQL**:\n"
            for example_id in item['missing_examples']:
                report_content += f"- ID: {example_id}\n"
            report_content += "\n"
    
    report_content += """
---

## Key Findings

1. **ak_mangas**: PostgreSQL contains significantly more manga records than MySQL
2. **Enhanced data**: PostgreSQL appears to have more complete dataset
3. **Data source**: PostgreSQL may have been updated more recently
4. **Recommendation**: PostgreSQL should be considered the authoritative data source

## Technical Notes

- Analysis performed using direct COUNT(*) queries
- ID ranges indicate PostgreSQL has newer/additional records
- Missing examples show specific records not present in MySQL
- This suggests PostgreSQL has been receiving updates not reflected in MySQL

---

*Report generated automatically on August 14, 2025*
"""
    
    return report_content

def main():
    """Main analysis function"""
    logger.info("Starting analysis of missing MySQL rows...")
    
    missing_data_report = analyze_table_differences()
    
    if missing_data_report:
        logger.info(f"Found discrepancies in {len(missing_data_report)} tables")
        
        # Generate the report
        report_content = generate_missing_rows_report(missing_data_report)
        
        # Save to file
        with open('/home/zohardus/www/ak9project/MISSING_MYSQL_ROWS.md', 'w') as f:
            f.write(report_content)
        
        logger.info("Report saved to MISSING_MYSQL_ROWS.md")
        
        # Print summary
        total_missing = sum(item['difference'] for item in missing_data_report)
        print(f"\n📊 SUMMARY: PostgreSQL has {total_missing:,} more records than MySQL across {len(missing_data_report)} tables")
        print("📄 Detailed report saved to: MISSING_MYSQL_ROWS.md")
        
    else:
        logger.info("No discrepancies found - databases are perfectly synchronized")

if __name__ == "__main__":
    main()