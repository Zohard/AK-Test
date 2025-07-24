<template>
  <header class="header">
    <div class="header-container">
      <NuxtLink to="/" class="logo">
        <img src="/logo.png" alt="ANIME-KUN" class="logo-image" />
      </NuxtLink>
      
      <nav>
        <ul class="nav">
          <li><NuxtLink to="/">Accueil</NuxtLink></li>
          <li><NuxtLink to="/animes">Anime</NuxtLink></li>
          <li><NuxtLink to="/mangas">Manga</NuxtLink></li>
          <li><NuxtLink to="/critiques">Critiques</NuxtLink></li>
          <li><NuxtLink to="/articles">Webzine</NuxtLink></li>
          <li><NuxtLink to="/forum">Forum</NuxtLink></li>
        </ul>
      </nav>

      <div class="header-actions">
        <ThemeToggle :show-dropdown="true" />
        <NuxtLink to="/connexion" class="auth-link">
          Connexion / Inscription
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup>
// No need to destructure useDarkMode here since ThemeToggle handles it
</script>