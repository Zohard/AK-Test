export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  try {
    console.log('Proxying mangas request with query:', query)
    
    const response = await $fetch(`${config.public.apiBase}/api/mangas`, {
      query
    })
    
    console.log('Proxy successful, returning data')
    return response
  } catch (error: any) {
    console.error('Proxy failed:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch mangas'
    })
  }
})
