export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const slug = getRouterParam(event, 'slug')
  
  try {
    console.log('Proxying article by slug request for:', slug)
    
    const response = await $fetch(`${config.public.apiBase}/api/articles/slug/${slug}`)
    
    console.log('Article by slug proxy successful, returning data')
    return response
  } catch (error: any) {
    console.error('Article by slug proxy failed:', error.message)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch article'
    })
  }
})
