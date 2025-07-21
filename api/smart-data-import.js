#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');
const { Pool } = require('pg');

console.log('🧠 Smart Data Import (with error handling)');
console.log('==========================================');

const mysqlConfig = {
  host: '127.0.0.1',
  user: 'animekunnet',
  password: 'animekun77',
  database: 'animekunnet',
  port: 3306,
};

const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'anime_user',
  password: process.env.DB_PASSWORD || 'anime_password',
  database: process.env.DB_NAME || 'anime_kun',
  port: process.env.DB_PORT || 5432,
};

// Import core tables first (without FK constraints)
const coreImportOrder = [
  'ak_users',      // 255 rows - base for all FK
  'ak_tags',       // 194 rows - standalone
  'ak_business'    // 18,975 rows - studios/publishers
];

// Import content tables 
const contentImportOrder = [
  'ak_animes',     // 8,117 rows
  'ak_mangas'      // 19,670 rows
];

// Import relationship tables with smart FK handling
const relationshipTables = [
  'ak_critique',               // User reviews - references users, animes, mangas
  'ak_business_to_animes',     // Anime-studio relationships
  'ak_business_to_mangas'      // Manga-publisher relationships
];

function sanitizeValue(value, columnName) {
  if (value === null || value === undefined) return null;
  
  // Handle invalid MySQL dates
  if (typeof value === 'string') {
    if (value === '0000-00-00 00:00:00' || value === '0000-00-00') {
      return null;
    }
    // Handle malformed dates
    if (columnName.includes('date') && value.includes('NaN')) {
      return null;
    }
  }
  
  // Handle Date objects
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value;
  }
  
  return value;
}

async function smartImportTable(tableName, mysqlConnection, pgPool, limit = null) {
  console.log(`\n📋 Smart importing ${tableName}...`);
  
  const pgClient = await pgPool.connect();
  
  try {
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
    const [countResult] = await mysqlConnection.execute(countQuery);
    const totalRows = countResult[0].total;
    
    if (totalRows === 0) {
      console.log(`   ℹ️  ${tableName} is empty`);
      return { imported: 0, errors: 0 };
    }
    
    const actualLimit = limit || totalRows;
    console.log(`   📊 Importing ${Math.min(actualLimit, totalRows)} of ${totalRows} rows`);
    
    // Get column info
    const [columns] = await mysqlConnection.execute(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'animekunnet' AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [tableName]);
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    
    // Clear existing data
    await pgClient.query(`DELETE FROM ${tableName}`);
    
    // Get data with limit
    let dataQuery = `SELECT * FROM ${tableName}`;
    if (limit) {
      dataQuery += ` LIMIT ${limit}`;
    }
    
    const [rows] = await mysqlConnection.execute(dataQuery);
    
    let imported = 0;
    let errors = 0;
    
    // Import row by row with error handling
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const values = columnNames.map(col => sanitizeValue(row[col], col));
        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
        const insertQuery = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders})`;
        
        await pgClient.query(insertQuery, values);
        imported++;
        
      } catch (error) {
        errors++;
        
        // Skip foreign key constraint violations for relationship tables
        if (error.message.includes('violates foreign key constraint')) {
          // This is expected for some relationship data
        } else if (errors <= 5) {
          console.log(`   ⚠️  Row ${i}: ${error.message}`);
        }
      }
      
      // Progress indicator
      if ((i + 1) % 1000 === 0 || (i + 1) === rows.length) {
        const progress = Math.round(((i + 1) / rows.length) * 100);
        console.log(`   📈 Progress: ${progress}% (${imported} imported, ${errors} errors)`);
      }
    }
    
    console.log(`   ✅ ${tableName}: ${imported}/${rows.length} imported (${errors} errors)`);
    return { imported, errors, total: rows.length };
    
  } finally {
    pgClient.release();
  }
}

async function runSmartImport() {
  console.log('🚀 Starting smart import...\n');
  
  const mysqlConnection = await mysql.createConnection(mysqlConfig);
  const pgPool = new Pool(pgConfig);
  
  try {
    console.log('🔌 Connected to both databases');
    
    const results = {};
    let totalImported = 0;
    let totalErrors = 0;
    
    // Phase 1: Import core tables (no FK dependencies)
    console.log('\n📌 PHASE 1: Core Tables');
    for (const table of coreImportOrder) {
      const result = await smartImportTable(table, mysqlConnection, pgPool);
      results[table] = result;
      totalImported += result.imported;
      totalErrors += result.errors;
    }
    
    // Phase 2: Import content tables (limited for initial testing)
    console.log('\n📌 PHASE 2: Content Tables (Limited)');
    for (const table of contentImportOrder) {
      const result = await smartImportTable(table, mysqlConnection, pgPool, 5000); // Limit to 5k each
      results[table] = result;
      totalImported += result.imported;
      totalErrors += result.errors;
    }
    
    // Phase 3: Import relationship tables (limited)
    console.log('\n📌 PHASE 3: Relationships (Limited)');
    for (const table of relationshipTables) {
      const result = await smartImportTable(table, mysqlConnection, pgPool, 2000); // Limit to 2k each
      results[table] = result;
      totalImported += result.imported;
      totalErrors += result.errors;
    }
    
    // Summary
    console.log('\n📊 SMART IMPORT SUMMARY');
    console.log('=======================');
    
    Object.entries(results).forEach(([table, result]) => {
      const success = result.imported;
      const total = result.total || result.imported;
      const errorRate = total > 0 ? Math.round((result.errors / total) * 100) : 0;
      console.log(`${table.padEnd(25)}: ${success.toString().padStart(5)}/${total.toString().padStart(5)} imported (${errorRate}% error rate)`);
    });
    
    console.log(`\n🎯 TOTALS: ${totalImported} imported, ${totalErrors} errors`);
    
    // Verify key tables
    console.log('\n🔍 Verification:');
    const pgClient = await pgPool.connect();
    try {
      const keyTables = ['ak_users', 'ak_animes', 'ak_mangas', 'ak_critique'];
      for (const table of keyTables) {
        const result = await pgClient.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   ${table}: ${result.rows[0].count} rows`);
      }
    } finally {
      pgClient.release();
    }
    
    if (totalImported > 0) {
      console.log('\n🎉 Smart import completed!');
      console.log('✅ Database ready with core animekunnet data');
      console.log('💡 To import full dataset, run without limits');
    }
    
  } finally {
    await mysqlConnection.end();
    await pgPool.end();
  }
}

runSmartImport().catch(console.error);