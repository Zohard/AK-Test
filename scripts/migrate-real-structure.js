#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');
const { Pool } = require('pg');

console.log('🔄 Real Database Structure Migration');
console.log('===================================');

// MySQL configuration
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
    await pgPool.query('SELECT 1');
    console.log('✅ PostgreSQL connected');
    
    return { mysqlConnection, pgPool };
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function recreatePostgreSQLSchema(pgPool) {
  console.log('🔧 Recreating PostgreSQL schema...');
  
  const client = await pgPool.connect();
  try {
    // Drop all existing tables
    await client.query(`
      DROP TABLE IF EXISTS ak_critique CASCADE;
      DROP TABLE IF EXISTS ak_user_anime_list CASCADE;
      DROP TABLE IF EXISTS ak_user_manga_list CASCADE;
      DROP TABLE IF EXISTS ak_business_to_animes CASCADE;
      DROP TABLE IF EXISTS ak_business_to_mangas CASCADE;
      DROP TABLE IF EXISTS ak_tag2fiche CASCADE;
      DROP TABLE IF EXISTS ak_top_list_items CASCADE;
      DROP TABLE IF EXISTS ak_top_lists CASCADE;
      DROP TABLE IF EXISTS ak_animes CASCADE;
      DROP TABLE IF EXISTS ak_mangas CASCADE;
      DROP TABLE IF EXISTS ak_business CASCADE;
      DROP TABLE IF EXISTS ak_tags CASCADE;
      DROP TABLE IF EXISTS ak_users CASCADE;
    `);
    
    // Create new schema with real structure
    const schema = await require('fs').promises.readFile('/home/zohardus/www/ak9project/schema-real-database.sql', 'utf8');
    await client.query(schema);
    
    console.log('✅ PostgreSQL schema recreated');
    
  } catch (error) {
    console.error('❌ Schema recreation failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function migrateUsers(mysqlConnection, pgPool, limit = 50) {
  console.log(`👥 Migrating users (first ${limit})...`);
  
  try {
    const [rows] = await mysqlConnection.execute(`
      SELECT * FROM ak_users 
      WHERE actif = 1 
      ORDER BY dateInscription DESC 
      LIMIT ?
    `, [limit]);
    
    console.log(`📊 Found ${rows.length} users to migrate`);
    
    const pgClient = await pgPool.connect();
    try {
      let migrated = 0;
      
      for (const user of rows) {
        try {
          await pgClient.query(`
            INSERT INTO ak_users (
              id, username, roles, password, email, prenom, nom, avatar,
              dateInscription, derniereConnexion, actif, emailVerified,
              emailVerificationToken, wp_user_id, wp_password_hash, 
              password_sync_needed, bio, dateNaissance, ville, pays,
              smfId, legacyPasswordHash, password_reset_token, 
              password_reset_expires_at, smfPosts, smfRealName,
              smfPersonalText, smfWebsiteTitle, smfWebsiteUrl,
              smfLocation, smfGender, smfBirthdate, smfDateRegistered,
              smfLastLogin, smf_password_hash, smf_avatar
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
          `, [
            user.id,
            user.username,
            JSON.stringify(user.roles || []),
            user.password || 'temp_password',
            user.email,
            user.prenom,
            user.nom,
            user.avatar,
            user.dateInscription,
            user.derniereConnexion,
            user.actif || true,
            user.emailVerified || false,
            user.emailVerificationToken,
            user.wp_user_id,
            user.wp_password_hash,
            user.password_sync_needed || false,
            user.bio,
            user.dateNaissance,
            user.ville,
            user.pays,
            user.smfId,
            user.legacyPasswordHash,
            user.password_reset_token,
            user.password_reset_expires_at,
            user.smfPosts || 0,
            user.smfRealName,
            user.smfPersonalText,
            user.smfWebsiteTitle,
            user.smfWebsiteUrl,
            user.smfLocation,
            user.smfGender,
            user.smfBirthdate,
            user.smfDateRegistered,
            user.smfLastLogin,
            user.smf_password_hash,
            user.smf_avatar
          ]);
          migrated++;
        } catch (error) {
          console.warn(`⚠️  Failed to migrate user ${user.username}: ${error.message}`);
        }
      }
      
      // Update sequence
      await pgClient.query(`SELECT setval('ak_users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ak_users))`);
      
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
      SELECT * FROM ak_animes 
      WHERE statut = 1 
      ORDER BY date_ajout DESC 
      LIMIT ?
    `, [limit]);
    
    console.log(`📊 Found ${rows.length} animes to migrate`);
    
    const pgClient = await pgPool.connect();
    try {
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
          console.warn(`⚠️  Failed to migrate anime ${anime.titre}: ${error.message}`);
        }
      }
      
      // Update sequence
      await pgClient.query(`SELECT setval('ak_animes_id_anime_seq', (SELECT COALESCE(MAX(id_anime), 1) FROM ak_animes))`);
      
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
      SELECT * FROM ak_critique 
      WHERE statut = 1 
      ORDER BY date_critique DESC 
      LIMIT ?
    `, [limit]);
    
    console.log(`📊 Found ${rows.length} critiques to migrate`);
    
    const pgClient = await pgPool.connect();
    try {
      let migrated = 0;
      
      for (const critique of rows) {
        try {
          await pgClient.query(`
            INSERT INTO ak_critique (
              id_critique, nice_url, titre, critique, notation, date_critique,
              statut, questions, accept_images, evaluation, id_membre, 
              id_anime, id_manga, id_ost, id_jeu
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          `, [
            critique.id_critique,
            critique.nice_url,
            critique.titre,
            critique.critique,
            critique.notation,
            critique.date_critique,
            critique.statut || 1,
            critique.questions,
            critique.accept_images,
            critique.evaluation,
            critique.id_membre,
            critique.id_anime || null,
            critique.id_manga || null,
            critique.id_ost || null,
            critique.id_jeu || null
          ]);
          migrated++;
        } catch (error) {
          console.warn(`⚠️  Failed to migrate critique ${critique.titre}: ${error.message}`);
        }
      }
      
      // Update sequence
      await pgClient.query(`SELECT setval('ak_critique_id_critique_seq', (SELECT COALESCE(MAX(id_critique), 1) FROM ak_critique))`);
      
      console.log(`✅ Migrated ${migrated}/${rows.length} critiques`);
      
    } finally {
      pgClient.release();
    }
    
  } catch (error) {
    console.error('❌ Critique migration failed:', error.message);
  }
}

async function showMigrationSummary(pgPool) {
  console.log('\\n📊 Migration Summary:');
  
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
    
    // Show sample users with real names
    console.log('\\n👤 Sample migrated users:');
    const users = await client.query(`
      SELECT username, email, smfRealName, smfPosts 
      FROM ak_users 
      WHERE username IS NOT NULL 
      ORDER BY smfPosts DESC NULLS LAST
      LIMIT 5
    `);
    
    users.rows.forEach(user => {
      const displayName = user.smfrealname || user.username;
      console.log(`  - ${displayName} (@${user.username}) - ${user.smfposts || 0} posts`);
    });
    
    // Show sample critiques with real usernames
    console.log('\\n💭 Sample critiques:');
    const critiques = await client.query(`
      SELECT c.titre, u.username, u.smfRealName, c.notation
      FROM ak_critique c
      JOIN ak_users u ON c.id_membre = u.id
      ORDER BY c.date_critique DESC
      LIMIT 5
    `);
    
    critiques.rows.forEach(critique => {
      const author = critique.smfrealname || critique.username;
      console.log(`  - "${critique.titre}" by ${author} (${critique.notation}/10)`);
    });
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    const { mysqlConnection, pgPool } = await connectDatabases();
    
    console.log('\\n🚀 Starting real data migration...');
    
    // Recreate schema to match real structure
    await recreatePostgreSQLSchema(pgPool);
    
    // Migrate data
    await migrateUsers(mysqlConnection, pgPool, 30);
    await migrateAnimes(mysqlConnection, pgPool, 50);
    await migrateCritiques(mysqlConnection, pgPool, 50);
    
    await showMigrationSummary(pgPool);
    
    console.log('\\n🎉 Migration completed!');
    console.log('\\n🔄 Next steps:');
    console.log('1. Update API server to use new user structure');
    console.log('2. Restart API: node server-postgresql.js');  
    console.log('3. Test frontend with real user data');
    
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