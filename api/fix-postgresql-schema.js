#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;

console.log('🔧 Fix PostgreSQL Schema Generation');
console.log('===================================');

const mysqlConfig = {
  host: '127.0.0.1',
  user: 'animekunnet',
  password: 'animekun77',
  database: 'animekunnet',
  port: 3306,
};

// MySQL to PostgreSQL type mapping with proper handling
const mapMySQLTypeToPostgreSQL = (column) => {
  const baseType = column.DATA_TYPE.toLowerCase();
  const isAutoIncrement = column.EXTRA && column.EXTRA.includes('auto_increment');
  
  // Handle auto increment fields
  if (isAutoIncrement) {
    if (baseType === 'int') return 'SERIAL';
    if (baseType === 'bigint') return 'BIGSERIAL';
    if (baseType === 'smallint') return 'SMALLSERIAL';
  }
  
  // Regular type mapping
  switch (baseType) {
    case 'int': return 'INTEGER';
    case 'bigint': return 'BIGINT';
    case 'smallint': return 'SMALLINT';
    case 'tinyint': 
      return column.CHARACTER_MAXIMUM_LENGTH === 1 ? 'BOOLEAN' : 'SMALLINT';
    case 'varchar':
      return column.CHARACTER_MAXIMUM_LENGTH ? `VARCHAR(${column.CHARACTER_MAXIMUM_LENGTH})` : 'VARCHAR(255)';
    case 'char':
      return column.CHARACTER_MAXIMUM_LENGTH ? `CHAR(${column.CHARACTER_MAXIMUM_LENGTH})` : 'CHAR(1)';
    case 'text':
    case 'longtext':
    case 'mediumtext':
      return 'TEXT';
    case 'datetime':
    case 'timestamp':
      return 'TIMESTAMP';
    case 'date':
      return 'DATE';
    case 'time':
      return 'TIME';
    case 'decimal':
      if (column.NUMERIC_PRECISION && column.NUMERIC_SCALE !== null) {
        return `DECIMAL(${column.NUMERIC_PRECISION},${column.NUMERIC_SCALE})`;
      }
      return 'DECIMAL';
    case 'float':
      return 'REAL';
    case 'double':
      return 'DOUBLE PRECISION';
    case 'blob':
    case 'longblob':
    case 'mediumblob':
      return 'BYTEA';
    case 'enum':
      return 'VARCHAR(50)'; // Handle as varchar for now
    default:
      return 'TEXT';
  }
};

async function fixSchema() {
  console.log('🔌 Connecting to MySQL...');
  const connection = await mysql.createConnection(mysqlConfig);
  let sqlStatements = [];
  
  try {
    // Header
    sqlStatements.push(`-- Fixed PostgreSQL Schema for animekunnet database`);
    sqlStatements.push(`-- Generated on: ${new Date().toISOString()}`);
    sqlStatements.push(`\n-- Drop existing schema and recreate`);
    sqlStatements.push(`DROP SCHEMA IF EXISTS public CASCADE;`);
    sqlStatements.push(`CREATE SCHEMA public;\n`);
    
    // Get tables in proper order
    const importantTables = [
      'ak_users', 'ak_animes', 'ak_mangas', 'ak_business', 'ak_tags',
      'ak_critique', 'ak_business_to_animes', 'ak_business_to_mangas', 
      'ak_tag2fiche', 'ak_user_anime_list', 'ak_user_manga_list',
      'ak_top_lists', 'ak_top_list_items', 'ak_anime_screenshots'
    ];
    
    const [allTables] = await connection.execute(`
      SELECT TABLE_NAME FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'animekunnet'
    `);
    
    // Process important tables first, then others
    const processedTables = new Set();
    const tablesToProcess = [...importantTables];
    
    allTables.forEach(t => {
      if (!importantTables.includes(t.TABLE_NAME)) {
        tablesToProcess.push(t.TABLE_NAME);
      }
    });
    
    for (const tableName of tablesToProcess) {
      if (processedTables.has(tableName)) continue;
      
      console.log(`📋 Processing ${tableName}...`);
      
      // Get columns
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, 
               CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE,
               COLUMN_KEY, EXTRA
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'animekunnet' AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName]);
      
      if (columns.length === 0) continue; // Skip if table doesn't exist
      
      sqlStatements.push(`-- Table: ${tableName}`);
      sqlStatements.push(`CREATE TABLE ${tableName} (`);
      
      const columnDefs = [];
      let primaryKey = null;
      
      for (const column of columns) {
        const colName = column.COLUMN_NAME;
        const pgType = mapMySQLTypeToPostgreSQL(column);
        const nullable = column.IS_NULLABLE === 'YES' ? '' : ' NOT NULL';
        const isAutoIncrement = column.EXTRA && column.EXTRA.includes('auto_increment');
        
        let defaultValue = '';
        if (column.COLUMN_DEFAULT !== null && !isAutoIncrement) {
          let def = column.COLUMN_DEFAULT;
          if (def === 'CURRENT_TIMESTAMP') {
            defaultValue = ' DEFAULT CURRENT_TIMESTAMP';
          } else if (def === '0000-00-00 00:00:00') {
            // Skip invalid MySQL datetime
          } else if (def === 'NULL') {
            // Skip explicit NULL defaults
          } else if (typeof def === 'string') {
            defaultValue = ` DEFAULT '${def.replace(/'/g, "''")}'`;
          } else {
            defaultValue = ` DEFAULT ${def}`;
          }
        }
        
        if (column.COLUMN_KEY === 'PRI') {
          primaryKey = colName;
        }
        
        const columnDef = `    ${colName} ${pgType}${nullable}${defaultValue}`;
        columnDefs.push(columnDef);
      }
      
      // Add primary key constraint
      if (primaryKey) {
        columnDefs.push(`    CONSTRAINT ${tableName}_pkey PRIMARY KEY (${primaryKey})`);
      }
      
      sqlStatements.push(columnDefs.join(',\n'));
      sqlStatements.push(`);\n`);
      
      processedTables.add(tableName);
    }
    
    // Add indexes
    console.log('\n🔗 Adding indexes...');
    for (const tableName of processedTables) {
      const [indexes] = await connection.execute(`
        SHOW INDEX FROM ${tableName} WHERE Key_name != 'PRIMARY'
      `);
      
      const indexGroups = {};
      indexes.forEach(idx => {
        if (!indexGroups[idx.Key_name]) {
          indexGroups[idx.Key_name] = {
            columns: [],
            unique: idx.Non_unique === 0
          };
        }
        indexGroups[idx.Key_name].columns.push(idx.Column_name);
      });
      
      Object.entries(indexGroups).forEach(([indexName, info]) => {
        const unique = info.unique ? 'UNIQUE ' : '';
        sqlStatements.push(`CREATE ${unique}INDEX ${indexName} ON ${tableName} (${info.columns.join(', ')});`);
      });
    }
    
    // Add foreign keys
    sqlStatements.push('\n-- Foreign Key Constraints');
    const foreignKeys = [
      ['ak_critique', 'id_membre', 'ak_users', 'id'],
      ['ak_critique', 'id_anime', 'ak_animes', 'id_anime'],
      ['ak_critique', 'id_manga', 'ak_mangas', 'id_manga'],
      ['ak_business_to_animes', 'id_anime', 'ak_animes', 'id_anime'],
      ['ak_business_to_animes', 'id_business', 'ak_business', 'id_business'],
      ['ak_business_to_mangas', 'id_manga', 'ak_mangas', 'id_manga'],
      ['ak_business_to_mangas', 'id_business', 'ak_business', 'id_business']
    ];
    
    foreignKeys.forEach(([table, column, refTable, refColumn]) => {
      if (processedTables.has(table) && processedTables.has(refTable)) {
        sqlStatements.push(`ALTER TABLE ${table} ADD CONSTRAINT fk_${table}_${column} FOREIGN KEY (${column}) REFERENCES ${refTable}(${refColumn});`);
      }
    });
    
    // Write fixed schema
    const sqlContent = sqlStatements.join('\n');
    await fs.writeFile('fixed-postgresql-schema.sql', sqlContent);
    
    console.log('\n✅ Fixed PostgreSQL schema generated!');
    console.log('📄 File: fixed-postgresql-schema.sql');
    console.log(`📊 Processed ${processedTables.size} tables`);
    
  } finally {
    await connection.end();
  }
}

fixSchema().catch(console.error);