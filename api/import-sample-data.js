#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'anime_user',
  password: 'anime_password',
  database: 'anime_kun',
  port: 5432,
});

async function importSampleData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting data import...');
    
    // Clear existing data
    await client.query('TRUNCATE TABLE ak_users RESTART IDENTITY CASCADE');
    await client.query('TRUNCATE TABLE ak_business RESTART IDENTITY CASCADE');
    console.log('✅ Cleared existing data');
    
    // Insert users
    console.log('👥 Importing users...');
    const userResult = await client.query(`
      INSERT INTO ak_users (pseudo, email, password, avatar, signature) VALUES 
      ('admin', 'admin@anime-kun.com', '$2b$10$example', 'admin-avatar.jpg', 'Administrateur du site'),
      ('otaku_lover', 'otaku@example.com', '$2b$10$example', 'otaku-avatar.jpg', 'Grand fan d''anime et manga'),
      ('manga_reader', 'reader@example.com', '$2b$10$example', 'reader-avatar.jpg', 'Lecteur passionné de manga')
      RETURNING id_membre
    `);
    console.log(`✅ Inserted ${userResult.rowCount} users`);
    
    // Insert business entities
    console.log('🏢 Importing business entities...');
    const businessResult = await client.query(`
      INSERT INTO ak_business (denomination, type, location, founded) VALUES 
      ('Studio Ghibli', 'Studio', 'Tokyo, Japan', '1985-06-15'),
      ('Toei Animation', 'Studio', 'Tokyo, Japan', '1956-01-23'),
      ('Shonen Jump', 'Publisher', 'Tokyo, Japan', '1968-08-01'),
      ('Kodansha', 'Publisher', 'Tokyo, Japan', '1909-10-01'),
      ('Madhouse', 'Studio', 'Tokyo, Japan', '1972-10-17')
      RETURNING id_business
    `);
    console.log(`✅ Inserted ${businessResult.rowCount} business entities`);
    
    // Insert animes
    console.log('📺 Importing animes...');
    const animeResult = await client.query(`
      INSERT INTO ak_animes (nice_url, titre, realisateur, annee, titre_orig, nb_ep, studio, synopsis, image, moyennenotes, nb_reviews, statut) VALUES 
      ('spirited-away', 'Le Voyage de Chihiro', 'Hayao Miyazaki', 2001, 'Sen to Chihiro no Kamikakushi', 1, 'Studio Ghibli', 'Chihiro, une fillette de 10 ans, découvre un monde parallèle peuplé de créatures étranges.', 'spirited-away.jpg', 9.5, 150, 1),
      ('attack-on-titan', 'L''Attaque des Titans', 'Tetsuro Araki', 2013, 'Shingeki no Kyojin', 87, 'Studio Pierrot', 'Dans un monde où l''humanité vit retranchée derrière d''immenses murailles.', 'attack-on-titan.jpg', 8.9, 2500, 1),
      ('demon-slayer', 'Demon Slayer', 'Haruo Sotozaki', 2019, 'Kimetsu no Yaiba', 44, 'Ufotable', 'Tanjiro Kamado devient un chasseur de démons.', 'demon-slayer.jpg', 8.7, 1800, 1),
      ('one-piece', 'One Piece', 'Eiichiro Oda', 1999, 'One Piece', 1000, 'Toei Animation', 'Monkey D. Luffy part à la recherche du trésor One Piece.', 'one-piece.jpg', 9.2, 5000, 1),
      ('your-name', 'Your Name', 'Makoto Shinkai', 2016, 'Kimi no Na wa', 1, 'CoMix Wave Films', 'Deux adolescents échangent mystérieusement leurs corps.', 'your-name.jpg', 8.4, 3200, 1)
      RETURNING id_anime
    `);
    console.log(`✅ Inserted ${animeResult.rowCount} animes`);
    
    // Insert mangas
    console.log('📚 Importing mangas...');
    const mangaResult = await client.query(`
      INSERT INTO ak_mangas (nice_url, titre, auteur, annee, origine, titre_orig, synopsis, image, moyennenotes, nb_reviews, statut) VALUES 
      ('one-piece-manga', 'One Piece', 'Eiichiro Oda', '1997', 'Japon', 'One Piece', 'Les aventures de Monkey D. Luffy et de son équipage.', 'one-piece-manga.jpg', 9.4, 8000, 1),
      ('naruto-manga', 'Naruto', 'Masashi Kishimoto', '1999', 'Japon', 'Naruto', 'L''histoire de Naruto Uzumaki, un jeune ninja.', 'naruto-manga.jpg', 8.8, 6500, 1),
      ('attack-on-titan-manga', 'L''Attaque des Titans', 'Hajime Isayama', '2009', 'Japon', 'Shingeki no Kyojin', 'L''humanité lutte contre les Titans géants.', 'attack-on-titan-manga.jpg', 9.1, 4200, 1)
      RETURNING id_manga
    `);
    console.log(`✅ Inserted ${mangaResult.rowCount} mangas`);
    
    // Insert critiques
    console.log('💭 Importing critiques...');
    const critiqueResult = await client.query(`
      INSERT INTO ak_critique (nice_url, titre, critique, notation, id_membre, id_anime, statut) VALUES 
      ('spirited-away-review-1', 'Un chef-d''œuvre intemporel', 'Le Voyage de Chihiro est sans conteste l''un des plus beaux films d''animation jamais créés.', 10, 1, 1, 1),
      ('attack-on-titan-review-1', 'Une œuvre révolutionnaire', 'L''Attaque des Titans redéfinit complètement le genre.', 9, 2, 2, 1),
      ('demon-slayer-review-1', 'Animation spectaculaire', 'Demon Slayer impressionne par la qualité exceptionnelle de son animation.', 8, 1, 3, 1)
      RETURNING id_critique
    `);
    console.log(`✅ Inserted ${critiqueResult.rowCount} critiques`);
    
    // Insert articles
    console.log('📝 Importing articles...');
    const articleResult = await client.query(`
      INSERT INTO ak_webzine_articles (titre, contenu, id_membre, statut) VALUES 
      ('Les studios d''animation japonais les plus influents', 'Le paysage de l''animation japonaise est dominé par quelques studios emblématiques...', 1, 1),
      ('L''évolution du manga shonen au 21e siècle', 'Le manga shonen a considérablement évolué depuis le début du 21e siècle...', 2, 1)
      RETURNING id_article
    `);
    console.log(`✅ Inserted ${articleResult.rowCount} articles`);
    
    // Show final counts
    console.log('\n📊 Final Statistics:');
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM ak_users) as users,
        (SELECT COUNT(*) FROM ak_animes) as animes,
        (SELECT COUNT(*) FROM ak_mangas) as mangas,
        (SELECT COUNT(*) FROM ak_critique) as critiques,
        (SELECT COUNT(*) FROM ak_business) as businesses,
        (SELECT COUNT(*) FROM ak_webzine_articles) as articles
    `);
    
    const counts = stats.rows[0];
    console.log(`👥 Users: ${counts.users}`);
    console.log(`📺 Animes: ${counts.animes}`);
    console.log(`📚 Mangas: ${counts.mangas}`);
    console.log(`💭 Critiques: ${counts.critiques}`);
    console.log(`🏢 Businesses: ${counts.businesses}`);
    console.log(`📝 Articles: ${counts.articles}`);
    
    console.log('\n🎉 Sample data import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  importSampleData().catch(console.error);
}