export function useImageUrl() {
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase || 'http://localhost:3002'
  
  /**
   * Get the full image URL for assets served by the API
   * @param {string} imagePath - The image path (e.g., "anime/image.jpg" or "screenshots/image.jpg")
   * @returns {string} - The full URL to the image
   */
  const getImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string') {
      return null
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
    
    // Return the full API URL
    return `${API_BASE}/${cleanPath}`
  }
  
  /**
   * Get direct API URL for images (alias for getImageUrl)
   * @param {string} imagePath - The image path
   * @returns {string} - The full URL to the image
   */
  const getDirectApiUrl = (imagePath) => {
    return getImageUrl(imagePath)
  }
  
  return {
    getImageUrl,
    getDirectApiUrl
  }
}