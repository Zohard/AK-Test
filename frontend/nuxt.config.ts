// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/globals.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3001',
      forumUrl: process.env.FORUM_URL || 'http://localhost:8083'
    }
  },
  ssr: true,
  nitro: {
    devProxy: {
      '/api/images': {
        target: process.env.API_BASE_URL || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})