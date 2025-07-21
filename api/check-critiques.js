#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');

const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'anime_user',
  password: process.env.DB_PASSWORD || 'anime_password',
  database: process.env.DB_NAME || 'anime_kun',
  port: process.env.DB_PORT || 5432,
};

async function main() {
  console.log('🔍 Checking PostgreSQL critique data...');
  
  const pool = new Pool(pgConfig);
  const client = await pool.connect();
  
  try {
    // Check critiques table
    const critiquesResult = await client.query('SELECT COUNT(*) FROM ak_critique');
    console.log(`📝 Total critiques: ${critiquesResult.rows[0].count}`);
    
    if (critiquesResult.rows[0].count > 0) {
      // Show sample critiques
      const sampleResult = await client.query(`
        SELECT id_critique, titre, notation, id_membre, date_critique
        FROM ak_critique 
        ORDER BY id_critique 
        LIMIT 5
      `);
      
      console.log('\n📋 Sample critiques:');
      sampleResult.rows.forEach((critique, i) => {
        console.log(`  ${i + 1}. "${critique.titre}" - Rating: ${critique.notation}/10`);
        console.log(`      User ID: ${critique.id_membre}, Date: ${critique.date_critique}`);
      });
    }
    
    // Check users table
    const usersResult = await client.query('SELECT COUNT(*) FROM ak_users');
    console.log(`\n👥 Total users: ${usersResult.rows[0].count}`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);