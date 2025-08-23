export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  
  if (!path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid image path'
    })
  }
  
  const imagePath = Array.isArray(path) ? path.join('/') : path
  
  // Validate file extension to prevent directory traversal
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const hasValidExtension = allowedExtensions.some(ext => 
    imagePath.toLowerCase().endsWith(ext)
  )
  
  if (!hasValidExtension) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file type'
    })
  }
  
  // Prevent directory traversal
  if (imagePath.includes('..')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file path'
    })
  }
  
  // Extract just the filename (remove any path separators)
  const filename = imagePath.split('/').pop() || imagePath
  
  try {
    const localImagePath = `/home/zohardus/www/ak9project/frontendv2/public/images/webzine/img/${filename}`
    
    // Check if file exists
    const fs = await import('fs/promises')
    await fs.access(localImagePath)
    
    // Read and serve the file
    const imageBuffer = await fs.readFile(localImagePath)
    
    // Set appropriate content type based on extension
    let contentType = 'image/jpeg'
    if (filename.toLowerCase().endsWith('.png')) contentType = 'image/png'
    else if (filename.toLowerCase().endsWith('.gif')) contentType = 'image/gif'
    else if (filename.toLowerCase().endsWith('.webp')) contentType = 'image/webp'
    
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=86400') // Cache for 24 hours
    setHeader(event, 'Content-Length', imageBuffer.length.toString())
    
    return imageBuffer
  } catch (error) {
    console.error('Error serving webzine image:', error)
    throw createError({
      statusCode: 404,
      statusMessage: 'Image not found'
    })
  }
})