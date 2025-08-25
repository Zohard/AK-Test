<template>
  <component 
    :is="iconComponent" 
    v-if="iconComponent" 
    :class="iconClasses" 
    :style="iconStyles"
  />
  <span v-else-if="customIcon" v-html="customIcon" :class="iconClasses" :style="iconStyles" />
  <span v-else :class="iconClasses">{{ name }}</span>
</template>

<script setup lang="ts">
interface Props {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'solid' | 'outline' | 'mini'
  color?: string
  animated?: boolean
  spin?: boolean
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'outline',
  animated: false,
  spin: false,
  pulse: false
})

const iconClasses = computed(() => {
  const sizeClasses = {
    'xs': 'w-3 h-3',
    'sm': 'w-4 h-4', 
    'md': 'w-5 h-5',
    'lg': 'w-6 h-6',
    'xl': 'w-8 h-8',
    '2xl': 'w-10 h-10'
  }
  
  return [
    sizeClasses[props.size],
    props.animated && 'transition-all duration-300 ease-in-out',
    props.spin && 'animate-spin',
    props.pulse && 'animate-pulse',
    'inline-block flex-shrink-0'
  ].filter(Boolean).join(' ')
})

const iconStyles = computed(() => {
  return props.color ? { color: props.color } : {}
})

// Automatically resolve Heroicons on demand. This keeps the bundle small
// while allowing any icon from the library to be used without manually
// maintaining a mapping list.
const icons24Outline = import.meta.glob('@heroicons/vue/24/outline/*Icon.js')
const icons24Solid = import.meta.glob('@heroicons/vue/24/solid/*Icon.js')
const icons20Solid = import.meta.glob('@heroicons/vue/20/solid/*Icon.js')

function toPascalCase(str: string) {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

const iconComponent = computed(() => {
  if (!props.name.startsWith('heroicons:')) return null

  let iconName = props.name.replace('heroicons:', '')
  let variant = props.variant

  if (iconName.endsWith('-solid')) {
    iconName = iconName.replace('-solid', '')
    variant = 'solid'
  }

  const size = variant === 'mini' ? '20' : '24'
  const style = variant === 'solid' || variant === 'mini' ? 'solid' : 'outline'

  const fileName = `${toPascalCase(iconName)}Icon.js`
  const collection =
    size === '20'
      ? icons20Solid
      : style === 'solid'
        ? icons24Solid
        : icons24Outline

  const path = Object.keys(collection).find(p => p.endsWith(`/${fileName}`))
  const importer = path ? collection[path] : undefined

  if (importer) {
    return defineAsyncComponent(importer as any)
  }

  console.warn(`Icon not found: ${iconName}`)
  return null
})

// Custom SVG icons for anime/manga specific elements
const customIcon = computed(() => {
  const customIcons: Record<string, string> = {
    'anime-kun': `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    `,
    'manga-book': `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
      </svg>
    `,
    'episode': `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    `,
    'season': `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    `,
    'studio': `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H21v2h-1.5v18h-15V4H3V2h1.5C5.33 2 6 2.67 6 3.5S5.33 5 4.5 5H4v12h16V5h-.5c-.83 0-1.5-.67-1.5-1.5S18.67 2 19.5 2z"/>
      </svg>
    `
  }
  
  return customIcons[props.name] || null
})
</script>
