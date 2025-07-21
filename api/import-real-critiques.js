#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');
const { Pool } = require('pg');

console.log('💭 Import Real Critiques from animekunnet');
console.log('========================================');

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

async function importRealCritiques(mysqlConnection, pgPool, limit = 200) {
  console.log(`💭 Importing real critiques from your community...`);
  
  try {
    // Get critiques that match users we have in PostgreSQL
    const [rows] = await mysqlConnection.execute(`
      SELECT c.* FROM ak_critique c
      WHERE c.statut = 1 
      AND c.id_membre IN (SELECT id FROM ak_users WHERE actif = 1)
      ORDER BY c.date_critique DESC 
      LIMIT ${limit}
    `);
    
    console.log(`📊 Found ${rows.length} critiques to migrate`);
    
    const pgClient = await pgPool.connect();
    try {
      // Clear existing test critiques
      await pgClient.query('DELETE FROM ak_critique');
      console.log('🗑️  Cleared test critiques');
      
      let migrated = 0;
      let skipped = 0;
      
      for (const critique of rows) {
        try {
          // Check if user exists in PostgreSQL
          const userCheck = await pgClient.query('SELECT id FROM ak_users WHERE id = $1', [critique.id_membre]);
          if (userCheck.rows.length === 0) {
            skipped++;
            continue;
          }
          
          // Check if anime/manga exists in PostgreSQL (if referenced)
          if (critique.id_anime) {
            const animeCheck = await pgClient.query('SELECT id_anime FROM ak_animes WHERE id_anime = $1', [critique.id_anime]);
            if (animeCheck.rows.length === 0) {
              skipped++;
              continue;
            }
          }
          
          if (critique.id_manga) {
            const mangaCheck = await pgClient.query('SELECT id_manga FROM ak_mangas WHERE id_manga = $1', [critique.id_manga]);
            if (mangaCheck.rows.length === 0) {
              skipped++;
              continue;
            }
          }
          
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
          
          if (migrated % 25 === 0) {
            console.log(`📈 Progress: ${migrated} critiques imported...`);
          }
          
        } catch (error) {
          console.warn(`⚠️  Failed to migrate critique "${critique.titre}": ${error.message}`);
          skipped++;
        }
      }
      
      console.log(`✅ Imported ${migrated}/${rows.length} real critiques`);
      console.log(`⚠️  Skipped ${skipped} critiques (missing users/content)`);
      
    } finally {
      pgClient.release();
    }
    
  } catch (error) {
    console.error('❌ Critique migration failed:', error.message);
  }
}

async function showCritiqueSample(pgPool) {
  console.log('\\n📋 Sample of imported critiques:');
  
  const client = await pgPool.connect();
  try {
    const result = await client.query(`
      SELECT 
        c.titre,
        c.notation,
        COALESCE(u.smfRealName, u.username) as author,
        a.titre as anime_title,
        m.titre as manga_title,
        c.date_critique
      FROM ak_critique c
      JOIN ak_users u ON c.id_membre = u.id
      LEFT JOIN ak_animes a ON c.id_anime = a.id_anime  
      LEFT JOIN ak_mangas m ON c.id_manga = m.id_manga
      ORDER BY c.date_critique DESC
      LIMIT 10
    `);
    
    result.rows.forEach((critique, i) => {
      const content = critique.anime_title || critique.manga_title || 'Unknown';
      const type = critique.anime_title ? '📺' : '📚';
      console.log(`  ${i + 1}. ${type} "${critique.titre}" by ${critique.author} (${critique.notation}/10)`);
      console.log(`      → ${content}`);
    });
    
    const countResult = await client.query('SELECT COUNT(*) as total FROM ak_critique');
    console.log(`\\n📊 Total critiques imported: ${countResult.rows[0].total}`);
    
  } finally {
    client.release();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args[0]) || 100;
  
  try {
    const { mysqlConnection, pgPool } = await connectDatabases();
    
    console.log(`\\n🚀 Importing up to ${limit} real critiques...`);
    console.log('📋 This will replace test data with your actual community reviews');
    
    await importRealCritiques(mysqlConnection, pgPool, limit);
    await showCritiqueSample(pgPool);
    
    console.log('\\n🎉 Real critiques imported successfully!');
    console.log('\\n🔄 Your frontend will now show actual user reviews from animekunnet.com');
    console.log('\\n💡 Usage: node import-real-critiques.js [limit]');
    console.log('   Example: node import-real-critiques.js 500  # Import 500 critiques');
    
    await mysqlConnection.end();
    await pgPool.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}