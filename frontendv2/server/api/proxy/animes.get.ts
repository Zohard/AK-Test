export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  try {
    console.log('Proxying animes request with query:', query)
    
    const response = await $fetch('http://localhost:3003/api/animes', {
      query
    })
    
    console.log('Proxy successful, returning data')
    return response
  } catch (error: any) {
    console.error('Proxy failed:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch animes'
    })
  }
})