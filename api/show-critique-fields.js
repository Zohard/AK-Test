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
  console.log('📋 PostgreSQL ak_critique Table Structure');
  console.log('=========================================');
  
  const pool = new Pool(pgConfig);
  const client = await pool.connect();
  
  try {
    // Get table structure
    const structureResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'ak_critique' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🗂️  Table Structure:');
    console.log('┌─────────────────────────┬─────────────────┬──────────┬─────────────────┬────────────┐');
    console.log('│ Column Name             │ Data Type       │ Nullable │ Default         │ Max Length │');
    console.log('├─────────────────────────┼─────────────────┼──────────┼─────────────────┼────────────┤');
    
    structureResult.rows.forEach(column => {
      const name = column.column_name.padEnd(23);
      const type = column.data_type.padEnd(15);
      const nullable = column.is_nullable.padEnd(8);
      const defaultVal = (column.column_default || 'NULL').padEnd(15);
      const maxLen = (column.character_maximum_length || 'N/A').toString().padEnd(10);
      console.log(`│ ${name} │ ${type} │ ${nullable} │ ${defaultVal} │ ${maxLen} │`);
    });
    
    console.log('└─────────────────────────┴─────────────────┴──────────┴─────────────────┴────────────┘');
    
    // Show sample data
    const sampleResult = await client.query(`
      SELECT * FROM ak_critique LIMIT 1
    `);
    
    if (sampleResult.rows.length > 0) {
      console.log('\n📄 Sample Record:');
      const sample = sampleResult.rows[0];
      Object.keys(sample).forEach(field => {
        let value = sample[field];
        if (typeof value === 'string' && value.length > 100) {
          value = value.substring(0, 97) + '...';
        }
        console.log(`   ${field}: ${value}`);
      });
    }
    
    // Show constraints
    const constraintsResult = await client.query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'ak_critique'
      ORDER BY tc.constraint_type, tc.constraint_name
    `);
    
    if (constraintsResult.rows.length > 0) {
      console.log('\n🔗 Table Constraints:');
      constraintsResult.rows.forEach(constraint => {
        console.log(`   ${constraint.constraint_type}: ${constraint.constraint_name}`);
        if (constraint.foreign_table_name) {
          console.log(`      ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
        } else {
          console.log(`      Column: ${constraint.column_name}`);
        }
      });
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);