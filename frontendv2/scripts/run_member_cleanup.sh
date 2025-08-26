#!/bin/bash

# ===============================================
# ANIME-KUN MEMBER CLEANUP EXECUTION SCRIPT
# ===============================================

# Configuration
DB_HOST="localhost"
DB_NAME="anime_kun"
DB_USER="anime_user"
DB_PASS="anime_password"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}    ANIME-KUN INACTIVE MEMBER CLEANUP${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Check if analysis should be run first
if [ "$1" != "--execute" ]; then
    echo -e "${YELLOW}ANALYSIS MODE${NC}"
    echo -e "${YELLOW}Running analysis script first...${NC}"
    echo ""
    
    export PGPASSWORD=$DB_PASS
    psql -U $DB_USER -d $DB_NAME -h $DB_HOST -f analyze_inactive_members.sql
    
    echo ""
    echo -e "${YELLOW}=============================================${NC}"
    echo -e "${YELLOW}ANALYSIS COMPLETE${NC}"
    echo -e "${YELLOW}=============================================${NC}"
    echo ""
    echo -e "Review the analysis results above."
    echo -e "If you're satisfied with the numbers, run:"
    echo -e "${GREEN}./run_member_cleanup.sh --execute${NC}"
    echo ""
    echo -e "${RED}⚠️  WARNING: The --execute flag will perform actual deletions!${NC}"
    echo ""
    exit 0
fi

# Execution mode
echo -e "${RED}EXECUTION MODE${NC}"
echo -e "${RED}⚠️  This will delete inactive member accounts!${NC}"
echo ""

# Final confirmation
read -p "Are you absolutely sure you want to proceed? Type 'DELETE_MEMBERS' to confirm: " confirmation

if [ "$confirmation" != "DELETE_MEMBERS" ]; then
    echo -e "${YELLOW}Operation cancelled.${NC}"
    exit 1
fi

echo ""
echo -e "${RED}Proceeding with member cleanup...${NC}"
echo ""

# Create backup directory with timestamp
BACKUP_DIR="member_cleanup_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}Creating database backup...${NC}"
export PGPASSWORD=$DB_PASS
pg_dump -U $DB_USER -d $DB_NAME -h $DB_HOST -t smf_members -t collection_animes -t collection_mangas > "$BACKUP_DIR/members_backup.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database backup created: $BACKUP_DIR/members_backup.sql${NC}"
else
    echo -e "${RED}✗ Backup failed! Aborting cleanup.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Executing cleanup script...${NC}"

# Run the cleanup script  
psql -U $DB_USER -d $DB_NAME -h $DB_HOST -f cleanup_inactive_members.sql > "$BACKUP_DIR/cleanup_log.txt" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Cleanup script executed${NC}"
    echo -e "${BLUE}Log saved to: $BACKUP_DIR/cleanup_log.txt${NC}"
else
    echo -e "${RED}✗ Cleanup script failed!${NC}"
    echo -e "${YELLOW}Check log: $BACKUP_DIR/cleanup_log.txt${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}CLEANUP COMPLETED${NC}"
echo -e "${GREEN}===============================================${NC}"
echo ""
echo -e "📁 Backup files saved in: ${BLUE}$BACKUP_DIR/${NC}"
echo -e "📋 Review the cleanup log: ${BLUE}$BACKUP_DIR/cleanup_log.txt${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Review the cleanup results"
echo -e "2. Monitor the application for any issues"  
echo -e "3. If everything works well, the backup can be archived"
echo -e "4. Consider running VACUUM ANALYZE on the database"
echo ""