import type { Season } from '~/types'

interface SeasonApiResponse {
  id_saison: number
  saison: number
  annee: number
  statut: number
  nom_saison?: string
}

export const useSeasonsAPI = () => {
  const config = useRuntimeConfig()

  const fetchCurrentSeason = async (): Promise<Season> => {
    try {
      const response = await $fetch<SeasonApiResponse>('/api/seasons/current')
      
      // Map season number to French season name
      const saisonMap: Record<number, string> = {
        1: 'hiver',
        2: 'printemps',
        3: 'été',
        4: 'automne'
      }
      
      return {
        id_saison: response.id_saison,
        saison: response.saison,
        annee: response.annee,
        statut: response.statut,
        nom_saison: response.nom_saison || saisonMap[response.saison] || 'été'
      }
    } catch (error) {
      console.error('Error fetching current season:', error)
      
      // Return fallback season
      return {
        id_saison: 198,
        saison: 3,
        annee: 2025,
        statut: 1,
        nom_saison: 'été'
      }
    }
  }

  const formatSeasonText = (season: Season): string => {
    return `Les animes de l'${season.nom_saison} ${season.annee}`
  }

  const formatSeasonUrl = (season: Season): string => {
    return `/saison-anime-${season.nom_saison}-${season.annee}-${season.id_saison}`
  }

  return {
    fetchCurrentSeason,
    formatSeasonText,
    formatSeasonUrl
  }
}