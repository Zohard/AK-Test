/**
 * Transform webzine image URLs to use local proxy
 */
export function transformWebzineImageUrl(originalUrl: string): string {
  if (!originalUrl) return ''
  
  // Extract filename from URLs like:
  // http://www.anime-kun.net/webzine/img/1231608742.jpg
  // ../webzine/img/1231608742.jpg
  const webzineImgMatch = originalUrl.match(/webzine\/img\/([^\/\?]+)/)
  
  if (webzineImgMatch && webzineImgMatch[1]) {
    const filename = webzineImgMatch[1]
    return `/api/webzine/img/${filename}`
  }
  
  // Return original URL if it doesn't match webzine pattern
  return originalUrl
}

/**
 * Transform all webzine image URLs in HTML content
 */
export function transformWebzineImagesInContent(htmlContent: string): string {
  if (!htmlContent) return ''
  
  // Replace image sources in HTML
  return htmlContent.replace(
    /(src=["']?)([^"'\s]*webzine\/img\/[^"'\s]*)(["']?)/gi,
    (match, prefix, url, suffix) => {
      const transformedUrl = transformWebzineImageUrl(url)
      return `${prefix}${transformedUrl}${suffix}`
    }
  )
}