#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const fs = require('fs').promises;

console.log('📥 Comprehensive Data Import from MySQL to PostgreSQL');
console.log('====================================================');

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

// Import order to respect foreign key dependencies
const importOrder = [
  { table: 'ak_users', priority: 1, description: 'User accounts (SMF integrated)' },
  { table: 'ak_animes', priority: 2, description: 'Anime database' },
  { table: 'ak_mangas', priority: 3, description: 'Manga database' },
  { table: 'ak_business', priority: 4, description: 'Studios and publishers' },
  { table: 'ak_tags', priority: 5, description: 'Content tags' },
  { table: 'ak_critique', priority: 6, description: 'User reviews and critiques' },
  { table: 'ak_business_to_animes', priority: 7, description: 'Anime-business relationships' },
  { table: 'ak_business_to_mangas', priority: 8, description: 'Manga-business relationships' },
  { table: 'ak_tag2fiche', priority: 9, description: 'Tag-content relationships' },
  { table: 'ak_user_anime_list', priority: 10, description: 'User anime lists' },
  { table: 'ak_user_manga_list', priority: 11, description: 'User manga lists' },
  { table: 'ak_top_lists', priority: 12, description: 'User top lists' },
  { table: 'ak_top_list_items', priority: 13, description: 'Top list items' },
  { table: 'ak_anime_screenshots', priority: 14, description: 'Anime screenshots' }
];

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

async function getTableStats(mysqlConnection) {
  console.log('📊 Getting table statistics...');
  
  const [stats] = await mysqlConnection.execute(`
    SELECT TABLE_NAME, TABLE_ROWS, 
           ROUND(DATA_LENGTH/1024) as DATA_KB,
           ROUND(INDEX_LENGTH/1024) as INDEX_KB
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = 'animekunnet'
    ORDER BY TABLE_ROWS DESC
  `);
  
  const tableStats = {};
  stats.forEach(stat => {
    tableStats[stat.TABLE_NAME] = {
      rows: stat.TABLE_ROWS || 0,
      dataKB: stat.DATA_KB || 0,
      indexKB: stat.INDEX_KB || 0
    };
  });
  
  return tableStats;
}

async function importTable(tableName, mysqlConnection, pgPool, batchSize = 1000) {
  console.log(`\n📋 Importing ${tableName}...`);
  
  const pgClient = await pgPool.connect();
  
  try {
    // Get total count
    const [countResult] = await mysqlConnection.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
    const totalRows = countResult[0].total;
    
    if (totalRows === 0) {
      console.log(`   ℹ️  ${tableName} is empty - skipping`);
      return { imported: 0, skipped: 0, errors: 0 };
    }
    
    console.log(`   📊 Total rows to import: ${totalRows}`);
    
    // Get column info
    const [columns] = await mysqlConnection.execute(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'animekunnet' AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [tableName]);
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    const placeholders = columnNames.map((_, i) => `$${i + 1}`).join(', ');
    const insertQuery = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders})`;
    
    // Clear existing data
    await pgClient.query(`DELETE FROM ${tableName}`);
    console.log(`   🗑️  Cleared existing data`);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    let offset = 0;
    
    // Import in batches
    while (offset < totalRows) {
      const [rows] = await mysqlConnection.execute(`
        SELECT * FROM ${tableName} 
        LIMIT ${batchSize} OFFSET ${offset}
      `);
      
      if (rows.length === 0) break;
      
      // Process batch
      for (const row of rows) {
        try {
          const values = columnNames.map(col => {
            let value = row[col];
            
            // Handle special values
            if (value === null) return null;
            if (value instanceof Date) return value;
            if (typeof value === 'string') {
              // Handle invalid MySQL dates
              if (value === '0000-00-00 00:00:00' || value === '0000-00-00') {
                return null;
              }
            }
            
            return value;
          });
          
          await pgClient.query(insertQuery, values);
          imported++;
          
        } catch (error) {
          errors++;
          if (errors <= 3) { // Show first few errors
            console.log(`   ⚠️  Import error: ${error.message}`);
          }
        }
      }
      
      offset += batchSize;
      
      // Progress indicator
      const progress = Math.round((offset / totalRows) * 100);
      if (offset % (batchSize * 10) === 0 || offset >= totalRows) {
        console.log(`   📈 Progress: ${progress}% (${imported} imported, ${errors} errors)`);
      }
    }
    
    console.log(`   ✅ ${tableName}: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    return { imported, skipped, errors };
    
  } finally {
    pgClient.release();
  }
}

async function runComprehensiveImport() {
  console.log('🚀 Starting comprehensive import...\n');
  
  const { mysqlConnection, pgPool } = await connectDatabases();
  const tableStats = await getTableStats(mysqlConnection);
  
  const importResults = {};
  const startTime = Date.now();
  
  try {
    // Sort tables by import priority
    const sortedTables = importOrder.sort((a, b) => a.priority - b.priority);
    
    console.log('\n📋 Import Plan:');
    sortedTables.forEach((table, i) => {
      const stats = tableStats[table.table] || { rows: 0 };
      console.log(`   ${i + 1}. ${table.table} - ${stats.rows} rows (${table.description})`);
    });
    
    // Import each table
    for (const { table, description } of sortedTables) {
      if (tableStats[table]?.rows > 0) {
        const result = await importTable(table, mysqlConnection, pgPool);
        importResults[table] = result;
      } else {
        console.log(`\n📋 ${table}: No data to import`);
        importResults[table] = { imported: 0, skipped: 0, errors: 0 };
      }
    }
    
    // Generate summary report
    console.log('\n📊 IMPORT SUMMARY');
    console.log('==================');
    
    let totalImported = 0;
    let totalErrors = 0;
    
    Object.entries(importResults).forEach(([table, result]) => {
      console.log(`${table.padEnd(25)}: ${result.imported.toString().padStart(6)} rows imported, ${result.errors} errors`);
      totalImported += result.imported;
      totalErrors += result.errors;
    });
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n📈 TOTALS:`);
    console.log(`   ✅ Imported: ${totalImported} rows`);
    console.log(`   ❌ Errors: ${totalErrors}`);
    console.log(`   ⏱️  Duration: ${duration} seconds`);
    
    // Verify import
    console.log('\n🔍 Verifying import...');
    const pgClient = await pgPool.connect();
    try {
      for (const { table } of sortedTables) {
        const result = await pgClient.query(`SELECT COUNT(*) FROM ${table}`);
        const pgCount = parseInt(result.rows[0].count);
        const mysqlCount = tableStats[table]?.rows || 0;
        
        if (pgCount > 0) {
          const match = pgCount === importResults[table]?.imported;
          console.log(`   ${match ? '✅' : '⚠️'} ${table}: ${pgCount} rows (expected ${importResults[table]?.imported || 0})`);
        }
      }
    } finally {
      pgClient.release();
    }
    
    // Save import log
    const importLog = {
      timestamp: new Date().toISOString(),
      duration: duration,
      results: importResults,
      totalImported,
      totalErrors
    };
    
    await fs.writeFile('import-log.json', JSON.stringify(importLog, null, 2));
    console.log('\n💾 Import log saved to import-log.json');
    
    if (totalImported > 0) {
      console.log('\n🎉 Data import completed successfully!');
      console.log('✅ Your PostgreSQL database now contains real animekunnet data');
    }
    
  } finally {
    await mysqlConnection.end();
    await pgPool.end();
  }
}

// Run import with proper error handling
if (require.main === module) {
  runComprehensiveImport().catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
}

module.exports = { runComprehensiveImport };