export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  try {
    console.log('Proxying reviews request with query:', query)
    
    const response = await $fetch('http://localhost:3003/api/reviews', {
      query
    })
    
    console.log('Reviews proxy successful, returning data')
    return response
  } catch (error: any) {
    console.error('Reviews proxy failed:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch reviews'
    })
  }
})