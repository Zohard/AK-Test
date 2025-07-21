#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;

console.log('🏗️  Create Complete PostgreSQL Schema from MySQL');
console.log('=================================================');

const mysqlConfig = {
  host: '127.0.0.1',
  user: 'animekunnet',
  password: 'animekun77',
  database: 'animekunnet',
  port: 3306,
};

// MySQL to PostgreSQL type mapping
const typeMapping = {
  'int': 'INTEGER',
  'bigint': 'BIGINT',
  'smallint': 'SMALLINT',
  'tinyint': 'SMALLINT',
  'varchar': 'VARCHAR',
  'char': 'CHAR',
  'text': 'TEXT',
  'longtext': 'TEXT',
  'mediumtext': 'TEXT',
  'datetime': 'TIMESTAMP',
  'timestamp': 'TIMESTAMP',
  'date': 'DATE',
  'time': 'TIME',
  'decimal': 'DECIMAL',
  'float': 'REAL',
  'double': 'DOUBLE PRECISION',
  'blob': 'BYTEA',
  'longblob': 'BYTEA',
  'mediumblob': 'BYTEA',
  'enum': 'VARCHAR'
};

function mapMySQLTypeToPostgreSQL(column) {
  const baseType = column.DATA_TYPE.toLowerCase();
  let pgType = typeMapping[baseType] || 'TEXT';
  
  // Handle specific cases
  if (baseType === 'varchar' || baseType === 'char') {
    const length = column.CHARACTER_MAXIMUM_LENGTH;
    if (length) {
      pgType = `${pgType}(${length})`;
    }
  } else if (baseType === 'decimal') {
    const precision = column.NUMERIC_PRECISION;
    const scale = column.NUMERIC_SCALE;
    if (precision && scale !== null) {
      pgType = `DECIMAL(${precision},${scale})`;
    }
  } else if (baseType === 'tinyint' && column.CHARACTER_MAXIMUM_LENGTH === 1) {
    // Handle boolean-like tinyint(1)
    pgType = 'BOOLEAN';
  }
  
  return pgType;
}

async function createCompleteSchema() {
  console.log('🔌 Connecting to MySQL...');
  
  const connection = await mysql.createConnection(mysqlConfig);
  let sqlStatements = [];
  
  try {
    // Get all tables ordered by dependency (users first, then others)
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'animekunnet' 
      ORDER BY 
        CASE 
          WHEN TABLE_NAME = 'ak_users' THEN 1
          WHEN TABLE_NAME LIKE 'ak_%' THEN 2
          ELSE 3
        END,
        TABLE_NAME
    `);
    
    console.log(`\n🏗️  Creating schema for ${tables.length} tables...\n`);
    
    // Add header comments
    sqlStatements.push(`-- PostgreSQL Schema Generated from MySQL animekunnet database`);
    sqlStatements.push(`-- Generated on: ${new Date().toISOString()}`);
    sqlStatements.push(`-- Source: mysql://animekunnet@127.0.0.1:3306/animekunnet`);
    sqlStatements.push(`\n-- Drop existing tables if they exist`);
    sqlStatements.push(`DROP SCHEMA IF EXISTS public CASCADE;`);
    sqlStatements.push(`CREATE SCHEMA public;`);
    sqlStatements.push(``);
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`📋 Processing ${tableName}...`);
      
      // Get columns
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, 
               CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE,
               COLUMN_KEY, EXTRA, COLUMN_COMMENT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'animekunnet' AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName]);
      
      // Start CREATE TABLE statement
      sqlStatements.push(`-- Table: ${tableName}`);
      if (columns[0]?.COLUMN_COMMENT) {
        sqlStatements.push(`-- ${columns[0].COLUMN_COMMENT}`);
      }
      sqlStatements.push(`CREATE TABLE ${tableName} (`);
      
      const columnDefinitions = [];
      let primaryKey = null;
      
      for (const column of columns) {
        const colName = column.COLUMN_NAME;
        const pgType = mapMySQLTypeToPostgreSQL(column);
        const nullable = column.IS_NULLABLE === 'YES' ? '' : ' NOT NULL';
        
        let defaultValue = '';
        if (column.COLUMN_DEFAULT !== null) {
          let def = column.COLUMN_DEFAULT;
          
          // Handle specific MySQL defaults
          if (def === 'CURRENT_TIMESTAMP') {
            defaultValue = ' DEFAULT CURRENT_TIMESTAMP';
          } else if (def === '0000-00-00 00:00:00') {
            defaultValue = ''; // Skip invalid MySQL datetime
          } else if (def === 'NULL') {
            defaultValue = ' DEFAULT NULL';
          } else if (typeof def === 'string' && def !== 'NULL') {
            defaultValue = ` DEFAULT '${def.replace(/'/g, "''")}'`;
          } else {
            defaultValue = ` DEFAULT ${def}`;
          }
        }
        
        // Handle AUTO_INCREMENT
        let autoIncrement = '';
        if (column.EXTRA && column.EXTRA.includes('auto_increment')) {
          if (pgType.includes('INTEGER')) {
            autoIncrement = ' SERIAL';
            pgType.replace('INTEGER', ''); // SERIAL replaces INTEGER
          } else {
            autoIncrement = ' GENERATED ALWAYS AS IDENTITY';
          }
        }
        
        // Track primary key
        if (column.COLUMN_KEY === 'PRI') {
          primaryKey = colName;
        }
        
        const columnDef = `    ${colName} ${pgType}${autoIncrement}${nullable}${defaultValue}`;
        columnDefinitions.push(columnDef);
      }
      
      // Add primary key constraint
      if (primaryKey) {
        columnDefinitions.push(`    CONSTRAINT ${tableName}_pkey PRIMARY KEY (${primaryKey})`);
      }
      
      sqlStatements.push(columnDefinitions.join(',\n'));
      sqlStatements.push(`);\n`);
      
      // Add indexes
      const [indexes] = await connection.execute(`
        SHOW INDEX FROM ${tableName} WHERE Key_name != 'PRIMARY'
      `);
      
      const indexGroups = {};
      indexes.forEach(idx => {
        if (!indexGroups[idx.Key_name]) {
          indexGroups[idx.Key_name] = [];
        }
        indexGroups[idx.Key_name].push(idx.Column_name);
      });
      
      Object.entries(indexGroups).forEach(([indexName, columns]) => {
        const unique = indexes.find(i => i.Key_name === indexName)?.Non_unique === 0 ? 'UNIQUE ' : '';
        sqlStatements.push(`CREATE ${unique}INDEX ${indexName} ON ${tableName} (${columns.join(', ')});`);
      });
      
      sqlStatements.push('');
    }
    
    // Add foreign key constraints at the end
    console.log('\n🔗 Adding foreign key constraints...');
    sqlStatements.push('-- Foreign Key Constraints');
    
    // Add commonly expected foreign keys based on naming conventions
    const foreignKeys = [
      {
        table: 'ak_critique',
        column: 'id_membre',
        refTable: 'ak_users',
        refColumn: 'id'
      },
      {
        table: 'ak_critique',
        column: 'id_anime',
        refTable: 'ak_animes',
        refColumn: 'id_anime'
      },
      {
        table: 'ak_critique',
        column: 'id_manga',
        refTable: 'ak_mangas',
        refColumn: 'id_manga'
      },
      {
        table: 'ak_business_to_animes',
        column: 'id_anime',
        refTable: 'ak_animes',
        refColumn: 'id_anime'
      },
      {
        table: 'ak_business_to_animes',
        column: 'id_business',
        refTable: 'ak_business',
        refColumn: 'id_business'
      },
      {
        table: 'ak_business_to_mangas',
        column: 'id_manga',
        refTable: 'ak_mangas',
        refColumn: 'id_manga'
      },
      {
        table: 'ak_business_to_mangas',
        column: 'id_business',
        refTable: 'ak_business',
        refColumn: 'id_business'
      }
    ];
    
    foreignKeys.forEach(fk => {
      sqlStatements.push(`ALTER TABLE ${fk.table} ADD CONSTRAINT fk_${fk.table}_${fk.column} FOREIGN KEY (${fk.column}) REFERENCES ${fk.refTable}(${fk.refColumn});`);
    });
    
    // Write SQL file
    const sqlContent = sqlStatements.join('\n');
    await fs.writeFile('complete-postgresql-schema.sql', sqlContent);
    
    console.log('\n✅ Complete PostgreSQL schema created!');
    console.log('📄 Generated: complete-postgresql-schema.sql');
    console.log(`📊 ${tables.length} tables, ${sqlStatements.length} statements`);
    
  } finally {
    await connection.end();
  }
}

createCompleteSchema().catch(console.error);