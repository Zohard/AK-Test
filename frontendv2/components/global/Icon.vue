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

const iconComponent = computed(() => {
  if (props.name.startsWith('heroicons:')) {
    const iconName = props.name.replace('heroicons:', '')
    const variant = props.variant === 'mini' ? '20' : '24'
    const style = props.variant === 'solid' ? 'solid' : 'outline'
    
    // Minimal icon mapping - only icons actually used in the codebase
    const iconMap: Record<string, any> = {
      // Navigation & Arrows
      'arrow-left': () => import('@heroicons/vue/24/outline/ArrowLeftIcon.js'),
      'arrow-right': () => import('@heroicons/vue/24/outline/ArrowRightIcon.js'),
      'arrow-up': () => import('@heroicons/vue/24/outline/ArrowUpIcon.js'),
      'chevron-left': () => import('@heroicons/vue/24/outline/ChevronLeftIcon.js'),
      'chevron-right': () => import('@heroicons/vue/24/outline/ChevronRightIcon.js'),
      'chevron-up': () => import('@heroicons/vue/24/outline/ChevronUpIcon.js'),
      'chevron-down': () => import('@heroicons/vue/24/outline/ChevronDownIcon.js'),
      'chevron-up-down': () => import('@heroicons/vue/24/outline/ChevronUpDownIcon.js'),
      
      // Media & Content
      'film': () => import('@heroicons/vue/24/outline/FilmIcon.js'),
      'tv': () => import('@heroicons/vue/24/outline/TvIcon.js'),
      'photo': () => import('@heroicons/vue/24/outline/PhotoIcon.js'),
      'book-open': () => import('@heroicons/vue/24/outline/BookOpenIcon.js'),
      'play': () => import('@heroicons/vue/24/outline/PlayIcon.js'),
      'document-text': () => import('@heroicons/vue/24/outline/DocumentTextIcon.js'),
      
      // User & Account
      'user': () => import('@heroicons/vue/24/outline/UserIcon.js'),
      'user-circle': () => import('@heroicons/vue/24/outline/UserCircleIcon.js'),
      'user-plus': () => import('@heroicons/vue/24/outline/UserPlusIcon.js'),
      'user-minus': () => import('@heroicons/vue/24/outline/UserMinusIcon.js'),
      
      // Interactions
      'heart': () => import('@heroicons/vue/24/outline/HeartIcon.js'),
      'heart-solid': () => import('@heroicons/vue/24/solid/HeartIcon.js'),
      'star': () => import('@heroicons/vue/24/outline/StarIcon.js'),
      'star-solid': () => import('@heroicons/vue/24/solid/StarIcon.js'),
      'eye': () => import('@heroicons/vue/24/outline/EyeIcon.js'),
      'eye-slash': () => import('@heroicons/vue/24/outline/EyeSlashIcon.js'),
      'share': () => import('@heroicons/vue/24/outline/ShareIcon.js'),
      'bookmark': () => import('@heroicons/vue/24/outline/BookmarkIcon.js'),
      'bookmark-solid': () => import('@heroicons/vue/24/solid/BookmarkIcon.js'),
      
      // Interface Elements
      'x-mark': () => import('@heroicons/vue/24/outline/XMarkIcon.js'),
      'plus': () => import('@heroicons/vue/24/outline/PlusIcon.js'),
      'magnifying-glass': () => import('@heroicons/vue/24/outline/MagnifyingGlassIcon.js'),
      'funnel': () => import('@heroicons/vue/24/outline/FunnelIcon.js'),
      'bars-3': () => import('@heroicons/vue/24/outline/Bars3Icon.js'),
      'ellipsis-horizontal': () => import('@heroicons/vue/24/outline/EllipsisHorizontalIcon.js'),
      'ellipsis-vertical': () => import('@heroicons/vue/24/outline/EllipsisVerticalIcon.js'),
      'cog-6-tooth': () => import('@heroicons/vue/24/outline/Cog6ToothIcon.js'),
      
      // Status & Alerts
      'check': () => import('@heroicons/vue/24/outline/CheckIcon.js'),
      'check-circle': () => import('@heroicons/vue/24/outline/CheckCircleIcon.js'),
      'check-badge-solid': () => import('@heroicons/vue/24/solid/CheckBadgeIcon.js'),
      'exclamation-triangle': () => import('@heroicons/vue/24/outline/ExclamationTriangleIcon.js'),
      'exclamation-circle': () => import('@heroicons/vue/24/outline/ExclamationCircleIcon.js'),
      'information-circle': () => import('@heroicons/vue/24/outline/InformationCircleIcon.js'),
      'x-circle': () => import('@heroicons/vue/24/outline/XCircleIcon.js'),
      
      // Theme & Display
      'sun': () => import('@heroicons/vue/24/outline/SunIcon.js'),
      'moon': () => import('@heroicons/vue/24/outline/MoonIcon.js'),
      'computer-desktop': () => import('@heroicons/vue/24/outline/ComputerDesktopIcon.js'),
      
      // Communication
      'chat-bubble-left': () => import('@heroicons/vue/24/outline/ChatBubbleLeftIcon.js'),
      'chat-bubble-left-ellipsis': () => import('@heroicons/vue/24/outline/ChatBubbleLeftEllipsisIcon.js'),
      'chat-bubble-oval-left': () => import('@heroicons/vue/24/outline/ChatBubbleOvalLeftIcon.js'),
      'at-symbol': () => import('@heroicons/vue/24/outline/AtSymbolIcon.js'),
      
      // Time & Calendar
      'calendar': () => import('@heroicons/vue/24/outline/CalendarIcon.js'),
      'calendar-days': () => import('@heroicons/vue/24/outline/CalendarDaysIcon.js'),
      'clock': () => import('@heroicons/vue/24/outline/ClockIcon.js'),
      
      // Actions
      'arrow-path': () => import('@heroicons/vue/24/outline/ArrowPathIcon.js'),
      'arrow-down-tray': () => import('@heroicons/vue/24/outline/ArrowDownTrayIcon.js'),
      'arrow-top-right-on-square': () => import('@heroicons/vue/24/outline/ArrowTopRightOnSquareIcon.js'),
      'link': () => import('@heroicons/vue/24/outline/LinkIcon.js'),
      'printer': () => import('@heroicons/vue/24/outline/PrinterIcon.js'),
      
      // Tags & Organization
      'tag': () => import('@heroicons/vue/24/outline/TagIcon.js'),
      'hashtag': () => import('@heroicons/vue/24/outline/HashtagIcon.js'),
      'folder': () => import('@heroicons/vue/24/outline/FolderIcon.js'),
      
      // Location & Building
      'globe-alt': () => import('@heroicons/vue/24/outline/GlobeAltIcon.js'),
      'building-office': () => import('@heroicons/vue/24/outline/BuildingOfficeIcon.js'),
      'home': () => import('@heroicons/vue/24/outline/HomeIcon.js'),
      'map-pin': () => import('@heroicons/vue/24/outline/MapPinIcon.js'),
      
      // Development
      'code-bracket': () => import('@heroicons/vue/24/outline/CodeBracketIcon.js'),
      'command-line': () => import('@heroicons/vue/24/outline/CommandLineIcon.js'),
      
      // Sorting & Filtering
      'bars-arrow-down': () => import('@heroicons/vue/24/outline/BarsArrowDownIcon.js'),
      
      // Account Actions
      'arrow-right-on-rectangle': () => import('@heroicons/vue/24/outline/ArrowRightOnRectangleIcon.js'),
      'key': () => import('@heroicons/vue/24/outline/KeyIcon.js'),
      'identification': () => import('@heroicons/vue/24/outline/IdentificationIcon.js'),
      'envelope': () => import('@heroicons/vue/24/outline/EnvelopeIcon.js'),
      'lock-closed': () => import('@heroicons/vue/24/outline/LockClosedIcon.js'),
      'phone': () => import('@heroicons/vue/24/outline/PhoneIcon.js'),
      
      // Admin & Management
      'pencil-square': () => import('@heroicons/vue/24/outline/PencilSquareIcon.js'),
      'trash': () => import('@heroicons/vue/24/outline/TrashIcon.js'),
      'adjustments-horizontal': () => import('@heroicons/vue/24/outline/AdjustmentsHorizontalIcon.js'),
      'squares-2x2': () => import('@heroicons/vue/24/outline/Squares2X2Icon.js'),
      'list-bullet': () => import('@heroicons/vue/24/outline/ListBulletIcon.js'),
      'table-cells': () => import('@heroicons/vue/24/outline/TableCellsIcon.js')
    }
    
    try {
      const iconImport = iconMap[iconName]
      if (iconImport) {
        return defineAsyncComponent(iconImport)
      }
    } catch (error) {
      console.warn(`Icon not found: ${iconName}`)
    }
    
    return null
  }
  
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