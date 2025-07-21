#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'anime_user',
  password: 'anime_password',
  database: 'anime_kun',
  port: 5432,
});

async function fixCritiqueData() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing critique data...');
    
    // Clear existing critiques
    await client.query('DELETE FROM ak_critique');
    console.log('✅ Cleared existing critiques');
    
    // Get user and anime IDs
    const users = await client.query('SELECT id_membre, pseudo FROM ak_users ORDER BY id_membre');
    const animes = await client.query('SELECT id_anime, titre FROM ak_animes ORDER BY id_anime');
    const mangas = await client.query('SELECT id_manga, titre FROM ak_mangas ORDER BY id_manga');
    
    console.log(`Found ${users.rows.length} users, ${animes.rows.length} animes, ${mangas.rows.length} mangas`);
    
    // Insert diverse critiques with different users
    const critiques = [
      // Spirited Away review by admin
      {
        nice_url: 'spirited-away-review-admin',
        titre: 'Un chef-d\'œuvre intemporel de Miyazaki',
        critique: 'Le Voyage de Chihiro est sans conteste l\'un des plus beaux films d\'animation jamais créés. Miyazaki nous transporte dans un monde magique où chaque détail compte. L\'histoire de Chihiro, cette petite fille courageuse, nous enseigne l\'importance de la persévérance et de l\'amitié.',
        notation: 10,
        id_membre: 1, // admin
        id_anime: 2, // Spirited Away (Le Voyage de Chihiro)
        id_manga: null
      },
      // Attack on Titan review by otaku_lover  
      {
        nice_url: 'attack-on-titan-review-otaku',
        titre: 'Une œuvre révolutionnaire et sombre',
        critique: 'L\'Attaque des Titans redéfinit complètement le genre. Cette série nous plonge dans un univers sombre et brutal où l\'humanité se bat pour sa survie. Les retournements de situation sont constants, les personnages évoluent de manière crédible.',
        notation: 9,
        id_membre: 2, // otaku_lover
        id_anime: 3, // Attack on Titan
        id_manga: null
      },
      // Demon Slayer review by manga_reader
      {
        nice_url: 'demon-slayer-review-reader',
        titre: 'Animation spectaculaire et émotions fortes',
        critique: 'Demon Slayer impressionne par la qualité exceptionnelle de son animation. Les scènes de combat sont d\'une fluidité remarquable, et les effets visuels des techniques de respiration sont magnifiques. Tanjiro est un protagoniste touchant.',
        notation: 8,
        id_membre: 3, // manga_reader  
        id_anime: 4, // Demon Slayer
        id_manga: null
      },
      // One Piece review by otaku_lover
      {
        nice_url: 'one-piece-review-otaku',
        titre: 'L\'aventure ultime ne s\'arrête jamais',
        critique: 'One Piece est plus qu\'un simple anime, c\'est une épopée extraordinaire qui nous fait voyager à travers les océans avec Luffy et son équipage. Chaque arc narratif apporte son lot d\'émotions, d\'action et de développement des personnages.',
        notation: 9,
        id_membre: 2, // otaku_lover
        id_anime: 5, // One Piece
        id_manga: null
      },
      // Your Name review by manga_reader
      {
        nice_url: 'your-name-review-reader',
        titre: 'Poésie visuelle et histoire d\'amour touchante',
        critique: 'Your Name est un film visuellement éblouissant qui mélange habilement fantastique et réalisme. Makoto Shinkai maîtrise parfaitement l\'art de raconter une histoire d\'amour à travers le temps et l\'espace.',
        notation: 9,
        id_membre: 3, // manga_reader
        id_anime: 6, // Your Name
        id_manga: null
      },
      // One Piece Manga review by admin
      {
        nice_url: 'one-piece-manga-review-admin',
        titre: 'Le manga qui a révolutionné le shonen',
        critique: 'One Piece manga d\'Eiichiro Oda est une œuvre magistrale qui ne cesse de nous surprendre. Après plus de 1000 chapitres, l\'histoire reste captivante et imprévisible. L\'univers créé est d\'une richesse incroyable.',
        notation: 10,
        id_membre: 1, // admin
        id_anime: null,
        id_manga: 1 // One Piece manga
      },
      // Naruto Manga review by otaku_lover
      {
        nice_url: 'naruto-manga-review-otaku', 
        titre: 'L\'évolution d\'un ninja légendaire',
        critique: 'Naruto nous raconte l\'histoire émouvante d\'un jeune ninja rejeté qui devient le héros de son village. Kishimoto a créé des personnages mémorables et des combats épiques. Une œuvre qui marque une génération.',
        notation: 8,
        id_membre: 2, // otaku_lover
        id_anime: null,
        id_manga: 2 // Naruto manga
      }
    ];
    
    // Insert each critique
    for (const critique of critiques) {
      const result = await client.query(`
        INSERT INTO ak_critique (nice_url, titre, critique, notation, id_membre, id_anime, id_manga, statut) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
        RETURNING id_critique
      `, [
        critique.nice_url, 
        critique.titre, 
        critique.critique, 
        critique.notation, 
        critique.id_membre, 
        critique.id_anime, 
        critique.id_manga
      ]);
      
      console.log(`✅ Added critique: "${critique.titre}" by user ${critique.id_membre}`);
    }
    
    // Show final statistics
    const stats = await client.query(`
      SELECT 
        u.pseudo,
        COUNT(c.id_critique) as critique_count
      FROM ak_users u
      LEFT JOIN ak_critique c ON u.id_membre = c.id_membre
      GROUP BY u.id_membre, u.pseudo
      ORDER BY u.id_membre
    `);
    
    console.log('\n📊 Critique distribution by user:');
    stats.rows.forEach(row => {
      console.log(`👤 ${row.pseudo}: ${row.critique_count} critiques`);
    });
    
    console.log('\n🎉 Critique data fixed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to fix critique data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  fixCritiqueData().catch(console.error);
}