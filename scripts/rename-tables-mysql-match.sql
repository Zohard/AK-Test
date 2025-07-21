-- Rename PostgreSQL tables to match MySQL structure exactly
-- This ensures 1:1 compatibility

-- First, drop views that reference tables we're renaming
DROP VIEW IF EXISTS v_users;
DROP VIEW IF EXISTS v_animes;
DROP VIEW IF EXISTS v_mangas;

-- Drop tables that don't exist in MySQL or are different
DROP TABLE IF EXISTS ak_article_authors CASCADE;
DROP TABLE IF EXISTS ak_webzine_articles CASCADE; 
DROP TABLE IF EXISTS ak_rel_animes CASCADE;
DROP TABLE IF EXISTS ak_rel_mangas CASCADE;

-- Create the missing table: ak_anime_screenshots
CREATE TABLE ak_anime_screenshots (
    id SERIAL PRIMARY KEY,
    id_anime INTEGER REFERENCES ak_animes(id_anime) ON DELETE CASCADE,
    screenshot_url VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table structure is already correct for:
-- ✅ ak_users (already exists and populated)
-- ✅ ak_animes (already exists and populated) 
-- ✅ ak_mangas (exists but empty)
-- ✅ ak_critique (already exists and populated)
-- ✅ ak_business (exists but empty)
-- ✅ ak_business_to_animes (exists but empty)
-- ✅ ak_business_to_mangas (exists but empty)
-- ✅ ak_tags (exists but empty)
-- ✅ ak_tag2fiche (exists but empty)
-- ✅ ak_top_lists (exists but empty)  
-- ✅ ak_top_list_items (exists but empty)
-- ✅ ak_user_anime_list (exists but empty)
-- ✅ ak_user_manga_list (exists but empty)
-- ✅ ak_anime_screenshots (just created)

-- Add indexes for new table
CREATE INDEX idx_anime_screenshots_anime ON ak_anime_screenshots(id_anime);

COMMENT ON DATABASE anime_kun IS 'PostgreSQL version matching MySQL animekunnet structure exactly';