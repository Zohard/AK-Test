export function useImageUrl() {
  const config = useRuntimeConfig()

  const getImageUrl = (imagePath: string, type: 'anime' | 'manga' = 'anime') => {
    if (!imagePath) return null
    
    // Handle different image path formats
    if (imagePath.startsWith('http')) {
      // Handle problematic external image hosts with SSL issues
      if (imagePath.includes('casimages.com') || imagePath.includes('imageshack') || imagePath.includes('hostingpics.net')) {
        // Convert to HTTP to avoid SSL certificate issues with old image hosts
        return imagePath.replace('https://', 'http://')
      }
      return imagePath
    }
    
    // Also handle URLs that might be stored without protocol
    if (imagePath.includes('casimages.com') || imagePath.includes('imageshack') || imagePath.includes('hostingpics.net')) {
      // Ensure these old image hosts use HTTP
      return imagePath.startsWith('//') ? `http:${imagePath}` : `http://${imagePath}`
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
    // Use a data URL SVG instead of external service
    const bgColor = type === 'anime' ? '#3b82f6' : '#10b981'
    const text = type === 'anime' ? 'Anime' : 'Manga'
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="sans-serif" font-size="16">${text}</text>
      </svg>
    `
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  const handleImageError = (event: Event, fallbackUrl?: string, type: 'anime' | 'manga' = 'anime') => {
    const img = event.target as HTMLImageElement
    const originalSrc = img.src
    
    // If we haven't tried HTTP fallback yet for HTTPS SSL issues
    if (originalSrc.startsWith('https://') && 
        (originalSrc.includes('casimages.com') || originalSrc.includes('imageshack') || originalSrc.includes('hostingpics.net'))) {
      const httpVersion = originalSrc.replace('https://', 'http://')
      if (img.dataset.httpTried !== 'true') {
        img.dataset.httpTried = 'true'
        img.src = httpVersion
        return
      }
    }
    
    // Use provided fallback or generate placeholder
    if (fallbackUrl) {
      img.src = fallbackUrl
    } else {
      img.src = getPlaceholderImage(type, img.width || 300, img.height || 400)
    }
    
    // Add error styling
    img.style.opacity = '0.7'
  }

  return {
    getImageUrl,
    getDirectApiUrl,
    getAvatarUrl,
    getArticleImageUrl,
    getPlaceholderImage,
    handleImageError
  }
}