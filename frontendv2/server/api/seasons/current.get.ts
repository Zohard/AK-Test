export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Fetch current season from NestJS API
    const response = await $fetch(`${config.public.apiBase}/api/seasons/current`, {
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
      nom_saison: saisonMap[seasonData.saison] || 'été'
    }
    
  } catch (error: any) {
    console.error('Error fetching current season:', error)
    
    // Return fallback season data (summer 2025)
    return {
      id_saison: 198,
      saison: 3, // été
      annee: 2025,
      statut: 1,
      nom_saison: 'été'
    }
  }
})