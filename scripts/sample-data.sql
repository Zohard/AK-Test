-- Sample data for testing PostgreSQL setup
-- Insert sample users (avoiding generated columns)
INSERT INTO ak_users (pseudo, email, password, avatar, signature) VALUES 
('admin', 'admin@anime-kun.com', '$2b$10$example', 'admin-avatar.jpg', 'Administrateur du site'),
('otaku_lover', 'otaku@example.com', '$2b$10$example', 'otaku-avatar.jpg', 'Grand fan d''anime et manga'),
('manga_reader', 'reader@example.com', '$2b$10$example', 'reader-avatar.jpg', 'Lecteur passionné de manga');

-- Insert sample business entities
INSERT INTO ak_business (denomination, type, location, founded) VALUES 
('Studio Ghibli', 'Studio', 'Tokyo, Japan', '1985-06-15'),
('Toei Animation', 'Studio', 'Tokyo, Japan', '1956-01-23'),
('Shonen Jump', 'Publisher', 'Tokyo, Japan', '1968-08-01'),
('Kodansha', 'Publisher', 'Tokyo, Japan', '1909-10-01'),
('Madhouse', 'Studio', 'Tokyo, Japan', '1972-10-17');

-- Insert sample animes
INSERT INTO ak_animes (nice_url, titre, realisateur, annee, titre_orig, nb_ep, studio, synopsis, image, moyennenotes, nb_reviews, statut) VALUES 
(
    'spirited-away',
    'Le Voyage de Chihiro',
    'Hayao Miyazaki',
    2001,
    'Sen to Chihiro no Kamikakushi',
    1,
    'Studio Ghibli',
    'Chihiro, une fillette de 10 ans, découvre un monde parallèle peuplé de créatures étranges où elle devra sauver ses parents transformés en cochons.',
    'spirited-away.jpg',
    9.5,
    150,
    1
),
(
    'attack-on-titan',
    'L''Attaque des Titans',
    'Tetsuro Araki',
    2013,
    'Shingeki no Kyojin',
    87,
    'Studio Pierrot',
    'Dans un monde où l''humanité vit retranchée derrière d''immenses murailles pour se protéger des Titans, Eren Yeager rêve de liberté.',
    'attack-on-titan.jpg',
    8.9,
    2500,
    1
),
(
    'demon-slayer',
    'Demon Slayer',
    'Haruo Sotozaki',
    2019,
    'Kimetsu no Yaiba',
    44,
    'Ufotable',
    'Tanjiro Kamado devient un chasseur de démons pour sauver sa sœur transformée en démon et venger sa famille.',
    'demon-slayer.jpg',
    8.7,
    1800,
    1
),
(
    'one-piece',
    'One Piece',
    'Eiichiro Oda',
    1999,
    'One Piece',
    1000,
    'Toei Animation',
    'Monkey D. Luffy, un pirate au corps élastique, part à la recherche du trésor légendaire "One Piece" pour devenir le Roi des Pirates.',
    'one-piece.jpg',
    9.2,
    5000,
    1
),
(
    'your-name',
    'Your Name',
    'Makoto Shinkai',
    2016,
    'Kimi no Na wa',
    1,
    'CoMix Wave Films',
    'Deux adolescents qui ne se connaissent pas échangent mystérieusement leurs corps et tentent de se retrouver.',
    'your-name.jpg',
    8.4,
    3200,
    1
);

-- Insert sample mangas
INSERT INTO ak_mangas (nice_url, titre, auteur, annee, origine, titre_orig, synopsis, image, moyennenotes, nb_reviews, statut) VALUES 
(
    'one-piece-manga',
    'One Piece',
    'Eiichiro Oda',
    '1997',
    'Japon',
    'One Piece',
    'Les aventures de Monkey D. Luffy et de son équipage de pirates à la recherche du trésor ultime.',
    'one-piece-manga.jpg',
    9.4,
    8000,
    1
),
(
    'naruto-manga',
    'Naruto',
    'Masashi Kishimoto', 
    '1999',
    'Japon',
    'Naruto',
    'L''histoire de Naruto Uzumaki, un jeune ninja qui rêve de devenir Hokage de son village.',
    'naruto-manga.jpg',
    8.8,
    6500,
    1
),
(
    'attack-on-titan-manga',
    'L''Attaque des Titans',
    'Hajime Isayama',
    '2009', 
    'Japon',
    'Shingeki no Kyojin',
    'L''humanité lutte pour sa survie contre les mystérieux Titans géants.',
    'attack-on-titan-manga.jpg',
    9.1,
    4200,
    1
);

-- Insert sample critiques
INSERT INTO ak_critique (nice_url, titre, critique, notation, id_membre, id_anime, id_manga, statut) VALUES 
(
    'spirited-away-review-1',
    'Un chef-d''œuvre intemporel',
    'Le Voyage de Chihiro est sans conteste l''un des plus beaux films d''animation jamais créés. Miyazaki nous transporte dans un monde magique où chaque détail compte. L''histoire de Chihiro, cette petite fille courageuse, nous enseigne l''importance de la persévérance et de l''amitié. Les personnages sont attachants, l''animation est sublime, et la bande sonore de Joe Hisaishi est époustouflante. Un film qui marque à vie.',
    10,
    1,
    1,
    NULL,
    1
),
(
    'attack-on-titan-review-1', 
    'Une œuvre révolutionnaire',
    'L''Attaque des Titans redéfinit complètement le genre. Cette série nous plonge dans un univers sombre et brutal où l''humanité se bat pour sa survie. Les retournements de situation sont constants, les personnages évoluent de manière crédible, et l''intrigue devient de plus en plus complexe au fil des saisons. Une œuvre mature qui n''hésite pas à aborder des thèmes profonds comme la liberté, le pouvoir et la nature humaine.',
    9,
    2,
    2,
    NULL,
    1
),
(
    'one-piece-manga-review-1',
    'L''aventure ultime',
    'One Piece est plus qu''un simple manga, c''est une épopée extraordinaire qui nous fait voyager à travers les océans avec Luffy et son équipage. Oda a créé un univers riche et cohérent, peuplé de personnages mémorables. Chaque arc narratif apporte son lot d''émotions, d''action et de développement des personnages. Après plus de 1000 chapitres, l''histoire reste captivante et imprévisible.',
    10,
    3,
    NULL,
    1,
    1
),
(
    'demon-slayer-review-1',
    'Animation spectaculaire',
    'Demon Slayer impressionne par la qualité exceptionnelle de son animation. Les scènes de combat sont d''une fluidité remarquable, et les effets visuels des techniques de respiration sont magnifiques. L''histoire, bien que classique dans sa structure, est servie par des personnages attachants et une réalisation soignée. Tanjiro est un protagoniste touchant, et sa relation avec sa sœur Nezuko forme le cœur émotionnel de l''œuvre.',
    8,
    1,
    3,
    NULL,
    1
),
(
    'your-name-review-1',
    'Poésie visuelle',
    'Your Name est un film visuellement éblouissant qui mélange habilement fantastique et réalisme. Makoto Shinkai maîtrise parfaitement l''art de raconter une histoire d''amour à travers le temps et l''espace. Les paysages sont d''un réalisme saisissant, la musique de RADWIMPS sublime chaque scène, et l''intrigue nous tient en haleine jusqu''au bout. Un film qui ne laisse personne indifférent.',
    9,
    2,
    5,
    NULL,
    1
);

-- Insert sample business relationships
INSERT INTO ak_business_to_animes (id_anime, id_business, type, precisions) VALUES 
(1, 1, 'Studio', 'Studio de production principal'),
(2, 3, 'Studio', 'Studio de production principal'), 
(3, 5, 'Studio', 'Studio de production principal'),
(4, 2, 'Studio', 'Studio de production principal');

INSERT INTO ak_business_to_mangas (id_manga, id_business, type, precisions) VALUES 
(1, 3, 'Publisher', 'Éditeur principal au Japon'),
(2, 3, 'Publisher', 'Éditeur principal au Japon'),
(3, 4, 'Publisher', 'Éditeur principal au Japon');

-- Insert sample articles  
INSERT INTO ak_webzine_articles (titre, contenu, id_membre, statut) VALUES 
(
    'Les studios d''animation japonais les plus influents',
    'Le paysage de l''animation japonaise est dominé par quelques studios emblématiques qui ont marqué l''histoire du medium. Studio Ghibli, fondé par Hayao Miyazaki et Isao Takahata, a révolutionné l''animation avec des œuvres comme "Le Voyage de Chihiro" et "Princesse Mononoké". Madhouse, connu pour ses adaptations fidèles de mangas populaires, a produit des séries cultes comme "Death Note" et "One Punch Man". Toei Animation, l''un des plus anciens studios, continue de produire des franchises iconiques comme "Dragon Ball" et "One Piece". Ces studios ont façonné l''identité visuelle de l''anime moderne et continuent d''influencer les nouvelles générations de créateurs.',
    1,
    1
),
(
    'L''évolution du manga shonen au 21e siècle',
    'Le manga shonen a considérablement évolué depuis le début du 21e siècle. Des œuvres comme "Naruto", "One Piece" et "Bleach" ont dominé les années 2000, établissant de nouveaux standards en termes de longueur narrative et de développement des personnages. La décennie suivante a vu l''émergence de séries plus courtes mais non moins impactantes comme "Demon Slayer" et "Jujutsu Kaisen". Ces nouvelles œuvres se distinguent par une animation de qualité cinématographique et des thèmes plus matures. L''influence des réseaux sociaux et du streaming a également transformé la façon dont le public découvre et consomme ces contenus, créant des phénomènes viraux mondiaux.',
    2,
    1
);

-- Insert article authors relationships
INSERT INTO ak_article_authors (id_article, id_membre) VALUES 
(1, 1),
(2, 2);

-- Update sequences
SELECT setval('ak_users_id_membre_seq', (SELECT MAX(id_membre) FROM ak_users));
SELECT setval('ak_animes_id_anime_seq', (SELECT MAX(id_anime) FROM ak_animes)); 
SELECT setval('ak_mangas_id_manga_seq', (SELECT MAX(id_manga) FROM ak_mangas));
SELECT setval('ak_critique_id_critique_seq', (SELECT MAX(id_critique) FROM ak_critique));
SELECT setval('ak_business_id_business_seq', (SELECT MAX(id_business) FROM ak_business));
SELECT setval('ak_webzine_articles_id_article_seq', (SELECT MAX(id_article) FROM ak_webzine_articles));