#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const fs = require('fs').promises;

console.log('🔄 Real Data Migration: MySQL to PostgreSQL');
console.log('============================================');

// MySQL configuration from your DATABASE_URL
const mysqlConfig = {
  host: '127.0.0.1',
  user: 'animekunnet',
  password: 'animekun77',
  database: 'animekunnet',
  port: 3306,
};

// PostgreSQL configuration
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'anime_user',
  password: process.env.DB_PASSWORD || 'anime_password',
  database: process.env.DB_NAME || 'anime_kun',
  port: process.env.DB_PORT || 5432,
};

async function connectDatabases() {
  console.log('🔌 Connecting to databases...');
  
  try {
    const mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ MySQL connected');
    
    const pgPool = new Pool(pgConfig);
    await pgPool.query('SELECT 1'); // Test connection
    console.log('✅ PostgreSQL connected');
    
    return { mysqlConnection, pgPool };
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function updatePostgreSQLSchema(pgPool) {
  console.log('🔧 Updating PostgreSQL schema to match MySQL structure...');
  
  const client = await pgPool.connect();
  try {
    // Update ak_users table to match MySQL structure
    await client.query(`
      ALTER TABLE ak_users DROP COLUMN IF EXISTS pseudo CASCADE;
      ALTER TABLE ak_users DROP COLUMN IF EXISTS avatar CASCADE;
      ALTER TABLE ak_users DROP COLUMN IF EXISTS signature CASCADE;
      ALTER TABLE ak_users DROP COLUMN IF EXISTS date_inscription CASCADE;
      ALTER TABLE ak_users DROP COLUMN IF EXISTS statut CASCADE;
      ALTER TABLE ak_users DROP COLUMN IF EXISTS username CASCADE;
    `);
    
    await client.query(`
      ALTER TABLE ak_users 
      ADD COLUMN username VARCHAR(180) UNIQUE,
      ADD COLUMN roles JSON,
      ADD COLUMN prenom VARCHAR(100),
      ADD COLUMN nom VARCHAR(100),
      ADD COLUMN avatar VARCHAR(255),
      ADD COLUMN dateInscription TIMESTAMP,
      ADD COLUMN derniereConnexion TIMESTAMP,
      ADD COLUMN actif BOOLEAN DEFAULT true,
      ADD COLUMN emailVerified BOOLEAN DEFAULT false,
      ADD COLUMN emailVerificationToken VARCHAR(255),
      ADD COLUMN bio TEXT,
      ADD COLUMN dateNaissance DATE,
      ADD COLUMN ville VARCHAR(50),
      ADD COLUMN pays VARCHAR(50);
    `);
    
    console.log('✅ PostgreSQL schema updated');
    
  } catch (error) {
    console.warn('⚠️  Schema update warning:', error.message);
  } finally {
    client.release();
  }
}

async function migrateUsers(mysqlConnection, pgPool, limit = 50) {
  console.log(`👥 Migrating users (first ${limit})...`);
  
  try {
    // Get users from MySQL
    const [rows] = await mysqlConnection.execute(`
      SELECT id, username, roles, email, prenom, nom, avatar, 
             dateInscription, derniereConnexion, actif, emailVerified,
             bio, dateNaissance, ville, pays
      FROM ak_users 
      ORDER BY id 
      LIMIT ?
    `, [limit]);
    
    console.log(`📊 Found ${rows.length} users to migrate`);
    
    const pgClient = await pgPool.connect();
    try {
      // Clear existing users
      await pgClient.query('TRUNCATE TABLE ak_users RESTART IDENTITY CASCADE');
      
      let migrated = 0;
      for (const user of rows) {
        try {
          await pgClient.query(`
            INSERT INTO ak_users (
              id_membre, username, password, email, prenom, nom, avatar,
              dateInscription, derniereConnexion, actif, emailVerified,
              bio, dateNaissance, ville, pays
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          `, [
            user.id,
            user.username,
            'migrated_password', // Placeholder - users will need to reset
            user.email,
            user.prenom,
            user.nom,
            user.avatar,
            user.dateInscription,
            user.derniereConnexion,
            user.actif,
            user.emailVerified,
            user.bio,
            user.dateNaissance,
            user.ville,
            user.pays
          ]);
          migrated++;
        } catch (error) {
          console.warn(`⚠️  Failed to migrate user ${user.username}:`, error.message);
        }
      }
      
      console.log(`✅ Migrated ${migrated}/${rows.length} users`);
      
    } finally {
      pgClient.release();
    }
    
  } catch (error) {
    console.error('❌ User migration failed:', error.message);
  }
}

async function migrateAnimes(mysqlConnection, pgPool, limit = 100) {
  console.log(`📺 Migrating animes (first ${limit})...`);
  
  try {
    const [rows] = await mysqlConnection.execute(`
      SELECT * FROM ak_animes ORDER BY id_anime LIMIT ?
    `, [limit]);
    
    console.log(`📊 Found ${rows.length} animes to migrate`);
    
    const pgClient = await pgPool.connect();
    try {
      await pgClient.query('TRUNCATE TABLE ak_animes RESTART IDENTITY CASCADE');
      
      let migrated = 0;
      for (const anime of rows) {
        try {
          await pgClient.query(`
            INSERT INTO ak_animes (
              id_anime, nice_url, titre, realisateur, annee, titre_orig, nb_ep,
              studio, synopsis, doublage, image, sources, nb_reviews, 
              moyennenotes, statut, date_ajout, date_modification
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          `, [
            anime.id_anime,
            anime.nice_url,
            anime.titre,
            anime.realisateur,
            anime.annee,
            anime.titre_orig,
            anime.nb_ep,
            anime.studio,
            anime.synopsis,
            anime.doublage,
            anime.image,
            anime.sources,
            anime.nb_reviews || 0,
            parseFloat(anime.MoyenneNotes) || 0,
            anime.statut || 1,
            anime.date_ajout,
            anime.date_modification
          ]);
          migrated++;
        } catch (error) {
          console.warn(`⚠️  Failed to migrate anime ${anime.titre}:`, error.message);
        }
      }
      
      console.log(`✅ Migrated ${migrated}/${rows.length} animes`);
      
    } finally {
      pgClient.release();
    }
    
  } catch (error) {
    console.error('❌ Anime migration failed:', error.message);
  }
}

async function migrateCritiques(mysqlConnection, pgPool, limit = 100) {
  console.log(`💭 Migrating critiques (first ${limit})...`);
  
  try {
    const [rows] = await mysqlConnection.execute(`
      SELECT * FROM ak_critique ORDER BY id_critique LIMIT ?
    `, [limit]);
    
    console.log(`📊 Found ${rows.length} critiques to migrate`);
    
    const pgClient = await pgPool.connect();
    try {
      await pgClient.query('DELETE FROM ak_critique');
      
      let migrated = 0;
      for (const critique of rows) {
        try {
          await pgClient.query(`
            INSERT INTO ak_critique (
              id_critique, nice_url, titre, critique, notation, date_critique,
              statut, id_membre, id_anime, id_manga
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            critique.id_critique,
            critique.nice_url,
            critique.titre,
            critique.critique,
            critique.notation,
            critique.date_critique,
            critique.statut || 1,
            critique.id_membre,
            critique.id_anime || null,
            critique.id_manga || null
          ]);
          migrated++;
        } catch (error) {
          console.warn(`⚠️  Failed to migrate critique ${critique.titre}:`, error.message);
        }
      }
      
      console.log(`✅ Migrated ${migrated}/${rows.length} critiques`);
      
    } finally {
      pgClient.release();
    }
    
  } catch (error) {
    console.error('❌ Critique migration failed:', error.message);
  }
}

async function showMigrationSummary(pgPool) {
  console.log('📊 Migration Summary:');
  
  const client = await pgPool.connect();
  try {
    const result = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM ak_users) as users,
        (SELECT COUNT(*) FROM ak_animes) as animes,
        (SELECT COUNT(*) FROM ak_mangas) as mangas,
        (SELECT COUNT(*) FROM ak_critique) as critiques
    `);
    
    const counts = result.rows[0];
    console.log(`👥 Users: ${counts.users}`);
    console.log(`📺 Animes: ${counts.animes}`);
    console.log(`📚 Mangas: ${counts.mangas}`);
    console.log(`💭 Critiques: ${counts.critiques}`);
    
    // Show sample users
    console.log('\\n👤 Sample migrated users:');
    const users = await client.query('SELECT username, email FROM ak_users LIMIT 5');
    users.rows.forEach(user => {
      console.log(`  - ${user.username} (${user.email})`);
    });
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    const { mysqlConnection, pgPool } = await connectDatabases();
    
    console.log('\\n🚀 Starting migration...');
    console.log('Database sizes:');
    console.log('- Users: 255');
    console.log('- Animes: 8,117'); 
    console.log('- Mangas: 19,670');
    console.log('- Critiques: 11,581');
    console.log('\\n📋 Migrating sample data for testing...');
    
    // Update PostgreSQL schema
    await updatePostgreSQLSchema(pgPool);
    
    // Migrate sample data (limited amounts for testing)
    await migrateUsers(mysqlConnection, pgPool, 20);
    await migrateAnimes(mysqlConnection, pgPool, 50);
    await migrateCritiques(mysqlConnection, pgPool, 50);
    
    await showMigrationSummary(pgPool);
    
    console.log('\\n🎉 Sample migration completed!');
    console.log('\\n💡 To migrate all data, increase the limits in the script.');
    console.log('\\n🔄 Restart your API server to see the real data:');
    console.log('node server-postgresql.js');
    
    await mysqlConnection.end();
    await pgPool.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { migrateUsers, migrateAnimes, migrateCritiques };