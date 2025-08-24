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
    
    // Comprehensive icon mapping with all variants
    const iconMap: Record<string, any> = {
      // Media & Entertainment
      'film': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/FilmIcon`)),
      'play': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/PlayIcon`)),
      'pause': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/PauseIcon`)),
      'stop': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/StopIcon`)),
      'tv': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/TvIcon`)),
      'music': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/MusicalNoteIcon`)),
      'camera': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/CameraIcon`)),
      'photo': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/PhotoIcon`)),
      'video': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/VideoCameraIcon`)),
      
      // Rating & Feedback
      'star': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/StarIcon`)),
      'heart': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/HeartIcon`)),
      'thumbs-up': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/HandThumbUpIcon`)),
      'thumbs-down': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/HandThumbDownIcon`)),
      'fire': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/FireIcon`)),
      'lightning-bolt': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/BoltIcon`)),
      
      // Navigation & Actions
      'chevron-left': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ChevronLeftIcon`)),
      'chevron-right': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ChevronRightIcon`)),
      'chevron-up': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ChevronUpIcon`)),
      'chevron-down': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ChevronDownIcon`)),
      'arrow-left': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ArrowLeftIcon`)),
      'arrow-right': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ArrowRightIcon`)),
      'arrow-up': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ArrowUpIcon`)),
      'arrow-down': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ArrowDownIcon`)),
      'plus': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/PlusIcon`)),
      'minus': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/MinusIcon`)),
      'x-mark': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/XMarkIcon`)),
      'check': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/CheckIcon`)),
      
      // Social & Sharing
      'share': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ShareIcon`)),
      'link': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/LinkIcon`)),
      'at-symbol': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/AtSymbolIcon`)),
      'chat-bubble-left': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ChatBubbleLeftIcon`)),
      'chat-bubble-left-right': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ChatBubbleLeftRightIcon`)),
      'rss': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/RssIcon`)),
      
      // Content & Reading
      'book-open': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/BookOpenIcon`)),
      'document-text': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/DocumentTextIcon`)),
      'newspaper': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/NewspaperIcon`)),
      'academic-cap': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/AcademicCapIcon`)),
      'pencil': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/PencilIcon`)),
      'pencil-square': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/PencilSquareIcon`)),
      
      // User & Account
      'user': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/UserIcon`)),
      'user-circle': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/UserCircleIcon`)),
      'user-group': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/UserGroupIcon`)),
      'user-plus': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/UserPlusIcon`)),
      'identification': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/IdentificationIcon`)),
      
      // Interface & System
      'bars-3': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/Bars3Icon`)),
      'ellipsis-horizontal': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/EllipsisHorizontalIcon`)),
      'ellipsis-vertical': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/EllipsisVerticalIcon`)),
      'magnifying-glass': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/MagnifyingGlassIcon`)),
      'funnel': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/FunnelIcon`)),
      'adjustments-horizontal': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/AdjustmentsHorizontalIcon`)),
      'cog-6-tooth': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/Cog6ToothIcon`)),
      'cog-8-tooth': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/Cog8ToothIcon`)),
      
      // Notifications & Status
      'bell': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/BellIcon`)),
      'bell-alert': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/BellAlertIcon`)),
      'exclamation-triangle': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ExclamationTriangleIcon`)),
      'exclamation-circle': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ExclamationCircleIcon`)),
      'information-circle': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/InformationCircleIcon`)),
      'check-circle': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/CheckCircleIcon`)),
      'x-circle': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/XCircleIcon`)),
      'question-mark-circle': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/QuestionMarkCircleIcon`)),
      
      // Theme & Display
      'sun': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/SunIcon`)),
      'moon': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/MoonIcon`)),
      'computer-desktop': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ComputerDesktopIcon`)),
      'device-phone-mobile': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/DevicePhoneMobileIcon`)),
      'device-tablet': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/DeviceTabletIcon`)),
      'eye': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/EyeIcon`)),
      'eye-slash': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/EyeSlashIcon`)),
      
      // Tags & Categories
      'tag': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/TagIcon`)),
      'hashtag': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/HashtagIcon`)),
      'bookmark': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/BookmarkIcon`)),
      'folder': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/FolderIcon`)),
      'folder-open': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/FolderOpenIcon`)),
      'archive-box': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ArchiveBoxIcon`)),
      
      // Actions & Controls
      'arrow-right-on-rectangle': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ArrowRightOnRectangleIcon`)),
      'arrow-left-on-rectangle': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ArrowLeftOnRectangleIcon`)),
      'power': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/PowerIcon`)),
      'refresh': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ArrowPathIcon`)),
      'download': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ArrowDownTrayIcon`)),
      'upload': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ArrowUpTrayIcon`)),
      'trash': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/TrashIcon`)),
      
      // Lists & Organization
      'list-bullet': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ListBulletIcon`)),
      'queue-list': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/QueueListIcon`)),
      'rectangle-stack': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/RectangleStackIcon`)),
      'squares-2x2': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/Squares2X2Icon`)),
      'squares-plus': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/SquaresPlusIcon`)),
      'table-cells': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/TableCellsIcon`)),
      
      // Communication & Messages
      'envelope': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/EnvelopeIcon`)),
      'envelope-open': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/EnvelopeOpenIcon`)),
      'inbox': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/InboxIcon`)),
      'inbox-arrow-down': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/InboxArrowDownIcon`)),
      'paper-airplane': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/PaperAirplaneIcon`)),
      'megaphone': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/MegaphoneIcon`)),
      'speaker-wave': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/SpeakerWaveIcon`)),
      
      // Time & Calendar
      'calendar': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/CalendarIcon`)),
      'calendar-days': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/CalendarDaysIcon`)),
      'clock': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/ClockIcon`)),
      'hourglass': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/HourglassIcon`)),
      'stopwatch': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/StopwatchIcon`)),
      
      // Code & Development
      'code-bracket': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/CodeBracketIcon`)),
      'code-bracket-square': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/CodeBracketSquareIcon`)),
      'command-line': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/CommandLineIcon`)),
      'bug-ant': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/BugAntIcon`)),
      'cpu-chip': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/CpuChipIcon`)),
      
      // Maps & Location
      'map': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/MapIcon`)),
      'map-pin': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/MapPinIcon`)),
      'globe-alt': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/GlobeAltIcon`)),
      'building-office': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/BuildingOfficeIcon`)),
      'home': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/HomeIcon`)),
      // Note: HomeModernIcon might not exist in all variants, using regular HomeIcon as fallback
      'home-modern': defineAsyncComponent(() => import(`@heroicons/vue/${variant}/${style}/HomeIcon`))
    }
    
    return iconMap[iconName] || null
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