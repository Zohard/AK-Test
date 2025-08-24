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
    
    // Fetch specific season from NestJS API
    const response = await $fetch(`${config.public.apiBase}/api/seasons/${seasonId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Map the response to include season name
    const saisonMap: Record<number, string> = {
      1: 'hiver',
      2: 'printemps',
      3: 'été',
      4: 'automne'
    }

    const seasonData = response as any
    return {
      id_saison: seasonData.id_saison || seasonData.idSaison,
      saison: seasonData.saison,
      annee: seasonData.annee,
      statut: seasonData.statut,
      nom_saison: saisonMap[seasonData.saison] || 'été',
      json_data: seasonData.json_data || seasonData.jsonData
    }
    
  } catch (error: any) {
    console.error('Error fetching season:', error)
    
    if (error.response?.status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Season not found'
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching season data'
    })
  }
})