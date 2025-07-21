-- PostgreSQL schema matching the real animekunnet database structure
-- Based on actual MySQL database inspection

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table matching the real ak_users structure
CREATE TABLE ak_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(180) UNIQUE NOT NULL,
    roles JSON NOT NULL DEFAULT '[]',
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    prenom VARCHAR(100),
    nom VARCHAR(100),
    avatar VARCHAR(255),
    dateInscription TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    derniereConnexion TIMESTAMP,
    actif BOOLEAN NOT NULL DEFAULT true,
    emailVerified BOOLEAN NOT NULL DEFAULT false,
    emailVerificationToken VARCHAR(255),
    wp_user_id BIGINT,
    wp_password_hash VARCHAR(255),
    password_sync_needed BOOLEAN DEFAULT false,
    bio TEXT,
    dateNaissance DATE,
    ville VARCHAR(50),
    pays VARCHAR(50),
    smfId INTEGER,
    legacyPasswordHash VARCHAR(32),
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP,
    smfPosts INTEGER DEFAULT 0,
    smfRealName VARCHAR(255),
    smfPersonalText VARCHAR(255),
    smfWebsiteTitle VARCHAR(255),
    smfWebsiteUrl VARCHAR(255),
    smfLocation VARCHAR(255),
    smfGender SMALLINT,
    smfBirthdate DATE,
    smfDateRegistered TIMESTAMP,
    smfLastLogin TIMESTAMP,
    smf_password_hash VARCHAR(64),
    smf_avatar VARCHAR(255)
);

-- Create indexes for ak_users
CREATE INDEX idx_users_username ON ak_users(username);
CREATE INDEX idx_users_email ON ak_users(email);
CREATE INDEX idx_users_smfId ON ak_users(smfId);
CREATE INDEX idx_users_actif ON ak_users(actif);

-- Animes table (already good structure, just ensure compatibility)
CREATE TABLE ak_animes (
    id_anime SERIAL PRIMARY KEY,
    nice_url VARCHAR(255) UNIQUE NOT NULL,
    titre VARCHAR(255) NOT NULL,
    realisateur VARCHAR(255),
    annee INTEGER,
    titre_orig TEXT,
    nb_ep INTEGER,
    studio VARCHAR(255),
    synopsis TEXT,
    doublage VARCHAR(255),
    image VARCHAR(255),
    sources TEXT,
    nb_reviews INTEGER DEFAULT 0,
    moyennenotes DECIMAL(3,2) DEFAULT 0.00,
    statut INTEGER DEFAULT 1,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification INTEGER
);

-- Create indexes for animes
CREATE INDEX idx_anime_nice_url ON ak_animes(nice_url);
CREATE INDEX idx_anime_statut ON ak_animes(statut);
CREATE INDEX idx_anime_annee ON ak_animes(annee);
CREATE INDEX idx_anime_text_search ON ak_animes USING gin(to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')));

-- Mangas table
CREATE TABLE ak_mangas (
    id_manga SERIAL PRIMARY KEY,
    nice_url VARCHAR(255) UNIQUE NOT NULL,
    titre VARCHAR(255) NOT NULL,
    auteur TEXT,
    annee VARCHAR(4),
    origine VARCHAR(100),
    titre_orig TEXT,
    titre_fr TEXT,
    titres_alternatifs TEXT,
    licence INTEGER DEFAULT 0,
    nb_volumes VARCHAR(50),
    nb_vol INTEGER,
    statut_vol VARCHAR(50),
    synopsis TEXT,
    image VARCHAR(255),
    nb_reviews INTEGER DEFAULT 0,
    moyennenotes DECIMAL(3,2) DEFAULT 0.00,
    statut INTEGER DEFAULT 1,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification INTEGER
);

-- Create indexes for mangas
CREATE INDEX idx_manga_nice_url ON ak_mangas(nice_url);
CREATE INDEX idx_manga_statut ON ak_mangas(statut);
CREATE INDEX idx_manga_text_search ON ak_mangas USING gin(to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')));

-- Critiques table
CREATE TABLE ak_critique (
    id_critique SERIAL PRIMARY KEY,
    nice_url VARCHAR(255) UNIQUE NOT NULL,
    titre VARCHAR(255) NOT NULL,
    critique TEXT NOT NULL,
    notation INTEGER CHECK (notation BETWEEN 1 AND 10),
    date_critique TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut INTEGER DEFAULT 1,
    questions TEXT,
    accept_images INTEGER,
    evaluation TEXT,
    id_membre INTEGER REFERENCES ak_users(id) ON DELETE SET NULL,
    id_anime INTEGER REFERENCES ak_animes(id_anime) ON DELETE SET NULL,
    id_manga INTEGER REFERENCES ak_mangas(id_manga) ON DELETE SET NULL,
    id_ost INTEGER,
    id_jeu INTEGER
);

-- Create indexes for critiques
CREATE INDEX idx_critique_nice_url ON ak_critique(nice_url);
CREATE INDEX idx_critique_date_status ON ak_critique(date_critique, statut);
CREATE INDEX idx_critique_membre ON ak_critique(id_membre);
CREATE INDEX idx_critique_anime ON ak_critique(id_anime);
CREATE INDEX idx_critique_manga ON ak_critique(id_manga);

-- Business entities table
CREATE TABLE ak_business (
    id_business SERIAL PRIMARY KEY,
    denomination VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    founded DATE,
    status INTEGER DEFAULT 1
);

-- Business to anime relationships
CREATE TABLE ak_business_to_animes (
    id_relation SERIAL PRIMARY KEY,
    id_anime INTEGER NOT NULL REFERENCES ak_animes(id_anime) ON DELETE CASCADE,
    id_business INTEGER NOT NULL REFERENCES ak_business(id_business) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    precisions TEXT
);

-- Business to manga relationships  
CREATE TABLE ak_business_to_mangas (
    id_relation SERIAL PRIMARY KEY,
    id_manga INTEGER NOT NULL REFERENCES ak_mangas(id_manga) ON DELETE CASCADE,
    id_business INTEGER NOT NULL REFERENCES ak_business(id_business) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    precisions TEXT
);

-- User anime lists
CREATE TABLE ak_user_anime_list (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES ak_users(id) ON DELETE CASCADE,
    anime_id INTEGER REFERENCES ak_animes(id_anime) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'plan_to_watch',
    score INTEGER CHECK (score BETWEEN 1 AND 10),
    episodes_watched INTEGER DEFAULT 0,
    start_date DATE,
    finish_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, anime_id)
);

-- User manga lists
CREATE TABLE ak_user_manga_list (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES ak_users(id) ON DELETE CASCADE,
    manga_id INTEGER REFERENCES ak_mangas(id_manga) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'plan_to_read',
    score INTEGER CHECK (score BETWEEN 1 AND 10),
    volumes_read INTEGER DEFAULT 0,
    chapters_read INTEGER DEFAULT 0,
    start_date DATE,
    finish_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, manga_id)
);

-- Tags table
CREATE TABLE ak_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tag to content relationships (for both anime and manga)
CREATE TABLE ak_tag2fiche (
    id SERIAL PRIMARY KEY,
    tag_id INTEGER REFERENCES ak_tags(id) ON DELETE CASCADE,
    content_type VARCHAR(10) CHECK (content_type IN ('anime', 'manga')),
    content_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Top lists
CREATE TABLE ak_top_lists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES ak_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Top list items
CREATE TABLE ak_top_list_items (
    id SERIAL PRIMARY KEY,
    list_id INTEGER REFERENCES ak_top_lists(id) ON DELETE CASCADE,
    content_type VARCHAR(10) CHECK (content_type IN ('anime', 'manga')),
    content_id INTEGER,
    position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create views for API compatibility with original field names
CREATE VIEW v_users AS 
SELECT 
    id as id_membre,
    username as pseudo,
    username,
    email,
    smfRealName as nom_complet,
    smfLocation as location,
    smf_avatar as avatar_url,
    dateInscription as date_inscription,
    actif as statut
FROM ak_users;

-- Functions to update ratings automatically
CREATE OR REPLACE FUNCTION update_anime_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ak_animes 
    SET moyennenotes = (
        SELECT COALESCE(AVG(notation::decimal), 0) 
        FROM ak_critique 
        WHERE id_anime = COALESCE(NEW.id_anime, OLD.id_anime)
        AND statut = 1
    ),
    nb_reviews = (
        SELECT COUNT(*) 
        FROM ak_critique 
        WHERE id_anime = COALESCE(NEW.id_anime, OLD.id_anime)
        AND statut = 1
    )
    WHERE id_anime = COALESCE(NEW.id_anime, OLD.id_anime);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_manga_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ak_mangas 
    SET moyennenotes = (
        SELECT COALESCE(AVG(notation::decimal), 0) 
        FROM ak_critique 
        WHERE id_manga = COALESCE(NEW.id_manga, OLD.id_manga)
        AND statut = 1
    ),
    nb_reviews = (
        SELECT COUNT(*) 
        FROM ak_critique 
        WHERE id_manga = COALESCE(NEW.id_manga, OLD.id_manga)
        AND statut = 1
    )
    WHERE id_manga = COALESCE(NEW.id_manga, OLD.id_manga);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_anime_ratings
    AFTER INSERT OR UPDATE OR DELETE ON ak_critique
    FOR EACH ROW
    EXECUTE FUNCTION update_anime_ratings();

CREATE TRIGGER trigger_update_manga_ratings
    AFTER INSERT OR UPDATE OR DELETE ON ak_critique
    FOR EACH ROW
    EXECUTE FUNCTION update_manga_ratings();

-- Comments for documentation
COMMENT ON TABLE ak_users IS 'User accounts with SMF integration';
COMMENT ON TABLE ak_animes IS 'Anime database with ratings and metadata';
COMMENT ON TABLE ak_mangas IS 'Manga database with ratings and metadata';
COMMENT ON TABLE ak_critique IS 'User reviews and ratings for anime/manga';
COMMENT ON TABLE ak_user_anime_list IS 'User personal anime lists (watching, completed, etc.)';
COMMENT ON TABLE ak_user_manga_list IS 'User personal manga lists (reading, completed, etc.)';

-- Final setup
COMMENT ON DATABASE anime_kun IS 'Anime-Kun PostgreSQL database - migrated from MySQL';