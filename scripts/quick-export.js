#!/usr/bin/env node

// Quick MySQL export using the existing project's database config
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

console.log('🔄 Quick MySQL Export Tool');
console.log('===========================');

// Try to read from existing .env or use defaults
let mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', 
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'anime_kun',
  port: process.env.DB_PORT || 3306,
};

// Override for MySQL if different from PostgreSQL config
mysqlConfig = {
  host: process.env.MYSQL_HOST || mysqlConfig.host,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'anime_kun',
  port: process.env.MYSQL_PORT || 3306,
};

async function quickExport() {
  let connection = null;
  
  try {
    console.log(`🔌 Connecting to MySQL at ${mysqlConfig.host}:${mysqlConfig.port}...`);
    connection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Connected to MySQL');
    
    // Create export directory
    const exportDir = `mysql-export-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}`;
    await fs.mkdir(exportDir, { recursive: true });
    
    // Tables to export
    const tables = [
      'ak_users', 'ak_animes', 'ak_mangas', 'ak_critique', 
      'ak_webzine_articles', 'ak_article_authors', 'ak_business',
      'ak_business_to_animes', 'ak_business_to_mangas', 
      'ak_rel_animes', 'ak_rel_mangas'
    ];
    
    let totalRecords = 0;
    const exportedTables = [];
    
    for (const table of tables) {
      try {
        console.log(`📊 Exporting ${table}...`);
        
        // Check if table exists
        const [rows] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
        if (rows.length === 0) {
          console.log(`   ⚠️  Table ${table} not found, skipping...`);
          continue;
        }
        
        // Get table data
        const [data] = await connection.execute(`SELECT * FROM ${table}`);
        console.log(`   📈 Found ${data.length} records`);
        
        if (data.length > 0) {
          // Save as JSON for easy import
          await fs.writeFile(
            path.join(exportDir, `${table}.json`), 
            JSON.stringify(data, null, 2)
          );
          
          // Also save column info
          const [columns] = await connection.execute(`DESCRIBE ${table}`);
          await fs.writeFile(
            path.join(exportDir, `${table}_schema.json`), 
            JSON.stringify(columns, null, 2)
          );
          
          totalRecords += data.length;
          exportedTables.push({ table, records: data.length });
          console.log(`   ✅ Exported ${table} (${data.length} records)`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to export ${table}: ${error.message}`);
      }
    }
    
    // Create import script for PostgreSQL
    const importScript = `#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs').promises;

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  user: process.env.PG_USER || 'anime_user',
  password: process.env.PG_PASSWORD || 'anime_password',
  database: process.env.PG_DATABASE || 'anime_kun',
  port: process.env.PG_PORT || 5432,
});

async function importData() {
  const client = await pool.connect();
  try {
    console.log('🧹 Clearing existing data...');
    await client.query('TRUNCATE TABLE ak_users RESTART IDENTITY CASCADE');
    await client.query('TRUNCATE TABLE ak_business RESTART IDENTITY CASCADE');
    
    ${exportedTables.map(({ table }) => `
    // Import ${table}
    try {
      const ${table}Data = JSON.parse(await fs.readFile('${table}.json', 'utf8'));
      console.log('📥 Importing ${table} (' + ${table}Data.length + ' records)...');
      
      for (const row of ${table}Data) {
        const columns = Object.keys(row).filter(col => row[col] !== null);
        const values = columns.map(col => row[col]);
        const placeholders = columns.map((_, i) => '$' + (i + 1)).join(', ');
        
        const query = \`INSERT INTO ${table} (\${columns.join(', ')}) VALUES (\${placeholders})\`;
        await client.query(query, values);
      }
      console.log('✅ ${table} imported successfully');
    } catch (error) {
      console.log('⚠️  ${table} import failed:', error.message);
    }`).join('\n')}
    
    console.log('🎉 Import completed!');
  } finally {
    client.release();
    await pool.end();
  }
}

importData().catch(console.error);`;
    
    await fs.writeFile(path.join(exportDir, 'import-to-postgresql.js'), importScript);
    
    // Create summary
    const summary = {
      exportDate: new Date().toISOString(),
      sourceDatabase: \`\${mysqlConfig.database}@\${mysqlConfig.host}:\${mysqlConfig.port}\`,
      totalRecords,
      tables: exportedTables,
      files: {
        'table_name.json': 'Data in JSON format',
        'table_name_schema.json': 'Table structure',
        'import-to-postgresql.js': 'Import script for PostgreSQL'
      }
    };
    
    await fs.writeFile(path.join(exportDir, 'export-summary.json'), JSON.stringify(summary, null, 2));
    
    console.log('\\n🎉 Export completed successfully!');
    console.log(\`📁 Export directory: \${exportDir}\`);
    console.log(\`📊 Total records: \${totalRecords}\`);
    console.log('\\n📋 Exported tables:');
    exportedTables.forEach(({ table, records }) => {
      console.log(\`  📊 \${table}: \${records} records\`);
    });
    
    console.log('\\n🔄 To import to PostgreSQL:');
    console.log(\`cd \${exportDir} && node import-to-postgresql.js\`);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\\n💡 Fix: Check MySQL credentials');
      console.log('Set environment variables:');
      console.log('  MYSQL_HOST=localhost');
      console.log('  MYSQL_USER=your_username'); 
      console.log('  MYSQL_PASSWORD=your_password');
      console.log('  MYSQL_DATABASE=anime_kun');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\\n💡 Fix: Start MySQL service');
      console.log('  sudo systemctl start mysql');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\\n💡 Fix: Check database name exists');
      console.log('  mysql -u root -p -e "SHOW DATABASES;"');
    }
    
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  quickExport().catch(console.error);
}`;