-- PostgreSQL Schema Generated from MySQL animekunnet database
-- Generated on: 2025-07-21T22:18:47.203Z
-- Source: mysql://animekunnet@127.0.0.1:3306/animekunnet

-- Drop existing tables if they exist
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Table: ak_users
CREATE TABLE ak_users (
    id INTEGER SERIAL NOT NULL,
    username VARCHAR(180) NOT NULL,
    roles TEXT NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    prenom VARCHAR(100),
    nom VARCHAR(100),
    avatar VARCHAR(255),
    dateInscription TIMESTAMP NOT NULL,
    derniereConnexion TIMESTAMP,
    actif SMALLINT NOT NULL,
    emailVerified SMALLINT NOT NULL,
    emailVerificationToken VARCHAR(255),
    wp_user_id BIGINT,
    wp_password_hash VARCHAR(255),
    password_sync_needed SMALLINT DEFAULT '0',
    bio TEXT,
    dateNaissance DATE,
    ville VARCHAR(50),
    pays VARCHAR(50),
    smfId INTEGER,
    legacyPasswordHash VARCHAR(32),
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP,
    smfPosts INTEGER,
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
    smf_avatar VARCHAR(255),
    CONSTRAINT ak_users_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX UNIQ_DFAB8F85E7927C74 ON ak_users (email);
CREATE UNIQUE INDEX UNIQ_IDENTIFIER_USERNAME ON ak_users (username);
CREATE INDEX idx_wp_user_id ON ak_users (wp_user_id);

-- Table: ak_anime_screenshots
CREATE TABLE ak_anime_screenshots (
    id INTEGER SERIAL NOT NULL,
    filename VARCHAR(255) NOT NULL,
    caption VARCHAR(255),
    sortOrder INTEGER,
    createdAt TIMESTAMP NOT NULL,
    anime_id INTEGER NOT NULL,
    CONSTRAINT ak_anime_screenshots_pkey PRIMARY KEY (id)
);

CREATE INDEX IDX_284EA986794BBE89 ON ak_anime_screenshots (anime_id);

-- Table: ak_animes
CREATE TABLE ak_animes (
    id_anime INTEGER SERIAL NOT NULL,
    nice_url VARCHAR(255),
    titre VARCHAR(255) NOT NULL,
    realisateur VARCHAR(100),
    annee INTEGER,
    titre_orig TEXT,
    nb_ep INTEGER,
    studio VARCHAR(100),
    synopsis TEXT,
    doublage TEXT,
    image VARCHAR(255),
    sources TEXT,
    nb_reviews INTEGER NOT NULL DEFAULT '0',
    MoyenneNotes REAL NOT NULL DEFAULT '0',
    statut INTEGER NOT NULL DEFAULT '1',
    date_ajout TIMESTAMP NOT NULL,
    date_modification INTEGER NOT NULL,
    CONSTRAINT ak_animes_pkey PRIMARY KEY (id_anime)
);

CREATE INDEX idx_ak_animes_statut ON ak_animes (statut);
CREATE INDEX idx_ak_animes_titre ON ak_animes (titre);
CREATE INDEX idx_ak_animes_date_ajout ON ak_animes (date_ajout);
CREATE INDEX idx_ak_animes_note ON ak_animes (MoyenneNotes);

-- Table: ak_business
CREATE TABLE ak_business (
    ID_BUSINESS INTEGER SERIAL NOT NULL,
    nice_url VARCHAR(255),
    type VARCHAR(255),
    denomination VARCHAR(255),
    autres_denominations TEXT,
    image VARCHAR(255),
    date VARCHAR(255),
    origine VARCHAR(255),
    site_officiel VARCHAR(255),
    notes TEXT,
    relations INTEGER DEFAULT '-1',
    nb_clics INTEGER NOT NULL DEFAULT '0',
    nb_clics_day INTEGER NOT NULL,
    nb_clics_week INTEGER NOT NULL,
    nb_clics_month INTEGER NOT NULL,
    statut INTEGER NOT NULL DEFAULT '1',
    date_ajout TIMESTAMP NOT NULL,
    date_modification INTEGER NOT NULL,
    latest_cache INTEGER NOT NULL,
    CONSTRAINT ak_business_pkey PRIMARY KEY (ID_BUSINESS)
);


-- Table: ak_business_to_animes
CREATE TABLE ak_business_to_animes (
    id_relation INTEGER SERIAL NOT NULL,
    id_anime INTEGER NOT NULL,
    id_business INTEGER NOT NULL,
    type VARCHAR(100),
    precisions TEXT NOT NULL,
    doublon SMALLINT NOT NULL,
    CONSTRAINT ak_business_to_animes_pkey PRIMARY KEY (id_relation)
);

CREATE INDEX idx_ak_business_to_animes_anime_type ON ak_business_to_animes (id_anime, type);

-- Table: ak_business_to_mangas
CREATE TABLE ak_business_to_mangas (
    id_relation INTEGER SERIAL NOT NULL,
    id_manga INTEGER NOT NULL,
    id_business INTEGER NOT NULL,
    type VARCHAR(100),
    precisions TEXT NOT NULL,
    doublon SMALLINT NOT NULL,
    CONSTRAINT ak_business_to_mangas_pkey PRIMARY KEY (id_relation)
);


-- Table: ak_critique
CREATE TABLE ak_critique (
    id_critique INTEGER SERIAL NOT NULL,
    nice_url VARCHAR(255) NOT NULL,
    titre TEXT NOT NULL,
    critique TEXT,
    notation INTEGER NOT NULL DEFAULT '0',
    date_critique TIMESTAMP,
    statut INTEGER NOT NULL DEFAULT '0',
    questions TEXT NOT NULL,
    accept_images INTEGER NOT NULL,
    evaluation TEXT,
    id_membre INTEGER NOT NULL DEFAULT '0',
    id_anime INTEGER NOT NULL DEFAULT '0',
    id_manga INTEGER NOT NULL DEFAULT '0',
    id_ost INTEGER NOT NULL DEFAULT '0',
    id_jeu INTEGER NOT NULL DEFAULT '0',
    cause_suppr TEXT,
    nb_clics INTEGER NOT NULL,
    nb_clics_day INTEGER NOT NULL DEFAULT '0',
    nb_clics_week INTEGER NOT NULL,
    nb_clics_month INTEGER NOT NULL,
    nb_carac INTEGER NOT NULL,
    popularite REAL NOT NULL,
    classement_popularite INTEGER NOT NULL,
    variation_popularite TEXT NOT NULL,
    CONSTRAINT ak_critique_pkey PRIMARY KEY (id_critique)
);


-- Table: ak_mangas
CREATE TABLE ak_mangas (
    id_manga INTEGER SERIAL NOT NULL,
    nice_url VARCHAR(255),
    titre TEXT,
    auteur TEXT,
    annee VARCHAR(4),
    origine VARCHAR(255),
    titre_orig TEXT,
    titre_fr TEXT,
    titres_alternatifs TEXT,
    licence INTEGER NOT NULL DEFAULT '0',
    nb_volumes VARCHAR(255),
    nb_vol INTEGER NOT NULL,
    statut_vol VARCHAR(11),
    synopsis TEXT,
    image VARCHAR(255),
    editeur TEXT,
    isbn VARCHAR(255),
    precisions TEXT,
    tags TEXT NOT NULL,
    nb_clics INTEGER NOT NULL DEFAULT '0',
    nb_clics_day INTEGER NOT NULL,
    nb_clics_week INTEGER NOT NULL,
    nb_clics_month INTEGER NOT NULL,
    nb_reviews INTEGER NOT NULL DEFAULT '0',
    LABEL INTEGER NOT NULL DEFAULT '0',
    MoyenneNotes REAL NOT NULL DEFAULT '0',
    lienforum INTEGER NOT NULL DEFAULT '0',
    statut INTEGER NOT NULL DEFAULT '1',
    fiche_complete SMALLINT NOT NULL,
    date_ajout TIMESTAMP NOT NULL,
    date_modification INTEGER NOT NULL,
    latest_cache INTEGER NOT NULL,
    classement_popularite INTEGER NOT NULL,
    variation_popularite TEXT NOT NULL,
    CONSTRAINT ak_mangas_pkey PRIMARY KEY (id_manga)
);


-- Table: ak_tag2fiche
CREATE TABLE ak_tag2fiche (
    id INTEGER SERIAL NOT NULL,
    id_tag INTEGER NOT NULL,
    id_fiche INTEGER NOT NULL,
    type VARCHAR NOT NULL DEFAULT 'anime',
    CONSTRAINT ak_tag2fiche_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX unique_tag_fiche ON ak_tag2fiche (id_tag, id_fiche, type);
CREATE INDEX idx_tag ON ak_tag2fiche (id_tag);
CREATE INDEX idx_fiche_type ON ak_tag2fiche (id_fiche, type);

-- Table: ak_tags
CREATE TABLE ak_tags (
    id_tag INTEGER SERIAL NOT NULL,
    tag_nice_url VARCHAR(100),
    tag_name VARCHAR(100),
    description TEXT NOT NULL,
    categorie VARCHAR(100),
    CONSTRAINT ak_tags_pkey PRIMARY KEY (id_tag)
);


-- Table: ak_top_list_items
CREATE TABLE ak_top_list_items (
    id INTEGER SERIAL NOT NULL,
    position INTEGER NOT NULL,
    comment TEXT,
    topList_id INTEGER NOT NULL,
    anime_id INTEGER,
    manga_id INTEGER,
    CONSTRAINT ak_top_list_items_pkey PRIMARY KEY (id)
);

CREATE INDEX IDX_4A6C627E5CDD6218 ON ak_top_list_items (topList_id);
CREATE INDEX IDX_4A6C627E794BBE89 ON ak_top_list_items (anime_id);
CREATE INDEX IDX_4A6C627E7B6461 ON ak_top_list_items (manga_id);

-- Table: ak_top_lists
CREATE TABLE ak_top_lists (
    id INTEGER SERIAL NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    isPublic SMALLINT NOT NULL,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP,
    createdBy_id INTEGER NOT NULL,
    CONSTRAINT ak_top_lists_pkey PRIMARY KEY (id)
);

CREATE INDEX IDX_88F808CE3174800F ON ak_top_lists (createdBy_id);

-- Table: ak_user_anime_list
CREATE TABLE ak_user_anime_list (
    id INTEGER SERIAL NOT NULL,
    status VARCHAR(50) NOT NULL,
    episodesWatched INTEGER,
    rating INTEGER,
    notes TEXT,
    addedAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP,
    startedAt TIMESTAMP,
    completedAt TIMESTAMP,
    user_id INTEGER NOT NULL,
    anime_id INTEGER NOT NULL,
    CONSTRAINT ak_user_anime_list_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX user_anime_unique ON ak_user_anime_list (user_id, anime_id);
CREATE INDEX IDX_74D7B2F1A76ED395 ON ak_user_anime_list (user_id);
CREATE INDEX IDX_74D7B2F1794BBE89 ON ak_user_anime_list (anime_id);

-- Table: ak_user_manga_list
CREATE TABLE ak_user_manga_list (
    id INTEGER SERIAL NOT NULL,
    status VARCHAR(50) NOT NULL,
    chaptersRead INTEGER,
    volumesRead INTEGER,
    rating INTEGER,
    notes TEXT,
    addedAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP,
    startedAt TIMESTAMP,
    completedAt TIMESTAMP,
    user_id INTEGER NOT NULL,
    manga_id INTEGER NOT NULL,
    CONSTRAINT ak_user_manga_list_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX user_manga_unique ON ak_user_manga_list (user_id, manga_id);
CREATE INDEX IDX_847689EFA76ED395 ON ak_user_manga_list (user_id);
CREATE INDEX IDX_847689EF7B6461 ON ak_user_manga_list (manga_id);

-- Table: doctrine_migration_versions
CREATE TABLE doctrine_migration_versions (
    version VARCHAR(191) NOT NULL,
    executed_at TIMESTAMP,
    execution_time INTEGER,
    CONSTRAINT doctrine_migration_versions_pkey PRIMARY KEY (version)
);


-- Table: smf_admin_info_files
CREATE TABLE smf_admin_info_files (
    id_file SMALLINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    filename VARCHAR(255) NOT NULL DEFAULT '',
    path VARCHAR(255) NOT NULL DEFAULT '',
    parameters VARCHAR(255) NOT NULL DEFAULT '',
    data TEXT NOT NULL,
    filetype VARCHAR(255) NOT NULL DEFAULT '',
    CONSTRAINT smf_admin_info_files_pkey PRIMARY KEY (id_file)
);

CREATE INDEX filename ON smf_admin_info_files (filename);

-- Table: smf_settings
CREATE TABLE smf_settings (
    variable VARCHAR(255) NOT NULL DEFAULT '',
    value TEXT NOT NULL,
    CONSTRAINT smf_settings_pkey PRIMARY KEY (variable)
);


-- Foreign Key Constraints
ALTER TABLE ak_critique ADD CONSTRAINT fk_ak_critique_id_membre FOREIGN KEY (id_membre) REFERENCES ak_users(id);
ALTER TABLE ak_critique ADD CONSTRAINT fk_ak_critique_id_anime FOREIGN KEY (id_anime) REFERENCES ak_animes(id_anime);
ALTER TABLE ak_critique ADD CONSTRAINT fk_ak_critique_id_manga FOREIGN KEY (id_manga) REFERENCES ak_mangas(id_manga);
ALTER TABLE ak_business_to_animes ADD CONSTRAINT fk_ak_business_to_animes_id_anime FOREIGN KEY (id_anime) REFERENCES ak_animes(id_anime);
ALTER TABLE ak_business_to_animes ADD CONSTRAINT fk_ak_business_to_animes_id_business FOREIGN KEY (id_business) REFERENCES ak_business(id_business);
ALTER TABLE ak_business_to_mangas ADD CONSTRAINT fk_ak_business_to_mangas_id_manga FOREIGN KEY (id_manga) REFERENCES ak_mangas(id_manga);
ALTER TABLE ak_business_to_mangas ADD CONSTRAINT fk_ak_business_to_mangas_id_business FOREIGN KEY (id_business) REFERENCES ak_business(id_business);