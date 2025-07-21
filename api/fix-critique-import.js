#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');
const { Pool } = require('pg');

console.log('🔧 Fix Critique Import - Find Matching Data');
console.log('==========================================');

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

async function analyzeData(mysqlConnection, pgPool) {
  console.log('\n🔍 Analyzing available data...');
  
  const pgClient = await pgPool.connect();
  try {
    // Check what users we have in PostgreSQL
    const pgUsersResult = await pgClient.query('SELECT MIN(id) as min_id, MAX(id) as max_id, COUNT(*) as total FROM ak_users');
    const pgUsers = pgUsersResult.rows[0];
    console.log(`📊 PostgreSQL users: ${pgUsers.total} (IDs: ${pgUsers.min_id}-${pgUsers.max_id})`);
    
    // Check what animes we have in PostgreSQL  
    const pgAnimesResult = await pgClient.query('SELECT MIN(id_anime) as min_id, MAX(id_anime) as max_id, COUNT(*) as total FROM ak_animes');
    const pgAnimes = pgAnimesResult.rows[0];
    console.log(`📊 PostgreSQL animes: ${pgAnimes.total} (IDs: ${pgAnimes.min_id}-${pgAnimes.max_id})`);
    
    // Get specific user IDs in PostgreSQL
    const userIdsResult = await pgClient.query('SELECT id FROM ak_users ORDER BY id LIMIT 10');
    const userIds = userIdsResult.rows.map(row => row.id);
    console.log(`👥 Sample user IDs: [${userIds.join(', ')}]`);
    
    // Get specific anime IDs in PostgreSQL
    const animeIdsResult = await pgClient.query('SELECT id_anime FROM ak_animes ORDER BY id_anime LIMIT 10');
    const animeIds = animeIdsResult.rows.map(row => row.id_anime);
    console.log(`📺 Sample anime IDs: [${animeIds.join(', ')}]`);
    
    return { userIds, animeIds };
    
  } finally {
    pgClient.release();
  }
}

async function findMatchingCritiques(mysqlConnection, userIds, animeIds, limit = 100) {
  console.log('\n🎯 Finding critiques that match our PostgreSQL data...');
  
  try {
    // Try different strategies to find importable critiques
    console.log('🔍 Strategy 1: Find critiques from our users...');
    const userIdsList = userIds.join(',');
    
    const [userCritiques] = await mysqlConnection.execute(`
      SELECT c.*, u.username, a.titre as anime_title
      FROM ak_critique c
      JOIN ak_users u ON c.id_membre = u.id
      LEFT JOIN ak_animes a ON c.id_anime = a.id_anime
      WHERE c.statut = 1 
      AND c.id_membre IN (${userIdsList})
      ORDER BY c.date_critique DESC 
      LIMIT 20
    `);
    
    console.log(`   Found ${userCritiques.length} critiques from our users`);
    
    if (userCritiques.length === 0) {
      console.log('🔍 Strategy 2: Find critiques for our animes...');
      const animeIdsList = animeIds.join(',');
      
      const [animeCritiques] = await mysqlConnection.execute(`
        SELECT c.*, u.username, a.titre as anime_title
        FROM ak_critique c
        JOIN ak_users u ON c.id_membre = u.id
        LEFT JOIN ak_animes a ON c.id_anime = a.id_anime
        WHERE c.statut = 1 
        AND c.id_anime IN (${animeIdsList})
        ORDER BY c.date_critique DESC 
        LIMIT 20
      `);
      
      console.log(`   Found ${animeCritiques.length} critiques for our animes`);
      
      if (animeCritiques.length === 0) {
        console.log('🔍 Strategy 3: Find general critiques (no anime/manga link)...');
        
        const [generalCritiques] = await mysqlConnection.execute(`
          SELECT c.*, u.username, null as anime_title
          FROM ak_critique c
          JOIN ak_users u ON c.id_membre = u.id
          WHERE c.statut = 1 
          AND c.id_anime IS NULL 
          AND c.id_manga IS NULL
          ORDER BY c.date_critique DESC 
          LIMIT 50
        `);
        
        console.log(`   Found ${generalCritiques.length} general critiques`);
        return generalCritiques.slice(0, limit);
      }
      
      return animeCritiques.slice(0, limit);
    }
    
    return userCritiques.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Failed to find matching critiques:', error.message);
    return [];
  }
}

async function importMatchingCritiques(pgPool, critiques) {
  console.log(`\n⚡ Importing ${critiques.length} matching critiques...`);
  
  const pgClient = await pgPool.connect();
  try {
    // Clear existing critiques
    await pgClient.query('DELETE FROM ak_critique');
    console.log('🗑️  Cleared existing critiques');
    
    let imported = 0;
    let skipped = 0;
    const createdUsers = new Set();
    
    for (const critique of critiques) {
      try {
        // Check if user exists, if not create a simple version
        const userCheck = await pgClient.query('SELECT id FROM ak_users WHERE id = $1', [critique.id_membre]);
        if (userCheck.rows.length === 0) {
          if (!createdUsers.has(critique.id_membre)) {
            try {
              await pgClient.query(`
                INSERT INTO ak_users (id, username, actif) VALUES ($1, $2, 1)
                ON CONFLICT (id) DO NOTHING
              `, [critique.id_membre, critique.username || `user_${critique.id_membre}`]);
              createdUsers.add(critique.id_membre);
              console.log(`👤 Created user: ${critique.username || `user_${critique.id_membre}`}`);
            } catch (userError) {
              console.warn(`⚠️  Could not create user ${critique.id_membre}: ${userError.message}`);
            }
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
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`📈 Progress: ${imported} critiques imported...`);
        }
        
      } catch (error) {
        console.warn(`⚠️  Failed to import critique "${critique.titre}": ${error.message}`);
        skipped++;
      }
    }
    
    console.log(`✅ Successfully imported ${imported}/${critiques.length} critiques`);
    if (createdUsers.size > 0) {
      console.log(`👥 Created ${createdUsers.size} new users for critiques`);
    }
    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped} critiques due to constraints`);
    }
    
    return imported;
    
  } finally {
    pgClient.release();
  }
}

async function showFinalResults(pgPool) {
  console.log('\n🎊 Final Results:');
  
  const client = await pgPool.connect();
  try {
    const result = await client.query(`
      SELECT 
        c.titre,
        c.notation,
        COALESCE(u.smfRealName, u.username) as author,
        a.titre as anime_title,
        c.date_critique
      FROM ak_critique c
      JOIN ak_users u ON c.id_membre = u.id
      LEFT JOIN ak_animes a ON c.id_anime = a.id_anime  
      ORDER BY c.date_critique DESC
      LIMIT 10
    `);
    
    result.rows.forEach((critique, i) => {
      const content = critique.anime_title || 'General Review';
      const type = critique.anime_title ? '📺' : '💭';
      console.log(`  ${i + 1}. ${type} "${critique.titre}" by ${critique.author} (${critique.notation}/10)`);
      console.log(`      → ${content}`);
    });
    
    const countResult = await client.query('SELECT COUNT(*) as total FROM ak_critique');
    console.log(`\n📊 Total critiques in PostgreSQL: ${countResult.rows[0].total}`);
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    const { mysqlConnection, pgPool } = await connectDatabases();
    
    const { userIds, animeIds } = await analyzeData(mysqlConnection, pgPool);
    
    const matchingCritiques = await findMatchingCritiques(mysqlConnection, userIds, animeIds, 200);
    
    if (matchingCritiques.length > 0) {
      const imported = await importMatchingCritiques(pgPool, matchingCritiques);
      await showFinalResults(pgPool);
      
      if (imported > 0) {
        console.log('\n🎉 Success! Your frontend now shows real critiques from animekunnet users!');
      }
    } else {
      console.log('\n😔 No matching critiques found. You may need to import more users or animes first.');
    }
    
    await mysqlConnection.end();
    await pgPool.end();
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}