#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;

console.log('🔍 Complete MySQL Database Analysis');
console.log('===================================');

const mysqlConfig = {
  host: '127.0.0.1',
  user: 'animekunnet',
  password: 'animekun77',
  database: 'animekunnet',
  port: 3306,
};

async function analyzeCompleteStructure() {
  console.log('🔌 Connecting to MySQL...');
  
  const connection = await mysql.createConnection(mysqlConfig);
  
  try {
    // Get all tables
    console.log('\n📋 Getting all tables...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'animekunnet' 
      ORDER BY TABLE_ROWS DESC
    `);
    
    console.log(`\n📊 Found ${tables.length} tables:`);
    tables.forEach((table, i) => {
      const rows = table.TABLE_ROWS || 0;
      const dataSize = Math.round((table.DATA_LENGTH || 0) / 1024);
      console.log(`   ${i + 1}. ${table.TABLE_NAME} - ${rows} rows (${dataSize} KB)`);
    });
    
    // Analyze each table structure
    const tableStructures = {};
    
    console.log('\n🔍 Analyzing table structures...');
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      // Get columns
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, 
               CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE,
               COLUMN_KEY, EXTRA
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'animekunnet' AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName]);
      
      // Get foreign keys
      const [foreignKeys] = await connection.execute(`
        SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = 'animekunnet' 
        AND TABLE_NAME = ? 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [tableName]);
      
      // Get indexes
      const [indexes] = await connection.execute(`
        SHOW INDEX FROM ${tableName}
      `);
      
      tableStructures[tableName] = {
        columns,
        foreignKeys,
        indexes: indexes.filter(idx => idx.Key_name !== 'PRIMARY'),
        rowCount: table.TABLE_ROWS || 0
      };
      
      console.log(`   ✅ ${tableName} - ${columns.length} columns, ${foreignKeys.length} FK, ${indexes.length} indexes`);
    }
    
    // Save analysis to JSON file
    const analysis = {
      timestamp: new Date().toISOString(),
      database: 'animekunnet',
      totalTables: tables.length,
      tableList: tables.map(t => ({ name: t.TABLE_NAME, rows: t.TABLE_ROWS })),
      structures: tableStructures
    };
    
    await fs.writeFile('mysql-analysis-complete.json', JSON.stringify(analysis, null, 2));
    console.log('\n💾 Complete analysis saved to mysql-analysis-complete.json');
    
    // Show summary by data importance
    console.log('\n📈 Tables by data volume:');
    const sortedByRows = tables.sort((a, b) => (b.TABLE_ROWS || 0) - (a.TABLE_ROWS || 0));
    sortedByRows.slice(0, 10).forEach((table, i) => {
      console.log(`   ${i + 1}. ${table.TABLE_NAME}: ${table.TABLE_ROWS || 0} rows`);
    });
    
    return tableStructures;
    
  } finally {
    await connection.end();
  }
}

analyzeCompleteStructure().catch(console.error);