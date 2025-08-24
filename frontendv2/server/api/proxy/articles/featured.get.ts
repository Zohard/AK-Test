export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  try {
    console.log('Proxying featured articles request with query:', query)
    
    // For now, return the regular articles API with onindex=1 to get featured articles
    // This is a temporary workaround until the NestJS featured endpoint is fixed
    const cleanQuery = Object.entries(query).reduce((acc, [key, value]) => {
      // Only include parameters that have non-empty values
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)
    
    // Add onindex=1 to get featured articles
    cleanQuery.onindex = true
    
    console.log('Cleaned query for featured articles:', cleanQuery)
    
    const response = await $fetch(`${config.public.apiBase}/api/articles`, {
      query: cleanQuery
    })
    
    console.log('Featured articles proxy successful, returning data')
    // Return just the articles array for compatibility
    return response.articles || []
  } catch (error: any) {
    console.error('Featured articles proxy failed:', error.message)
    // Return empty array instead of throwing error to prevent frontend crash
    console.log('Returning empty array for featured articles')
    return []
  }
})
