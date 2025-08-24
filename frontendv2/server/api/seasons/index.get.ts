export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Fetch all seasons from NestJS API
    const response = await $fetch(`${config.public.apiBase}/api/seasons`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Map the response to include season names
    const saisonMap: Record<number, string> = {
      1: 'hiver',
      2: 'printemps',
      3: 'été',
      4: 'automne'
    }

    const seasons = (response as any[]).map((season: any) => ({
      id_saison: season.id_saison || season.idSaison,
      saison: season.saison,
      annee: season.annee,
      statut: season.statut,
      nom_saison: saisonMap[season.saison] || 'été',
      json_data: season.json_data || season.jsonData
    }))

    // Sort by year DESC, then season DESC (most recent first)
    seasons.sort((a, b) => {
      if (a.annee !== b.annee) {
        return b.annee - a.annee
      }
      return b.saison - a.saison
    })

    return seasons
    
  } catch (error: any) {
    console.error('Error fetching seasons:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching seasons data'
    })
  }
})