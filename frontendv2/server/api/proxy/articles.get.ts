export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  try {
    console.log('Proxying articles request with query:', query)
    
    // Clean up empty parameters that cause issues with the API
    const cleanQuery = Object.entries(query).reduce((acc, [key, value]) => {
      // Only include parameters that have non-empty values
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)
    
    console.log('Cleaned query:', cleanQuery)
    
    const response = await $fetch(`${config.public.apiBase}/api/articles`, {
      query: cleanQuery
    })
    
    console.log('Proxy successful, returning data')
    return response
  } catch (error: any) {
    console.error('Proxy failed:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch articles'
    })
  }
})
