# Anime-Kun Frontend V2

Frontend moderne pour Anime-Kun utilisant Nuxt 3, Vue 3, et TypeScript, conçu pour se connecter à l'API NestJS.

## 🚀 Fonctionnalités

- **Nuxt 3** avec Vue 3 et TypeScript
- **Authentification JWT** avec refresh tokens
- **Interface moderne** avec TailwindCSS et mode sombre
- **Recherche en temps réel** avec autocomplete
- **Gestion d'état** avec Pinia
- **Responsive design** optimisé mobile
- **SEO optimisé** avec meta tags dynamiques
- **Performance** avec lazy loading et mise en cache

## 📦 Stack Technique

- **Framework**: Nuxt 3.8+
- **Language**: TypeScript
- **UI**: TailwindCSS + Headless UI
- **Icons**: Heroicons
- **State Management**: Pinia
- **HTTP Client**: $fetch (Nuxt)
- **Authentification**: JWT avec refresh tokens
- **Thème**: Mode clair/sombre avec @nuxtjs/color-mode

## 🛠️ Installation

```bash
# Cloner le projet
git clone <repo-url>
cd frontendv2

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build

# Prévisualiser la build
npm run preview
```

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` :

```env
# API Configuration
API_BASE_URL=http://localhost:3000
FORUM_URL=http://localhost:8083

# Development
NUXT_DEVTOOLS=true
```

### Configuration API

Le frontend est configuré pour se connecter à l'API NestJS sur le port 3000. Assurez-vous que l'API est démarrée avant le frontend.

## 📁 Structure du Projet

```
frontendv2/
├── assets/
│   └── css/              # Styles globaux
├── components/           # Composants Vue réutilisables
│   ├── TheHeader.vue
│   ├── TheFooter.vue
│   ├── ThemeToggle.vue
│   ├── SearchBar.vue
│   └── AnimeCard.vue
├── composables/          # Fonctions composables
├── layouts/              # Layouts Nuxt
│   └── default.vue
├── middleware/           # Middleware Nuxt
├── pages/                # Pages de l'application
│   ├── index.vue         # Page d'accueil
│   ├── login.vue         # Connexion
│   ├── register.vue      # Inscription
│   ├── animes.vue        # Liste des animes
│   └── mangas.vue        # Liste des mangas
├── plugins/              # Plugins Nuxt
│   └── api-interceptor.client.ts
├── stores/               # Stores Pinia
│   └── auth.ts           # Store d'authentification
├── types/                # Types TypeScript
│   └── index.ts
└── utils/                # Utilitaires
```

## 🔐 Authentification

Le système d'authentification utilise JWT avec refresh tokens :

```typescript
// Login
const authStore = useAuthStore()
await authStore.login({ email, password })

// Logout
await authStore.logout()

// Vérifier l'authentification
if (authStore.isAuthenticated) {
  // Utilisateur connecté
}

// Headers pour les requêtes authentifiées
const headers = authStore.getAuthHeaders()
```

## 🎨 Thèmes

Support du mode clair/sombre automatique :

```vue
<template>
  <ThemeToggle />
</template>
```

## 📱 Pages Disponibles

### ✅ Implémentées

- **Accueil** (`/`) - Page d'accueil avec statistiques
- **Connexion** (`/login`) - Authentification utilisateur
- **Inscription** (`/register`) - Création de compte
- **Animes** (`/animes`) - Liste des animes avec filtres
- **Mangas** (`/mangas`) - Placeholder pour les mangas

### 🚧 À implémenter

- **Détail anime** (`/animes/[id]`) - Page de détail d'un anime
- **Détail manga** (`/mangas/[id]`) - Page de détail d'un manga
- **Critiques** (`/reviews`) - Liste des critiques
- **Articles** (`/articles`) - Articles de blog
- **Profil** (`/profile`) - Profil utilisateur
- **Administration** (`/admin`) - Interface d'administration
- **Recherche** (`/search`) - Résultats de recherche

## 🔧 Développement

### Scripts disponibles

```bash
# Développement
npm run dev

# Build
npm run build

# Preview
npm run preview

# Tests (à configurer)
npm run test

# Linting (à configurer)
npm run lint
```

### Ajout de nouvelles pages

1. Créer le fichier dans `pages/`
2. Ajouter les types nécessaires dans `types/index.ts`
3. Créer les composables si nécessaire
4. Mettre à jour la navigation dans `TheHeader.vue`

### Ajout de composants

1. Créer le composant dans `components/`
2. Utiliser TypeScript avec `defineProps` et `defineEmits`
3. Suivre les conventions de nommage
4. Ajouter les styles avec TailwindCSS

## 🚀 Déploiement

### Docker

```bash
# Build l'image Docker
docker build -t anime-kun-frontendv2 .

# Lancer le conteneur
docker run -p 3000:3000 anime-kun-frontendv2
```

### Production

```bash
# Build pour production
npm run build

# Lancer en production
npm run preview
```

## 🔗 Intégration API

Le frontend est conçu pour fonctionner avec l'API NestJS :

### Endpoints principaux

- `POST /auth/login` - Connexion
- `POST /auth/register` - Inscription
- `GET /animes` - Liste des animes
- `GET /animes/:id` - Détail d'un anime
- `GET /search` - Recherche globale

### Gestion des erreurs

Les erreurs API sont gérées automatiquement avec des intercepteurs HTTP et des refresh tokens automatiques.

## 🎯 Prochaines étapes

1. **Phase 2** : Implémenter les pages de détail
2. **Phase 3** : Système de critiques complet
3. **Phase 4** : Interface d'administration
4. **Phase 5** : Notifications en temps réel
5. **Phase 6** : PWA et optimisations

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.