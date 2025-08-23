# 🔄 WordPress to PostgreSQL Migration Guide

## Overview

This guide will help you migrate your WordPress content from the MySQL database to your PostgreSQL Anime-Kun database, enabling the articles system in your frontend.

---

## 📋 Prerequisites

### 1. **Database Access**
- ✅ **MySQL Database**: `animekunnet` (WordPress)
- ✅ **PostgreSQL Database**: `anime_kun` (Anime-Kun)
- ✅ Both databases running and accessible

### 2. **Node.js Dependencies**
```bash
npm install mysql2 pg --save
```

### 3. **Database Schema Verification**
Ensure your PostgreSQL database has the required tables:
- `ak_membres` (users)
- `ak_webzine` (articles)
- `ak_webzine_categories` (categories)
- `ak_webzine_comments` (comments)
- `ak_webzine_to_categories` (article-category relationships)

---

## 🚀 Migration Steps

### **Step 1: Test Database Connections**

First, verify both databases are accessible:

```bash
node test-connections.js
```

This will:
- ✅ Test MySQL connection to WordPress database
- ✅ Test PostgreSQL connection to Anime-Kun database
- 📊 Show data samples from both databases
- 🔧 Provide troubleshooting info if connections fail

### **Step 2: Backup Your Data**

**CRITICAL**: Always backup before migration!

```bash
# Backup PostgreSQL database
pg_dump -h localhost -U anime_user anime_kun > backup-before-migration.sql

# Backup MySQL database (optional)
mysqldump -h localhost -u animekunnet -p animekunnet > backup-wordpress.sql
```

### **Step 3: Run the Migration**

Execute the migration script:

```bash
node migrate-wordpress-data.js
```

The migration will process:
1. **Users**: `wp_users` → `ak_membres`
2. **Categories**: `wp_terms` → `ak_webzine_categories` 
3. **Posts**: `wp_posts` → `ak_webzine`
4. **Comments**: `wp_comments` → `ak_webzine_comments`
5. **Meta Data**: Post thumbnails and additional fields

### **Step 4: Review Migration Results**

Check the generated files:
- `migration-log.txt` - Detailed migration log
- `migration-report.json` - Migration summary report

---

## 📊 Data Mapping

### WordPress → Anime-Kun Schema Mapping

| **WordPress** | **Field** | **Anime-Kun** | **Field** | **Notes** |
|---------------|-----------|---------------|-----------|-----------|
| `wp_users` | `ID` | `ak_membres` | `id_member` | Direct mapping |
| `wp_users` | `user_login` | `ak_membres` | `member_name` | Username |
| `wp_users` | `user_email` | `ak_membres` | `email_address` | Email |
| `wp_users` | `user_pass` | `ak_membres` | `passwd` | ⚠️ Hash format different |
| `wp_users` | `display_name` | `ak_membres` | `real_name` | Display name |
| | | | |
| `wp_posts` | `ID` | `ak_webzine` | `id_art` | Article ID |
| `wp_posts` | `post_title` | `ak_webzine` | `titre` | Article title |
| `wp_posts` | `post_name` | `ak_webzine` | `nice_url` | URL slug |
| `wp_posts` | `post_content` | `ak_webzine` | `contenu` | Article content |
| `wp_posts` | `post_excerpt` | `ak_webzine` | `meta_description` | Excerpt/description |
| `wp_posts` | `post_author` | `ak_webzine` | `auteur` | Author ID |
| `wp_posts` | `post_date` | `ak_webzine` | `date` | Publication date |
| `wp_posts` | `comment_count` | `ak_webzine` | `nb_com` | Comment count |
| | | | |
| `wp_comments` | `comment_ID` | `ak_webzine_comments` | `id_comment` | Comment ID |
| `wp_comments` | `comment_post_ID` | `ak_webzine_comments` | `id_art` | Article ID |
| `wp_comments` | `comment_content` | `ak_webzine_comments` | `content` | Comment text |
| `wp_comments` | `comment_author` | `ak_webzine_comments` | `author_name` | Commenter name |
| `wp_comments` | `comment_date` | `ak_webzine_comments` | `date_created` | Comment date |

---

## ⚠️ Important Notes

### **1. Password Compatibility**
- WordPress uses different password hashing than your system
- Users may need to reset passwords after migration
- Consider implementing WordPress password verification for seamless transition

### **2. Image Paths**
- Image URLs are migrated as-is from WordPress
- You may need to update image paths to point to your media server
- Featured images are extracted from `_thumbnail_id` meta

### **3. Categories & Tags**
- Categories are properly migrated with relationships
- Tags are stored as comma-separated strings in `ak_webzine.tags`
- Hierarchical category structure is preserved

### **4. Content Formatting**
- WordPress post content includes HTML formatting
- Shortcodes and WordPress-specific formatting may need cleanup
- Consider running content through sanitization if needed

---

## 🔧 Troubleshooting

### **Connection Issues**

**MySQL Connection Failed:**
```bash
# Check MySQL service
systemctl status mysql
# or
brew services list | grep mysql

# Test manual connection
mysql -h localhost -u animekunnet -p animekunnet
```

**PostgreSQL Connection Failed:**
```bash
# Check PostgreSQL service  
systemctl status postgresql
# or via Docker
docker-compose ps

# Test manual connection
psql -h localhost -U anime_user -d anime_kun
```

### **Migration Issues**

**Duplicate Key Errors:**
- Migration script uses `ON CONFLICT DO NOTHING`
- Safe to re-run migration if it fails partway through
- Check `migration-log.txt` for specific errors

**Missing Tables:**
- Ensure your PostgreSQL schema is up to date
- Run Prisma migrations: `npx prisma db push`
- Check table names match expected schema

### **Data Validation**

After migration, verify data integrity:

```sql
-- Check migrated counts
SELECT COUNT(*) as articles FROM ak_webzine;
SELECT COUNT(*) as users FROM ak_membres; 
SELECT COUNT(*) as comments FROM ak_webzine_comments;
SELECT COUNT(*) as categories FROM ak_webzine_categories;

-- Check sample data
SELECT id_art, titre, auteur, date FROM ak_webzine ORDER BY date DESC LIMIT 5;
```

---

## 📈 Post-Migration Steps

### **1. Update Article Images**
If you need to update image paths:

```sql
UPDATE ak_webzine 
SET img = REPLACE(img, 'http://old-domain.com', 'http://new-domain.com')
WHERE img LIKE 'http://old-domain.com%';
```

### **2. Enable Articles in Frontend**
Once migration is complete, implement the articles pages using the roadmap:
- Follow `/ARTICLES_ROADMAP.md` for frontend implementation
- API endpoints are already available at `/api/articles`

### **3. Test Articles System**
```bash
# Test articles API
curl http://localhost:3003/api/articles?limit=5

# Test specific article
curl http://localhost:3003/api/articles/slug/your-article-slug
```

---

## 📝 Migration Checklist

- [ ] **Pre-Migration**
  - [ ] Both databases running and accessible
  - [ ] Node.js dependencies installed  
  - [ ] Connection test passed
  - [ ] PostgreSQL backup created

- [ ] **Migration**
  - [ ] Migration script executed successfully
  - [ ] No critical errors in migration log
  - [ ] Migration report generated

- [ ] **Post-Migration**  
  - [ ] Data counts verified
  - [ ] Sample data looks correct
  - [ ] Image URLs functional
  - [ ] API endpoints working
  - [ ] Articles display correctly in frontend

---

## 🆘 Support

If you encounter issues:

1. **Check Logs**: Review `migration-log.txt` for detailed error messages
2. **Verify Schema**: Ensure PostgreSQL tables match expected structure  
3. **Test Connections**: Re-run `test-connections.js`
4. **Rollback**: Restore from backup if needed: 
   ```bash
   psql -h localhost -U anime_user -d anime_kun < backup-before-migration.sql
   ```

---

**Migration Script Version**: 1.0.0  
**Last Updated**: August 20, 2025  
**Compatibility**: WordPress 5.x+, PostgreSQL 12+