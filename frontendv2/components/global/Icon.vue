<template>
  <component :is="iconComponent" v-if="iconComponent" :class="$attrs.class" />
  <span v-else :class="$attrs.class">{{ name }}</span>
</template>

<script setup lang="ts">
interface Props {
  name: string
}

const props = defineProps<Props>()

const iconComponent = computed(() => {
  if (props.name.startsWith('heroicons:')) {
    const iconName = props.name.replace('heroicons:', '')
    
    // Map icon names to components
    const iconMap: Record<string, any> = {
      'film': defineAsyncComponent(() => import('@heroicons/vue/24/outline/FilmIcon')),
      'star-solid': defineAsyncComponent(() => import('@heroicons/vue/24/solid/StarIcon')),
      'star': defineAsyncComponent(() => import('@heroicons/vue/24/outline/StarIcon')),
      'heart': defineAsyncComponent(() => import('@heroicons/vue/24/outline/HeartIcon')),
      'heart-solid': defineAsyncComponent(() => import('@heroicons/vue/24/solid/HeartIcon')),
      'share': defineAsyncComponent(() => import('@heroicons/vue/24/outline/ShareIcon')),
      'exclamation-triangle': defineAsyncComponent(() => import('@heroicons/vue/24/outline/ExclamationTriangleIcon')),
      'book-open': defineAsyncComponent(() => import('@heroicons/vue/24/outline/BookOpenIcon')),
      'chevron-left': defineAsyncComponent(() => import('@heroicons/vue/24/outline/ChevronLeftIcon')),
      'chevron-right': defineAsyncComponent(() => import('@heroicons/vue/24/outline/ChevronRightIcon')),
      'magnifying-glass': defineAsyncComponent(() => import('@heroicons/vue/24/outline/MagnifyingGlassIcon')),
      'moon': defineAsyncComponent(() => import('@heroicons/vue/24/outline/MoonIcon')),
      'sun': defineAsyncComponent(() => import('@heroicons/vue/24/outline/SunIcon')),
      'bars-3': defineAsyncComponent(() => import('@heroicons/vue/24/outline/Bars3Icon')),
      'x-mark': defineAsyncComponent(() => import('@heroicons/vue/24/outline/XMarkIcon')),
      'user': defineAsyncComponent(() => import('@heroicons/vue/24/outline/UserIcon')),
      'play': defineAsyncComponent(() => import('@heroicons/vue/24/outline/PlayIcon')),
      'at-symbol': defineAsyncComponent(() => import('@heroicons/vue/24/outline/AtSymbolIcon')),
      'chat-bubble-left': defineAsyncComponent(() => import('@heroicons/vue/24/outline/ChatBubbleLeftIcon')),
      'code-bracket': defineAsyncComponent(() => import('@heroicons/vue/24/outline/CodeBracketIcon')),
      'information-circle': defineAsyncComponent(() => import('@heroicons/vue/24/outline/InformationCircleIcon')),
      'bell': defineAsyncComponent(() => import('@heroicons/vue/24/outline/BellIcon')),
      'cog-6-tooth': defineAsyncComponent(() => import('@heroicons/vue/24/outline/Cog6ToothIcon')),
      'arrow-right-on-rectangle': defineAsyncComponent(() => import('@heroicons/vue/24/outline/ArrowRightOnRectangleIcon')),
    }
    
    return iconMap[iconName] || null
  }
  
  return null
})
</script>