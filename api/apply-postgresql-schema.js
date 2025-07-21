#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;

console.log('🗄️  Apply PostgreSQL Schema to Database');
console.log('========================================');

const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'anime_user',
  password: process.env.DB_PASSWORD || 'anime_password',
  database: process.env.DB_NAME || 'anime_kun',
  port: process.env.DB_PORT || 5432,
};

async function applySchema() {
  console.log('🔌 Connecting to PostgreSQL...');
  
  const pool = new Pool(pgConfig);
  const client = await pool.connect();
  
  try {
    // Read the generated schema
    console.log('📖 Reading schema file...');
    const schemaSQL = await fs.readFile('complete-postgresql-schema.sql', 'utf8');
    
    // Split into individual statements
    const statements = schemaSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n')
      .split(';')
      .filter(stmt => stmt.trim() !== '');
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    
    let executed = 0;
    let failed = 0;
    
    for (const statement of statements) {
      const trimmedStmt = statement.trim();
      if (!trimmedStmt) continue;
      
      try {
        await client.query(trimmedStmt);
        
        // Determine what type of statement this is
        const stmtType = trimmedStmt.substring(0, 20).toUpperCase();
        if (stmtType.includes('CREATE TABLE')) {
          const tableName = trimmedStmt.match(/CREATE TABLE (\w+)/i)?.[1];
          console.log(`   ✅ Created table: ${tableName}`);
        } else if (stmtType.includes('CREATE INDEX')) {
          const indexName = trimmedStmt.match(/CREATE (?:UNIQUE )?INDEX (\w+)/i)?.[1];
          console.log(`   🔗 Created index: ${indexName}`);
        } else if (stmtType.includes('ALTER TABLE')) {
          const tableName = trimmedStmt.match(/ALTER TABLE (\w+)/i)?.[1];
          console.log(`   🔗 Added constraint to: ${tableName}`);
        } else if (stmtType.includes('CREATE SCHEMA')) {
          console.log(`   📁 Created schema: public`);
        }
        
        executed++;
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        // Log the problematic statement for debugging
        if (trimmedStmt.length < 200) {
          console.log(`      Statement: ${trimmedStmt}`);
        }
        failed++;
      }
    }
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`   ✅ Executed: ${executed} statements`);
    console.log(`   ❌ Failed: ${failed} statements`);
    
    // Verify created tables
    console.log('\n🔍 Verifying created tables...');
    const result = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Created ${result.rows.length} tables:`);
    result.rows.forEach((table, i) => {
      console.log(`   ${i + 1}. ${table.table_name} (${table.column_count} columns)`);
    });
    
    if (result.rows.length > 0) {
      console.log('\n🎉 PostgreSQL schema applied successfully!');
      console.log('✅ Database is ready for data import');
    } else {
      console.log('\n❌ No tables were created - check for errors above');
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

applySchema().catch(console.error);