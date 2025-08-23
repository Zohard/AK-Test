export function useImageUrl() {
  const config = useRuntimeConfig()

  const getImageUrl = (imagePath: string, type: 'anime' | 'manga' = 'anime') => {
    if (!imagePath) return null
    
    // Handle different image path formats
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    
    // If path already starts with /api/, it's already a complete API path
    if (imagePath.startsWith('/api/')) {
      return `${config.public.apiBase}${imagePath}`
    }
    
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
    
    // Use NestJS API to serve images (supports dynamic uploads)
    return `${config.public.apiBase}/api/media/serve/${type}/${cleanPath}`
  }

  const getDirectApiUrl = (path: string) => {
    if (!path) return null
    
    if (path.startsWith('http')) {
      return path
    }
    
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return `${config.public.apiBase}/${cleanPath}`
  }

  const getAvatarUrl = (avatarPath?: string, userId?: number) => {
    if (avatarPath) {
      return getDirectApiUrl(`avatars/${avatarPath}`)
    }
    
    // Default avatar or generate from user ID
    if (userId) {
      return `https://ui-avatars.com/api/?name=User+${userId}&background=3b82f6&color=fff&size=128`
    }
    
    return `https://ui-avatars.com/api/?name=User&background=6b7280&color=fff&size=128`
  }

  const getArticleImageUrl = (imagePath: string) => {
    if (!imagePath) return null
    
    // Handle different image path formats for articles
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    
    // If it's a webzine image, transform it
    const webzineMatch = imagePath.match(/webzine\/img\/([^\/\?]+)/)
    if (webzineMatch && webzineMatch[1]) {
      return `${config.public.apiBase}/api/webzine/img/${webzineMatch[1]}`
    }
    
    // For direct paths to images, serve them directly from public folder
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
    return `/images/${cleanPath}`
  }

  const getPlaceholderImage = (type: 'anime' | 'manga' = 'anime', width = 300, height = 400) => {
    const bgColor = type === 'anime' ? '3b82f6' : '10b981'
    const text = type === 'anime' ? 'Anime' : 'Manga'
    return `https://via.placeholder.com/${width}x${height}/${bgColor}/ffffff?text=${text}`
  }

  return {
    getImageUrl,
    getDirectApiUrl,
    getAvatarUrl,
    getArticleImageUrl,
    getPlaceholderImage
  }
}