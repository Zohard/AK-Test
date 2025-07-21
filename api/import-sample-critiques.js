#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');
const { Pool } = require('pg');

console.log('📝 Import Sample Real Critiques');
console.log('===============================');

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

async function getPopularCritiques(mysqlConnection, limit = 20) {
  console.log(`\n📊 Finding ${limit} popular critiques from your community...`);
  
  try {
    const [rows] = await mysqlConnection.execute(`
      SELECT 
        c.*,
        u.username,
        u.smfRealName,
        u.smfPosts,
        a.titre as anime_title,
        a.image as anime_image,
        m.titre as manga_title
      FROM ak_critique c
      JOIN ak_users u ON c.id_membre = u.id
      LEFT JOIN ak_animes a ON c.id_anime = a.id_anime
      LEFT JOIN ak_mangas m ON c.id_manga = m.id_manga
      WHERE c.statut = 1 
      AND u.actif = 1
      AND c.critique IS NOT NULL
      AND LENGTH(c.critique) > 100
      ORDER BY c.notation DESC, u.smfPosts DESC, c.date_critique DESC
      LIMIT ${limit}
    `);
    
    console.log(`🎉 Found ${rows.length} high-quality critiques!`);
    
    if (rows.length > 0) {
      console.log('\n📋 Sample critiques to import:');
      rows.slice(0, 5).forEach((critique, i) => {
        const content = critique.anime_title || critique.manga_title || 'General';
        const type = critique.anime_title ? '📺' : critique.manga_title ? '📚' : '💭';
        console.log(`  ${i + 1}. ${type} "${critique.titre}" by ${critique.username} (${critique.notation}/10)`);
        console.log(`      → ${content}`);
      });
    }
    
    return rows;
    
  } catch (error) {
    console.error('❌ Failed to get critiques:', error.message);
    return [];
  }
}

async function importCritiquesWithUsers(pgPool, critiques) {
  console.log(`\n⚡ Importing ${critiques.length} critiques with their users...`);
  
  const pgClient = await pgPool.connect();
  try {
    // Clear existing critiques and users
    await pgClient.query('DELETE FROM ak_critique');
    await pgClient.query('DELETE FROM ak_users');
    console.log('🗑️  Cleared existing data');
    
    let usersCreated = 0;
    let critiquesImported = 0;
    const processedUsers = new Set();
    
    for (const critique of critiques) {
      try {
        // Create user if not already processed
        if (!processedUsers.has(critique.id_membre)) {
          await pgClient.query(`
            INSERT INTO ak_users (
              id, username, email, password, actif
            ) VALUES ($1, $2, $3, 'dummy_password', true)
            ON CONFLICT (id) DO NOTHING
          `, [
            critique.id_membre,
            critique.username || `user_${critique.id_membre}`,
            `${critique.username || 'user' + critique.id_membre}@animekunnet.com`
          ]);
          processedUsers.add(critique.id_membre);
          usersCreated++;
          console.log(`👤 Created user: ${critique.username} (ID: ${critique.id_membre})`);
        }
        
        // Import the critique (without foreign key references to avoid constraint violations)
        await pgClient.query(`
          INSERT INTO ak_critique (
            id_critique, nice_url, titre, critique, notation, date_critique,
            statut, questions, accept_images, evaluation, id_membre
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          critique.id_critique,
          critique.nice_url,
          critique.titre || 'Imported Review',
          critique.critique,
          critique.notation,
          critique.date_critique,
          critique.statut || 1,
          critique.questions,
          critique.accept_images,
          critique.evaluation,
          critique.id_membre
        ]);
        
        critiquesImported++;
        
        if (critiquesImported % 5 === 0) {
          console.log(`📈 Progress: ${critiquesImported} critiques imported...`);
        }
        
      } catch (error) {
        console.warn(`⚠️  Failed to process critique "${critique.titre}": ${error.message}`);
      }
    }
    
    console.log(`✅ Successfully imported ${critiquesImported} critiques`);
    console.log(`👥 Created ${usersCreated} users`);
    
    return { critiquesImported, usersCreated };
    
  } finally {
    pgClient.release();
  }
}

async function showResults(pgPool) {
  console.log('\n🎊 Import Results:');
  
  const client = await pgPool.connect();
  try {
    const critiqueResult = await client.query(`
      SELECT 
        c.titre,
        c.notation,
        u.username as author,
        c.date_critique,
        LEFT(c.critique, 100) as preview
      FROM ak_critique c
      JOIN ak_users u ON c.id_membre = u.id
      ORDER BY c.notation DESC
      LIMIT 10
    `);
    
    console.log('\n🌟 Top critiques by rating:');
    critiqueResult.rows.forEach((critique, i) => {
      console.log(`  ${i + 1}. "${critique.titre}" by ${critique.author} (${critique.notation}/10)`);
      console.log(`      "${critique.preview}..."`);
    });
    
    const statsResult = await client.query(`
      SELECT 
        COUNT(c.*) as total_critiques,
        COUNT(DISTINCT c.id_membre) as unique_users,
        AVG(c.notation)::NUMERIC(3,1) as avg_rating
      FROM ak_critique c
    `);
    
    const stats = statsResult.rows[0];
    console.log(`\n📊 Statistics:`);
    console.log(`   📝 Total critiques: ${stats.total_critiques}`);
    console.log(`   👥 Unique users: ${stats.unique_users}`);
    console.log(`   ⭐ Average rating: ${stats.avg_rating}/10`);
    
  } finally {
    client.release();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args[0]) || 20;
  
  try {
    const { mysqlConnection, pgPool } = await connectDatabases();
    
    console.log(`\n🚀 Importing ${limit} real critiques with their users...`);
    
    const critiques = await getPopularCritiques(mysqlConnection, limit);
    
    if (critiques.length > 0) {
      const { critiquesImported, usersCreated } = await importCritiquesWithUsers(pgPool, critiques);
      
      if (critiquesImported > 0) {
        await showResults(pgPool);
        console.log('\n🎉 Success! Your frontend now shows real critiques from animekunnet!');
        console.log('\n🔄 Visit http://localhost:3000 to see the imported critiques');
      }
    } else {
      console.log('\n😔 No critiques found to import');
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