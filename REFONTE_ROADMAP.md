# Feuille de Route - Refonte Anime-Kun vers NestJS/TypeScript

## Vue d'ensemble

Transition progressive de l'API Express.js actuelle vers une architecture NestJS moderne selon le cahier des charges.

## Phase 1 : Préparation et Infrastructure (2-3 semaines)

### 1.1 Setup TypeScript et NestJS
- [ ] Initialiser nouveau projet NestJS avec TypeScript
- [ ] Configuration ESLint, Prettier, Jest pour TypeScript
- [ ] Migration des variables d'environnement (.env)
- [ ] Setup Docker avec hot-reload TypeScript

### 1.2 Configuration Base de Données
- [ ] Évaluer et choisir l'ORM (Prisma vs TypeORM vs Drizzle)
- [ ] Générer les entités TypeScript depuis le schéma PostgreSQL existant
- [ ] Configuration de la connexion avec pool de connexions
- [ ] Migration du système de backup

### 1.3 Structure Projet NestJS
```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── guards/          # AuthGuard, RolesGuard
│   ├── interceptors/    # LoggingInterceptor, TransformInterceptor
│   ├── pipes/          # ValidationPipe
│   ├── filters/        # ExceptionFilter
│   └── decorators/     # Roles, CurrentUser
├── config/
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── swagger.config.ts
├── modules/
│   ├── auth/
│   ├── users/
│   ├── animes/
│   ├── mangas/
│   ├── reviews/
│   ├── admin/
│   └── business/
└── shared/
    ├── dtos/
    ├── entities/
    └── types/
```

## Phase 2 : Modules Core (3-4 semaines)

### 2.1 Module Auth (Priorité 1)
- [ ] Conversion JWT middleware vers NestJS Guards
- [ ] DTOs pour login/register avec class-validator
- [ ] Service d'authentification avec bcrypt
- [ ] Passport local + JWT strategy
- [ ] Tests unitaires auth.service

### 2.2 Module Users
- [ ] Entity User avec TypeORM/Prisma
- [ ] CRUD utilisateurs avec DTOs
- [ ] Service gestion profils
- [ ] Guard pour propriétaire de ressource
- [ ] Tests unitaires users.service

### 2.3 Module RBAC
- [ ] Entity Roles et Permissions
- [ ] RolesGuard avec décorateurs @Roles()
- [ ] Service gestion des rôles
- [ ] Tests des permissions

## Phase 3 : Modules Métier (4-5 semaines)

### 3.1 Module Animes
- [ ] Migration des 478 lignes anime.js
- [ ] Entity Anime avec relations
- [ ] DTOs create/update avec validation
- [ ] Service business logic
- [ ] Controller avec Swagger
- [ ] Tests e2e

### 3.2 Module Mangas
- [ ] Migration similaire au module Animes
- [ ] Factorisation du code commun avec Animes
- [ ] Service de recherche unifié

### 3.3 Module Reviews
- [ ] Entity Review avec relations User/Anime/Manga
- [ ] Validation contenu et modération
- [ ] Service notation et agrégation

## Phase 4 : Administration (3-4 semaines)

### 4.1 Refactoring Admin Routes
- [ ] Décomposer les 3964 lignes admin.js
- [ ] Modules séparés : AdminUsers, AdminContent, AdminModeration
- [ ] Interface admin avec contrôle d'accès granulaire
- [ ] Audit logs pour actions sensibles

### 4.2 Système de Modération
- [ ] Queue système avec BullMQ
- [ ] Workflow validation contenu
- [ ] Notifications administrateurs

## Phase 5 : Fonctionnalités Avancées (2-3 semaines)

### 5.1 Upload et Médias
- [ ] Migration Multer vers NestJS
- [ ] Service cloud storage (Supabase/AWS S3)
- [ ] Traitement images (redimensionnement, compression)
- [ ] CDN intégration

### 5.2 Recherche
- [ ] Intégration MeiliSearch ou Elasticsearch
- [ ] Service de recommandations
- [ ] Cache Redis pour performances

### 5.3 Notifications
- [ ] Service email avec templates
- [ ] Notifications real-time (WebSocket)
- [ ] Préférences utilisateur

## Phase 6 : Tests et Documentation (2 semaines)

### 6.1 Tests
- [ ] Tests unitaires (>80% couverture)
- [ ] Tests d'intégration
- [ ] Tests e2e avec Supertest
- [ ] Tests de charge

### 6.2 Documentation
- [ ] Documentation OpenAPI complète
- [ ] Guide migration de l'ancien API
- [ ] Documentation développeur

## Phase 7 : Déploiement et Migration (1-2 semaines)

### 7.1 CI/CD
- [ ] Pipeline GitHub Actions/GitLab CI
- [ ] Tests automatiques
- [ ] Déploiement containerisé

### 7.2 Migration Production
- [ ] Stratégie blue-green deployment
- [ ] Migration graduelle des endpoints
- [ ] Monitoring et rollback

## Comparaison Express vs NestJS

### Avantages NestJS pour Anime-Kun
- **Architecture modulaire** : Organisation naturelle en modules métier
- **TypeScript natif** : Typage sûr, meilleur IDE support
- **Injection de dépendances** : Tests plus faciles, code découplé
- **Validation automatique** : class-validator intégré
- **Swagger intégré** : Documentation générée automatiquement
- **Guards/Interceptors** : Gestion transversale (auth, logs, cache)
- **Exception filters** : Gestion d'erreurs centralisée

### Estimation Effort
- **Express actuel** : ~6825 lignes à maintenir manuellement
- **NestJS** : Structure imposée, conventions partagées
- **ROI** : Réduction 30% temps développement après migration

## Choix Techniques Recommandés

### ORM : Prisma
- Génération client type-safe
- Migrations déclaratives
- Studio pour visualisation
- Performance optimisée

### Base PostgreSQL : Supabase
- Serverless avec scale-to-zero
- Storage intégré
- Real-time capabilities
- Coût réduit (~25$/mois vs infrastructure dédiée)

### Cache : Redis
- Session storage
- Cache requêtes fréquentes
- Queue jobs (BullMQ)

## Critères de Succès
- [ ] 100% compatibilité API existante
- [ ] Tests >80% couverture
- [ ] Performance équivalente ou meilleure
- [ ] Documentation complète
- [ ] Zero downtime migration

## Ressources Nécessaires
- **Développeur Senior NestJS/TypeScript** : 3-4 mois
- **Infrastructure** : Supabase Pro (~$25/mois) + Redis (~$15/mois)
- **Outils** : GitHub Actions, monitoring (Sentry)

Cette approche garantit une transition progressive tout en modernisant l'architecture selon les standards 2025.