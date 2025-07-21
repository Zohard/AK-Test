-- Creating PostgreSQL database for Anime-Kun
-- Run as superuser or database owner

-- Create database (run this separately if needed)
-- CREATE DATABASE anime_kun WITH ENCODING 'UTF8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8';
-- \c anime_kun;

-- Enable extensions for better functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Table for animes
CREATE TABLE ak_animes (
    id_anime SERIAL PRIMARY KEY,
    nice_url VARCHAR(255) UNIQUE NOT NULL,
    titre VARCHAR(255) NOT NULL,
    realisateur VARCHAR(255), -- Legacy field
    annee INTEGER,
    titre_orig TEXT,
    nb_ep INTEGER,
    studio VARCHAR(255), -- Legacy field, to be migrated to ak_rel_animes
    synopsis TEXT,
    doublage VARCHAR(255), -- Added field that was in API but missing from schema
    image VARCHAR(255),
    sources TEXT,
    nb_reviews INTEGER DEFAULT 0,
    moyennenotes DECIMAL(3,2) DEFAULT 0.00, -- Changed from FLOAT to DECIMAL for precision
    statut INTEGER DEFAULT 1,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification INTEGER -- Legacy field, consider converting to TIMESTAMP
);

-- Create indexes for animes
CREATE INDEX idx_anime_nice_url ON ak_animes(nice_url);
CREATE INDEX idx_anime_statut ON ak_animes(statut);
CREATE INDEX idx_anime_annee ON ak_animes(annee);
CREATE INDEX idx_anime_text_search ON ak_animes USING gin(to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')));

-- Table for mangas
CREATE TABLE ak_mangas (
    id_manga SERIAL PRIMARY KEY,
    nice_url VARCHAR(255) UNIQUE NOT NULL,
    titre VARCHAR(255) NOT NULL,
    auteur TEXT, -- Legacy field, to be migrated to ak_rel_mangas
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
    nb_reviews INTEGER DEFAULT 0, -- Added for consistency
    moyennenotes DECIMAL(3,2) DEFAULT 0.00, -- Added for consistency
    statut INTEGER DEFAULT 1, -- Added for consistency
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Added for consistency
    date_modification INTEGER -- Legacy field
);

-- Create indexes for mangas
CREATE INDEX idx_manga_nice_url ON ak_mangas(nice_url);
CREATE INDEX idx_manga_statut ON ak_mangas(statut);
CREATE INDEX idx_manga_annee ON ak_mangas(annee);
CREATE INDEX idx_manga_text_search ON ak_mangas USING gin(to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')));

-- Table for users
CREATE TABLE ak_users (
    id_membre SERIAL PRIMARY KEY, -- Keeping original field name for compatibility
    id INTEGER GENERATED ALWAYS AS (id_membre) STORED, -- Alias for API compatibility
    pseudo VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) GENERATED ALWAYS AS (pseudo) STORED, -- Alias for API compatibility
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut INTEGER DEFAULT 1,
    avatar TEXT,
    signature TEXT
);

-- Create indexes for users
CREATE INDEX idx_users_pseudo ON ak_users(pseudo);
CREATE INDEX idx_users_email ON ak_users(email);
CREATE INDEX idx_users_statut ON ak_users(statut);

-- Table for critiques
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
    id_membre INTEGER REFERENCES ak_users(id_membre) ON DELETE SET NULL,
    id_anime INTEGER REFERENCES ak_animes(id_anime) ON DELETE SET NULL,
    id_manga INTEGER REFERENCES ak_mangas(id_manga) ON DELETE SET NULL,
    id_ost INTEGER, -- Foreign key to be added when OST table exists
    id_jeu INTEGER -- Foreign key to be added when Games table exists
);

-- Create indexes for critiques
CREATE INDEX idx_critique_nice_url ON ak_critique(nice_url);
CREATE INDEX idx_critique_date_status ON ak_critique(date_critique, statut);
CREATE INDEX idx_critique_membre ON ak_critique(id_membre);
CREATE INDEX idx_critique_anime ON ak_critique(id_anime);
CREATE INDEX idx_critique_manga ON ak_critique(id_manga);

-- Table for articles
CREATE TABLE ak_webzine_articles (
    id_article SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    id_membre INTEGER REFERENCES ak_users(id_membre) ON DELETE SET NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut INTEGER DEFAULT 1
);

-- Create indexes for articles
CREATE INDEX idx_article_date_status ON ak_webzine_articles(date_creation, statut);
CREATE INDEX idx_article_membre ON ak_webzine_articles(id_membre);

-- Join table for articles and users (many-to-many relationship)
CREATE TABLE ak_article_authors (
    id_article INTEGER NOT NULL REFERENCES ak_webzine_articles(id_article) ON DELETE CASCADE,
    id_membre INTEGER NOT NULL REFERENCES ak_users(id_membre) ON DELETE CASCADE,
    PRIMARY KEY (id_article, id_membre)
);

-- Create indexes for article authors
CREATE INDEX idx_article_authors_article ON ak_article_authors(id_article);
CREATE INDEX idx_article_authors_membre ON ak_article_authors(id_membre);

-- Business/Studio relationship table for animes
CREATE TABLE ak_business (
    id_business SERIAL PRIMARY KEY,
    denomination VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- Studio, Distributor, etc.
    location VARCHAR(255),
    founded DATE,
    status INTEGER DEFAULT 1
);

-- Create indexes for business
CREATE INDEX idx_business_denomination ON ak_business(denomination);
CREATE INDEX idx_business_type ON ak_business(type);

-- Join table for business relationships with animes
CREATE TABLE ak_business_to_animes (
    id_relation SERIAL PRIMARY KEY,
    id_anime INTEGER NOT NULL REFERENCES ak_animes(id_anime) ON DELETE CASCADE,
    id_business INTEGER NOT NULL REFERENCES ak_business(id_business) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- Role type (Studio, Producer, etc.)
    precisions TEXT
);

-- Create indexes for anime business relationships
CREATE INDEX idx_business_anime_anime ON ak_business_to_animes(id_anime);
CREATE INDEX idx_business_anime_business ON ak_business_to_animes(id_business);
CREATE INDEX idx_business_anime_type ON ak_business_to_animes(id_anime, type);

-- Join table for business relationships with mangas
CREATE TABLE ak_business_to_mangas (
    id_relation SERIAL PRIMARY KEY,
    id_manga INTEGER NOT NULL REFERENCES ak_mangas(id_manga) ON DELETE CASCADE,
    id_business INTEGER NOT NULL REFERENCES ak_business(id_business) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- Role type (Publisher, Author, etc.)
    precisions TEXT
);

-- Create indexes for manga business relationships
CREATE INDEX idx_business_manga_manga ON ak_business_to_mangas(id_manga);
CREATE INDEX idx_business_manga_business ON ak_business_to_mangas(id_business);
CREATE INDEX idx_business_manga_type ON ak_business_to_mangas(id_manga, type);

-- Legacy relationship tables (keeping for backward compatibility)
CREATE TABLE ak_rel_animes (
    id_relation SERIAL PRIMARY KEY,
    id_anime INTEGER NOT NULL REFERENCES ak_animes(id_anime) ON DELETE CASCADE,
    id_membre INTEGER REFERENCES ak_users(id_membre) ON DELETE SET NULL,
    studio_name VARCHAR(255),
    studio_location VARCHAR(255),
    studio_founded DATE,
    studio_status SMALLINT DEFAULT 1,
    type VARCHAR(100) NOT NULL,
    precisions TEXT,
    doublon SMALLINT
);

-- Create indexes for anime relationships
CREATE INDEX idx_rel_anime_anime ON ak_rel_animes(id_anime);
CREATE INDEX idx_rel_anime_membre ON ak_rel_animes(id_membre);
CREATE INDEX idx_rel_anime_type ON ak_rel_animes(id_anime, type);

-- Legacy relationship table for mangas
CREATE TABLE ak_rel_mangas (
    id_relation SERIAL PRIMARY KEY,
    id_manga INTEGER NOT NULL REFERENCES ak_mangas(id_manga) ON DELETE CASCADE,
    id_membre INTEGER REFERENCES ak_users(id_membre) ON DELETE SET NULL,
    studio_name VARCHAR(255),
    studio_location VARCHAR(255),
    studio_founded DATE,
    studio_status SMALLINT DEFAULT 1,
    type VARCHAR(100) NOT NULL,
    precisions TEXT,
    doublon SMALLINT
);

-- Create indexes for manga relationships
CREATE INDEX idx_rel_manga_manga ON ak_rel_mangas(id_manga);
CREATE INDEX idx_rel_manga_membre ON ak_rel_mangas(id_membre);
CREATE INDEX idx_rel_manga_type ON ak_rel_mangas(id_manga, type);

-- Create views for API compatibility
CREATE VIEW v_animes AS 
SELECT 
    id_anime,
    nice_url,
    titre,
    realisateur,
    annee,
    titre_orig,
    nb_ep,
    studio,
    synopsis,
    doublage,
    image,
    sources,
    nb_reviews,
    moyennenotes as MoyenneNotes, -- Alias for MySQL compatibility
    statut,
    date_ajout,
    date_modification
FROM ak_animes;

CREATE VIEW v_mangas AS 
SELECT 
    id_manga,
    nice_url,
    titre,
    auteur,
    annee,
    origine,
    titre_orig,
    titre_fr,
    titres_alternatifs,
    licence,
    nb_volumes,
    nb_vol,
    statut_vol,
    synopsis,
    image,
    nb_reviews,
    moyennenotes as MoyenneNotes, -- Alias for MySQL compatibility
    statut,
    date_ajout,
    date_modification
FROM ak_mangas;

-- Function to update moyenne notes for animes
CREATE OR REPLACE FUNCTION update_anime_moyenne_notes()
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

-- Function to update moyenne notes for mangas
CREATE OR REPLACE FUNCTION update_manga_moyenne_notes()
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

-- Triggers to automatically update ratings
CREATE TRIGGER trigger_update_anime_moyenne_notes
    AFTER INSERT OR UPDATE OR DELETE ON ak_critique
    FOR EACH ROW
    EXECUTE FUNCTION update_anime_moyenne_notes();

CREATE TRIGGER trigger_update_manga_moyenne_notes
    AFTER INSERT OR UPDATE OR DELETE ON ak_critique
    FOR EACH ROW
    EXECUTE FUNCTION update_manga_moyenne_notes();

-- Comments for documentation
COMMENT ON TABLE ak_animes IS 'Table containing anime information and metadata';
COMMENT ON TABLE ak_mangas IS 'Table containing manga information and metadata';
COMMENT ON TABLE ak_users IS 'User accounts and profile information';
COMMENT ON TABLE ak_critique IS 'User reviews and ratings for anime/manga';
COMMENT ON TABLE ak_webzine_articles IS 'Editorial articles and news content';
COMMENT ON TABLE ak_business IS 'Studios, publishers, and other business entities';

-- Insert some sample data for testing (optional)
-- INSERT INTO ak_business (denomination, type) VALUES 
--     ('Studio Ghibli', 'Studio'),
--     ('Toei Animation', 'Studio'),
--     ('Shonen Jump', 'Publisher');