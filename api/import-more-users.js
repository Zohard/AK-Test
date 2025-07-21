#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');
const { Pool } = require('pg');

console.log('👥 Import More Users from animekunnet');
console.log('====================================');

// MySQL configuration
const mysqlConfig = {
  host: '127.0.0.1',
  user: 'animekunnet',
  password: 'animekun77',
  database: 'animekunnet',
  port: 3306,
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
    await pgPool.query('SELECT 1');
    console.log('✅ PostgreSQL connected');
    
    return { mysqlConnection, pgPool };
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function importUsers(mysqlConnection, pgPool, limit = 100) {
  console.log(`\n👥 Importing up to ${limit} more users...`);
  
  try {
    // Get users that haven't been imported yet
    const [rows] = await mysqlConnection.execute(`
      SELECT * FROM ak_users 
      WHERE actif = 1 
      AND id NOT IN (SELECT id FROM ak_users WHERE id BETWEEN 226 AND 255)
      ORDER BY smfPosts DESC, smfDateRegistered DESC
      LIMIT ${limit}
    `);
    
    console.log(`📊 Found ${rows.length} new users to import`);
    
    if (rows.length === 0) {
      console.log('ℹ️  No new users to import');
      return 0;
    }
    
    const pgClient = await pgPool.connect();
    try {
      let imported = 0;
      let skipped = 0;
      
      for (const user of rows) {
        try {
          await pgClient.query(`
            INSERT INTO ak_users (
              id, username, smfRealName, smfEmailAddress, smfDateRegistered,
              smfPosts, smfPersonalText, smfGender, smfLocation, smfWebsite,
              smfBirthDate, smfAvatar, smfSignature, smfBuddyList,
              smfIgnoreBoards, smfMessageLabels, smfHideEmail,
              smfShowOnline, smfTimeFormat, smfTimeOffset, smfTheme,
              smfSecretQuestion, smfSecretAnswer, smfValidationCode,
              smfKarmaGood, smfKarmaBad, smfUsertitle, smfNotifyTypes,
              smfMemberIP, smfMemberIP2, smfSecretKey, smfIsActivated,
              smfAdditionalGroups, smfPendingEmailChange, smfPasswordSalt,
              actif, admin, level, type
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
              $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
              $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
            )
          `, [
            user.id,
            user.username,
            user.smfRealName,
            user.smfEmailAddress,
            user.smfDateRegistered,
            user.smfPosts || 0,
            user.smfPersonalText,
            user.smfGender || 0,
            user.smfLocation,
            user.smfWebsite,
            user.smfBirthDate,
            user.smfAvatar,
            user.smfSignature,
            user.smfBuddyList,
            user.smfIgnoreBoards,
            user.smfMessageLabels,
            user.smfHideEmail || 0,
            user.smfShowOnline || 1,
            user.smfTimeFormat,
            user.smfTimeOffset || 0,
            user.smfTheme || 0,
            user.smfSecretQuestion,
            user.smfSecretAnswer,
            user.smfValidationCode,
            user.smfKarmaGood || 0,
            user.smfKarmaBad || 0,
            user.smfUsertitle,
            user.smfNotifyTypes || 1,
            user.smfMemberIP,
            user.smfMemberIP2,
            user.smfSecretKey,
            user.smfIsActivated || 1,
            user.smfAdditionalGroups,
            user.smfPendingEmailChange,
            user.smfPasswordSalt,
            user.actif || 1,
            user.admin || 0,
            user.level || 0,
            user.type || 0
          ]);
          imported++;
          
          if (imported % 25 === 0) {
            console.log(`📈 Progress: ${imported} users imported...`);
          }
          
        } catch (error) {
          console.warn(`⚠️  Failed to import user "${user.username}": ${error.message}`);
          skipped++;
        }
      }
      
      console.log(`✅ Imported ${imported}/${rows.length} new users`);
      if (skipped > 0) {
        console.log(`⚠️  Skipped ${skipped} users due to conflicts`);
      }
      
      return imported;
      
    } finally {
      pgClient.release();
    }
    
  } catch (error) {
    console.error('❌ User import failed:', error.message);
    return 0;
  }
}

async function showUserStats(pgPool) {
  console.log('\n📊 Updated User Statistics:');
  
  const client = await pgPool.connect();
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) as total,
        MIN(id) as min_id, 
        MAX(id) as max_id,
        SUM(smfPosts) as total_posts
      FROM ak_users
    `);
    
    const stats = result.rows[0];
    console.log(`👥 Total users: ${stats.total} (IDs: ${stats.min_id}-${stats.max_id})`);
    console.log(`💬 Total posts: ${stats.total_posts}`);
    
    const sampleResult = await client.query(`
      SELECT username, smfPosts, smfDateRegistered 
      FROM ak_users 
      ORDER BY smfPosts DESC 
      LIMIT 5
    `);
    
    console.log('\n🌟 Top users by posts:');
    sampleResult.rows.forEach((user, i) => {
      const regDate = new Date(user.smfdateregistered).getFullYear();
      console.log(`  ${i + 1}. ${user.username} - ${user.smfposts} posts (joined ${regDate})`);
    });
    
  } finally {
    client.release();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args[0]) || 100;
  
  try {
    const { mysqlConnection, pgPool } = await connectDatabases();
    
    const imported = await importUsers(mysqlConnection, pgPool, limit);
    
    if (imported > 0) {
      await showUserStats(pgPool);
      console.log('\n🎉 User import completed! Now you can try importing critiques again.');
    }
    
    await mysqlConnection.end();
    await pgPool.end();
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}