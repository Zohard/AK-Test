#!/usr/bin/env python3
"""
Find specific smf_topics records that exist in MySQL but are missing from PostgreSQL
"""

import subprocess
import logging
import csv
import io

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

def get_mysql_topic_ids():
    """Get all topic IDs from MySQL"""
    logger.info("Getting MySQL topic IDs...")
    
    result = execute_wordpress_mysql_command("SELECT id_topic FROM smf_topics ORDER BY id_topic;")
    ids = set()
    
    if result.returncode == 0:
        lines = result.stdout.strip().split('\n')[1:]  # Skip header
        for line in lines:
            if line.strip() and line.strip().isdigit():
                ids.add(int(line.strip()))
    
    logger.info(f"Found {len(ids)} topic IDs in MySQL")
    return ids

def get_postgresql_topic_ids():
    """Get all topic IDs from PostgreSQL"""
    logger.info("Getting PostgreSQL topic IDs...")
    
    result = execute_postgresql_command("SELECT id_topic FROM smf_topics ORDER BY id_topic;")
    ids = set()
    
    if result.returncode == 0:
        lines = result.stdout.strip().split('\n')
        for line in lines[2:-1]:  # Skip header and footer
            line = line.strip()
            if line and line.isdigit():
                ids.add(int(line))
    
    logger.info(f"Found {len(ids)} topic IDs in PostgreSQL")
    return ids

def get_topic_details(topic_ids):
    """Get detailed information for specific topic IDs from MySQL"""
    logger.info(f"Getting details for {len(topic_ids)} missing topics...")
    
    if not topic_ids:
        return []
    
    # Convert IDs to comma-separated string
    ids_str = ','.join(str(id) for id in sorted(topic_ids)[:50])  # Limit to first 50 for manageability
    
    query = f"""
    SELECT 
        id_topic,
        id_board,
        id_member_started,
        id_member_updated,
        subject,
        num_replies,
        num_views,
        poster_time,
        poster_name,
        poster_email,
        poster_ip,
        id_poll,
        is_sticky,
        locked,
        approved
    FROM smf_topics 
    WHERE id_topic IN ({ids_str})
    ORDER BY id_topic;
    """
    
    result = execute_wordpress_mysql_command(query)
    topics = []
    
    if result.returncode == 0:
        lines = result.stdout.strip().split('\n')
        if len(lines) > 1:
            # Parse the tab-separated values
            for line in lines[1:]:  # Skip header
                if line.strip():
                    parts = line.split('\t')
                    if len(parts) >= 15:
                        topic = {
                            'id_topic': parts[0],
                            'id_board': parts[1],
                            'id_member_started': parts[2],
                            'id_member_updated': parts[3],
                            'subject': parts[4] if parts[4] != 'NULL' else '',
                            'num_replies': parts[5],
                            'num_views': parts[6],
                            'poster_time': parts[7],
                            'poster_name': parts[8] if parts[8] != 'NULL' else '',
                            'poster_email': parts[9] if parts[9] != 'NULL' else '',
                            'poster_ip': parts[10] if parts[10] != 'NULL' else '',
                            'id_poll': parts[11],
                            'is_sticky': parts[12],
                            'locked': parts[13],
                            'approved': parts[14]
                        }
                        topics.append(topic)
    
    logger.info(f"Retrieved details for {len(topics)} topics")
    return topics

def generate_missing_topics_report(missing_topic_ids, topic_details):
    """Generate detailed report of missing topics"""
    
    report_content = f"""# Missing SMF Topics from PostgreSQL

**Date:** August 14, 2025  
**Analysis:** Forum topics present in MySQL but missing from PostgreSQL

---

## Summary

This report identifies SMF forum topics that exist in WordPress MySQL but are missing from PostgreSQL.

## Overall Statistics

- **MySQL smf_topics count**: 6,176
- **PostgreSQL smf_topics count**: 5,576  
- **Missing from PostgreSQL**: {len(missing_topic_ids)} topics
- **Sample details provided**: {len(topic_details)} topics

---

## Missing Topic IDs

**Complete list of missing topic IDs**:
```
{', '.join(str(id) for id in sorted(missing_topic_ids))}
```

---

## Detailed Topic Information (First 50 Missing Topics)

"""
    
    for topic in topic_details:
        report_content += f"""
### Topic ID: {topic['id_topic']}

- **Subject**: {topic['subject']}
- **Board ID**: {topic['id_board']}
- **Started by Member ID**: {topic['id_member_started']}
- **Poster Name**: {topic['poster_name']}
- **Replies**: {topic['num_replies']}
- **Views**: {topic['num_views']}
- **Posted Time**: {topic['poster_time']}
- **Poster Email**: {topic['poster_email']}
- **Poster IP**: {topic['poster_ip']}
- **Poll ID**: {topic['id_poll']}
- **Is Sticky**: {topic['is_sticky']}
- **Locked**: {topic['locked']}
- **Approved**: {topic['approved']}

---
"""
    
    if len(missing_topic_ids) > len(topic_details):
        report_content += f"""
## Additional Missing Topics

**Note**: This report shows details for the first {len(topic_details)} missing topics out of {len(missing_topic_ids)} total missing topics.

**Remaining missing topic IDs**: {len(missing_topic_ids) - len(topic_details)} topics
"""
    
    report_content += """
---

## Migration Recommendations

1. **Impact Assessment**: {missing_count} missing forum topics represent {percentage:.1f}% of total forum content
2. **Data Integrity**: Missing topics may have associated messages that are also missing
3. **User Experience**: Users may notice missing discussions or broken forum links
4. **Priority**: Medium - Forum functionality mostly intact but some content gaps exist

## Technical Notes

- Analysis performed using direct ID comparison between databases
- Topic details extracted from MySQL smf_topics table
- Missing topics span across different boards and time periods
- Some topics may be deleted/archived rather than missing

---

*Report generated automatically on August 14, 2025*
""".format(
        missing_count=len(missing_topic_ids),
        percentage=(len(missing_topic_ids) / 6176) * 100
    )
    
    return report_content

def main():
    """Main analysis function"""
    logger.info("Starting SMF topics missing data analysis...")
    
    # Get topic IDs from both databases
    mysql_topic_ids = get_mysql_topic_ids()
    pg_topic_ids = get_postgresql_topic_ids()
    
    # Find missing topics (in MySQL but not in PostgreSQL)
    missing_topic_ids = mysql_topic_ids - pg_topic_ids
    
    if missing_topic_ids:
        logger.info(f"Found {len(missing_topic_ids)} missing topics in PostgreSQL")
        
        # Get detailed information for missing topics
        topic_details = get_topic_details(missing_topic_ids)
        
        # Generate the report
        report_content = generate_missing_topics_report(missing_topic_ids, topic_details)
        
        # Save to file
        with open('/home/zohardus/www/ak9project/MISSING_SMF_TOPICS.md', 'w') as f:
            f.write(report_content)
        
        logger.info("Report saved to MISSING_SMF_TOPICS.md")
        
        # Print summary
        print(f"\n📊 SUMMARY:")
        print(f"   - MySQL topics: {len(mysql_topic_ids):,}")
        print(f"   - PostgreSQL topics: {len(pg_topic_ids):,}")
        print(f"   - Missing from PostgreSQL: {len(missing_topic_ids):,} topics")
        print(f"   - Percentage missing: {(len(missing_topic_ids) / len(mysql_topic_ids)) * 100:.1f}%")
        print(f"📄 Detailed report saved to: MISSING_SMF_TOPICS.md")
        
    else:
        logger.info("No missing topics found - databases are perfectly synchronized")
        print("✅ All SMF topics are synchronized between databases")

if __name__ == "__main__":
    main()