import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  // Register global Icon component
  return {
    provide: {
      icon: (name: string) => {
        if (name.startsWith('heroicons:')) {
          const iconName = name.replace('heroicons:', '')
          try {
            // Import heroicon dynamically
            return import(`@heroicons/vue/24/outline/index.js`).then(module => {
              const iconComponent = module[iconName.split('-').map((word: string) => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join('')]
              return iconComponent
            })
          } catch (error) {
            console.warn(`Icon ${name} not found`)
            return null
          }
        }
        return null
      }
    }
  }
})