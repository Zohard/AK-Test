#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const fs = require('fs').promises;

console.log('🔄 MySQL to PostgreSQL Migration Tool');
console.log('=====================================');

// MySQL configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'anime_kun',
  port: process.env.MYSQL_PORT || 3306,
};

// PostgreSQL configuration
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'anime_user',
  password: process.env.DB_PASSWORD || 'anime_password',
  database: process.env.DB_NAME || 'anime_kun',
  port: process.env.DB_PORT || 5432,
};

async function connectDatabases() {
  console.log('🔌 Connecting to databases...');
  
  try {
    const mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ MySQL connected');
    
    const pgPool = new Pool(pgConfig);
    await pgPool.query('SELECT 1'); // Test connection
    console.log('✅ PostgreSQL connected');
    
    return { mysqlConnection, pgPool };
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function migrateTable(tableName, mysqlConnection, pgPool, fieldMappings = {}) {
  try {
    console.log(`📦 Migrating table: ${tableName}`);
    
    // Get data from MySQL
    const [rows] = await mysqlConnection.execute(`SELECT * FROM ${tableName}`);
    
    if (rows.length === 0) {
      console.log(`⚠️  No data found in ${tableName}`);
      return;
    }
    
    console.log(`📊 Found ${rows.length} records in ${tableName}`);
    
    // Get PostgreSQL table structure
    const pgClient = await pgPool.connect();
    
    try {
      const result = await pgClient.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      const pgColumns = result.rows.map(row => row.column_name);
      
      // Clear existing data
      await pgClient.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
      
      // Insert data
      let inserted = 0;
      for (const row of rows) {
        try {
          // Apply field mappings if any
          const mappedRow = { ...row };
          for (const [oldField, newField] of Object.entries(fieldMappings)) {
            if (mappedRow[oldField] !== undefined) {
              mappedRow[newField] = mappedRow[oldField];
              delete mappedRow[oldField];
            }
          }
          
          // Filter only columns that exist in PostgreSQL
          const filteredRow = {};
          for (const col of pgColumns) {
            if (mappedRow[col] !== undefined) {
              filteredRow[col] = mappedRow[col];
            }
          }
          
          const columns = Object.keys(filteredRow);
          const values = Object.values(filteredRow);
          
          if (columns.length > 0) {
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
            
            await pgClient.query(query, values);
            inserted++;
          }
        } catch (error) {
          console.warn(`⚠️  Failed to insert row in ${tableName}:`, error.message);
        }
      }
      
      // Reset sequence if table has a serial column
      try {
        const sequenceResult = await pgClient.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_default LIKE 'nextval%'
        `, [tableName]);
        
        if (sequenceResult.rows.length > 0) {
          const serialColumn = sequenceResult.rows[0].column_name;
          await pgClient.query(`SELECT setval(pg_get_serial_sequence($1, $2), COALESCE(MAX(${serialColumn}), 1)) FROM ${tableName}`, [tableName, serialColumn]);
        }
      } catch (seqError) {
        // Ignore sequence errors
      }
      
      console.log(`✅ Migrated ${inserted}/${rows.length} records to ${tableName}`);
      
    } finally {
      pgClient.release();
    }
    
  } catch (error) {
    console.error(`❌ Error migrating ${tableName}:`, error.message);
  }
}

async function main() {
  const { mysqlConnection, pgPool } = await connectDatabases();
  
  try {
    // Define tables to migrate in order (respecting foreign key constraints)
    const tablesToMigrate = [
      'ak_users',
      'ak_animes', 
      'ak_mangas',
      'ak_critique',
      'ak_webzine_articles',
      'ak_article_authors'
    ];
    
    // Field mappings for compatibility
    const fieldMappings = {
      ak_animes: { MoyenneNotes: 'moyennenotes' },
      ak_mangas: { MoyenneNotes: 'moyennenotes' },
      ak_users: { id: 'id_membre' }
    };
    
    console.log(`🚀 Starting migration of ${tablesToMigrate.length} tables...`);
    
    for (const tableName of tablesToMigrate) {
      await migrateTable(tableName, mysqlConnection, pgPool, fieldMappings[tableName] || {});
    }
    
    // Try to migrate business tables if they exist
    const businessTables = [
      'ak_business',
      'ak_business_to_animes', 
      'ak_business_to_mangas',
      'ak_rel_animes',
      'ak_rel_mangas'
    ];
    
    for (const tableName of businessTables) {
      try {
        const [rows] = await mysqlConnection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        if (rows[0].count > 0) {
          await migrateTable(tableName, mysqlConnection, pgPool);
        }
      } catch (error) {
        console.log(`⚠️  Table ${tableName} not found in MySQL, skipping...`);
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
    // Show final statistics
    const pgClient = await pgPool.connect();
    try {
      for (const tableName of tablesToMigrate) {
        try {
          const result = await pgClient.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`📊 ${tableName}: ${result.rows[0].count} records`);
        } catch (error) {
          // Table might not exist
        }
      }
    } finally {
      pgClient.release();
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mysqlConnection.end();
    await pgPool.end();
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node migrate-mysql-to-postgresql.js

Environment variables:
  MySQL:
    MYSQL_HOST (default: localhost)
    MYSQL_USER (default: root)  
    MYSQL_PASSWORD (default: empty)
    MYSQL_DATABASE (default: anime_kun)
    MYSQL_PORT (default: 3306)
  
  PostgreSQL:
    DB_HOST (default: localhost)
    DB_USER (default: anime_user)
    DB_PASSWORD (default: anime_password)  
    DB_NAME (default: anime_kun)
    DB_PORT (default: 5432)

Example:
  MYSQL_PASSWORD=mypass node migrate-mysql-to-postgresql.js
  `);
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { migrateTable, connectDatabases };