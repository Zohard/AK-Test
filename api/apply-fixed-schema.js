#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;

console.log('🗄️  Apply Fixed PostgreSQL Schema');
console.log('==================================');

const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'anime_user',
  password: process.env.DB_PASSWORD || 'anime_password',
  database: process.env.DB_NAME || 'anime_kun',
  port: process.env.DB_PORT || 5432,
};

async function applyFixedSchema() {
  console.log('🔌 Connecting to PostgreSQL...');
  
  const pool = new Pool(pgConfig);
  const client = await pool.connect();
  
  try {
    // Read the fixed schema
    console.log('📖 Reading fixed schema...');
    const schemaSQL = await fs.readFile('fixed-postgresql-schema.sql', 'utf8');
    
    // Execute the entire schema as one transaction
    console.log('⚡ Executing schema...');
    await client.query('BEGIN');
    
    try {
      await client.query(schemaSQL);
      await client.query('COMMIT');
      console.log('✅ Schema applied successfully!');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Schema execution failed:', error.message);
      
      // Try executing statement by statement for better error reporting
      console.log('\n🔍 Trying statement by statement...');
      
      const statements = schemaSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));
      
      let executed = 0;
      let failed = 0;
      
      for (const stmt of statements) {
        if (!stmt) continue;
        
        try {
          await client.query(stmt);
          
          // Log successful operations
          if (stmt.toUpperCase().includes('CREATE TABLE')) {
            const tableName = stmt.match(/CREATE TABLE (\w+)/i)?.[1];
            console.log(`   ✅ Created table: ${tableName}`);
          }
          executed++;
          
        } catch (stmtError) {
          console.log(`   ❌ Failed: ${stmtError.message}`);
          if (stmt.length < 100) {
            console.log(`      Statement: ${stmt}`);
          }
          failed++;
        }
      }
      
      console.log(`\n📊 Results: ${executed} executed, ${failed} failed`);
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying database structure...');
    const result = await client.query(`
      SELECT t.table_name,
             COUNT(c.column_name) as column_count
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name
      ORDER BY t.table_name
    `);
    
    console.log(`\n📋 Created ${result.rows.length} tables:`);
    result.rows.forEach((table, i) => {
      console.log(`   ${i + 1}. ${table.table_name} (${table.column_count} columns)`);
    });
    
    if (result.rows.length > 0) {
      console.log('\n🎉 PostgreSQL schema is ready!');
      console.log('✅ Ready for data import');
      
      // Show table sizes
      const sizeResult = await client.query(`
        SELECT schemaname, tablename, 
               pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `);
      
      console.log('\n📊 Table sizes:');
      sizeResult.rows.forEach(row => {
        console.log(`   ${row.tablename}: ${row.size}`);
      });
      
    } else {
      console.log('\n❌ No tables created - schema application failed');
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

applyFixedSchema().catch(console.error);