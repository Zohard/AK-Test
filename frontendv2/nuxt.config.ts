// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode'
  ],
  css: ['~/assets/css/globals.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3003',
      forumUrl: process.env.FORUM_URL || 'http://localhost:8083',
      siteUrl: process.env.SITE_URL || '',
      enablePlayground: process.env.ENABLE_PLAYGROUND === 'true'
    }
  },
  ssr: false,
  typescript: {
    strict: false,
    typeCheck: false
  },
  // Removed proxy - using direct API calls with CORS
  nitro: {
    devProxy: {}
  },
  devServer: {
    port: 3000,
    host: '0.0.0.0'
  },
  vite: {
    server: {
      port: 3000,
      host: '0.0.0.0'
    },
    define: {}
  },
  colorMode: {
    preference: 'system',
    fallback: 'light',
    hid: 'nuxt-color-mode-script',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '',
    storageKey: 'nuxt-color-mode'
  },
  components: {
    global: true,
    dirs: [
      '~/components',
      '~/components/global',
      '~/components/articles',
      '~/components/reviews'
    ]
  },
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    head: {
      title: 'Anime-Kun V2',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Découvrez et partagez vos animes et mangas préférés' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' }
  }
})
