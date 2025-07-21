#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');

console.log('🗑️  Drop All PostgreSQL Tables');
console.log('==============================');

const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'anime_user',
  password: process.env.DB_PASSWORD || 'anime_password',
  database: process.env.DB_NAME || 'anime_kun',
  port: process.env.DB_PORT || 5432,
};

async function dropAllTables() {
  console.log('🔌 Connecting to PostgreSQL...');
  
  const pool = new Pool(pgConfig);
  const client = await pool.connect();
  
  try {
    // First, get all table names
    console.log('📋 Getting list of all tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    
    if (tables.length === 0) {
      console.log('ℹ️  No tables found - database is already clean');
      return;
    }
    
    console.log(`\n📊 Found ${tables.length} tables to drop:`);
    tables.forEach((table, i) => {
      console.log(`   ${i + 1}. ${table}`);
    });
    
    // Drop all tables with CASCADE to handle foreign key dependencies
    console.log('\n🗑️  Dropping all tables...');
    
    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`   ✅ Dropped: ${table}`);
      } catch (error) {
        console.log(`   ❌ Failed to drop ${table}: ${error.message}`);
      }
    }
    
    // Also drop sequences that might be left behind
    console.log('\n🔢 Dropping sequences...');
    const sequencesResult = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);
    
    for (const seq of sequencesResult.rows) {
      try {
        await client.query(`DROP SEQUENCE IF EXISTS ${seq.sequence_name} CASCADE`);
        console.log(`   ✅ Dropped sequence: ${seq.sequence_name}`);
      } catch (error) {
        console.log(`   ❌ Failed to drop sequence ${seq.sequence_name}: ${error.message}`);
      }
    }
    
    // Verify clean state
    console.log('\n✅ Verifying clean state...');
    const remainingResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    if (remainingResult.rows.length === 0) {
      console.log('🎉 SUCCESS: All tables dropped successfully!');
      console.log('💡 Database is now clean and ready for fresh schema');
    } else {
      console.log(`⚠️  Warning: ${remainingResult.rows.length} tables still remain:`);
      remainingResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

dropAllTables().catch(error => {
  console.error('❌ Failed to drop tables:', error);
  process.exit(1);
});