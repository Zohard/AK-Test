export default defineEventHandler(async (event) => {
  const seasonId = getRouterParam(event, 'id')
  
  if (!seasonId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Season ID is required'
    })
  }

  try {
    const config = useRuntimeConfig()
    
    // Fetch season animes directly from NestJS API (handles all the logic)
    const animes = await $fetch(`${config.public.apiBase}/api/seasons/${seasonId}/animes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return animes
    
  } catch (error: any) {
    console.error('Error fetching season animes:', error)
    
    if (error.response?.status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Season not found'
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching season anime data'
    })
  }
})