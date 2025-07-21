-- Creating database for Anime-Kun with UTF-8 support
CREATE DATABASE IF NOT EXISTS anime_kun CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE anime_kun;

-- Table for animes
CREATE TABLE ak_animes (
    id_anime INT AUTO_INCREMENT PRIMARY KEY,
    nice_url VARCHAR(255) UNIQUE NOT NULL,
    titre VARCHAR(255) NOT NULL,
    realisateur VARCHAR(255), -- Legacy field
    annee INT,
    titre_orig TEXT,
    nb_ep INT,
    studio VARCHAR(255), -- Legacy field, to be migrated to ak_rel_animes
    synopsis TEXT,
    image VARCHAR(255),
    sources TEXT,
    nb_reviews INT DEFAULT 0,
    MoyenneNotes FLOAT DEFAULT 0,
    statut INT DEFAULT 1,
    date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification INT, -- Legacy field, consider converting to DATETIME
    INDEX idx_anime_nice_url (nice_url)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table for mangas
CREATE TABLE ak_mangas (
    id_manga INT AUTO_INCREMENT PRIMARY KEY,
    nice_url VARCHAR(255) UNIQUE NOT NULL,
    titre VARCHAR(255) NOT NULL,
    auteur TEXT, -- Legacy field, to be migrated to ak_rel_mangas
    annee VARCHAR(4),
    origine VARCHAR(100),
    titre_orig TEXT,
    titre_fr TEXT,
    titres_alternatifs TEXT,
    licence INT DEFAULT 0,
    nb_volumes VARCHAR(50),
    nb_vol INT,
    statut_vol VARCHAR(50),
    synopsis TEXT,
    image VARCHAR(255),
    INDEX idx_manga_nice_url (nice_url)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table for users
CREATE TABLE ak_users (
    id_membre INT AUTO_INCREMENT PRIMARY KEY,
    pseudo VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut INT DEFAULT 1,
    avatar TEXT,
    signature TEXT,
    INDEX idx_pseudo (pseudo)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table for critiques
CREATE TABLE ak_critique (
    id_critique INT AUTO_INCREMENT PRIMARY KEY,
    nice_url VARCHAR(255) UNIQUE NOT NULL,
    titre VARCHAR(255) NOT NULL,
    critique TEXT NOT NULL,
    notation INT CHECK (notation BETWEEN 1 AND 10),
    date_critique DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut INT DEFAULT 1,
    questions TEXT,
    accept_images INT,
    evaluation TEXT,
    id_membre INT,
    id_anime INT,
    id_manga INT,
    id_ost INT,
    id_jeu INT,
    FOREIGN KEY (id_membre) REFERENCES ak_users(id_membre) ON DELETE SET NULL,
    FOREIGN KEY (id_anime) REFERENCES ak_animes(id_anime) ON DELETE SET NULL,
    FOREIGN KEY (id_manga) REFERENCES ak_mangas(id_manga) ON DELETE SET NULL,
    INDEX idx_critique_date_status (date_critique, statut)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table for articles
CREATE TABLE ak_webzine_articles (
    id_article INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    id_membre INT,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut INT DEFAULT 1,
    FOREIGN KEY (id_membre) REFERENCES ak_users(id_membre) ON DELETE SET NULL,
    INDEX idx_article_date_status (date_creation, statut)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Join table for articles and users
CREATE TABLE ak_article_authors (
    id_article INT NOT NULL,
    id_membre INT NOT NULL,
    PRIMARY KEY (id_article, id_membre),
    FOREIGN KEY (id_article) REFERENCES ak_webzine_articles(id_article) ON DELETE CASCADE,
    FOREIGN KEY (id_membre) REFERENCES ak_users(id_membre) ON DELETE CASCADE,
    INDEX idx_article_authors (id_article)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Join table for relationship with animes
CREATE TABLE ak_rel_animes (
    id_relation INT AUTO_INCREMENT PRIMARY KEY, -- Legacy id_relation
    id_anime INT NOT NULL,
    id_membre INT, -- Staff member
    studio_name VARCHAR(255), -- Replaced studios table
    studio_location VARCHAR(255),
    studio_founded DATE,
    studio_status TINYINT DEFAULT 1,
    type VARCHAR(100) NOT NULL, -- Role (e.g., Studio, Director, legacy)
    precisions TEXT, -- Legacy field
    doublon TINYINT, -- Legacy field
    FOREIGN KEY (id_anime) REFERENCES ak_animes(id_anime) ON DELETE CASCADE,
    FOREIGN KEY (id_membre) REFERENCES ak_users(id_membre) ON DELETE SET NULL,
    INDEX idx_business_anime_type (id_anime, type),
    INDEX idx_business_member (id_membre)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Join table for relationship with mangas
CREATE TABLE ak_rel_mangas (
    id_relation INT AUTO_INCREMENT PRIMARY KEY, -- Legacy id_relation
    id_manga INT NOT NULL,
    id_membre INT, -- Staff member
    studio_name VARCHAR(255), -- Replaced studios table
    studio_location VARCHAR(255),
    studio_founded DATE,
    studio_status TINYINT DEFAULT 1,
    type VARCHAR(100) NOT NULL, -- Role (e.g., Studio, Author, legacy)
    precisions TEXT, -- Legacy field
    doublon TINYINT, -- Legacy field
    FOREIGN KEY (id_manga) REFERENCES ak_mangas(id_manga) ON DELETE CASCADE,
    FOREIGN KEY (id_membre) REFERENCES ak_users(id_membre) ON DELETE SET NULL,
    INDEX idx_business_manga_type (id_manga, type),
    INDEX idx_business_member (id_membre)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Indexes for better performance
CREATE INDEX idx_anime_nice_url ON ak_animes(nice_url);
CREATE INDEX idx_manga_nice_url ON ak_mangas(nice_url);
CREATE INDEX idx_critique_nice_url ON ak_critique(nice_url);