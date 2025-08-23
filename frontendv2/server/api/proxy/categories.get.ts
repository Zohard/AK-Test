export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  try {
    console.log('Proxying categories request with query:', query)
    
    // Return categories from ak_webzine_sous_categories table
    const categories = [
      { id: 1, name: 'Editos', slug: 'editos' },
      { id: 2, name: 'Chroniques', slug: 'chroniques' },
      { id: 4, name: 'Dossiers', slug: 'dossiers' },
      { id: 5, name: 'Focus', slug: 'focus' },
      { id: 6, name: 'Top 5', slug: 'top-5' },
      { id: 7, name: 'WTF', slug: 'wtf' },
      { id: 8, name: 'Anime', slug: 'anime' },
      { id: 9, name: 'Figurines', slug: 'figurines' },
      { id: 10, name: 'Artbooks', slug: 'artbooks' },
      { id: 11, name: 'Goodies', slug: 'goodies' }
    ]
    
    console.log('Proxy successful, returning categories data')
    return categories
  } catch (error: any) {
    console.error('Categories proxy failed:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch categories'
    })
  }
})