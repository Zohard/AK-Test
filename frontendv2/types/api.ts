// Base API Response Structure
export interface BaseApiResponse {
  success: boolean
  message?: string
  timestamp: string
  requestId?: string
}

export interface SuccessApiResponse<T = any> extends BaseApiResponse {
  success: true
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
    lastPage?: number
  }
}

export interface ErrorApiResponse extends BaseApiResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
    field?: string
  }
  data?: null
}

export type ApiResponse<T = any> = SuccessApiResponse<T> | ErrorApiResponse

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  hasMore: boolean
  lastPage: number
  totalPages: number
}

export interface PaginatedResponse<T> extends SuccessApiResponse<T[]> {
  meta: PaginationMeta
}

// Sorting and Filtering
export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  filters?: Record<string, any>
}

export interface QueryParams extends PaginationParams, SortParams, FilterParams {}

// Review-specific types
export interface ReviewApiData {
  idCritique: number
  niceUrl?: string
  slug?: string
  titre: string
  contenu: string
  notation: number
  dateCritique: string
  dateCreation: string
  dateModification?: string
  statut: number
  estPublique: boolean
  estFeatured?: boolean
  idMembre: number
  idAnime?: number
  idManga?: number
  nbVues: number
  nbClics?: number
  nbClicsDay?: number
  nbClicsWeek?: number
  nbClicsMonth?: number
  nbCommentaires?: number
  nbLikes?: number
  nbShares?: number
  tags?: string[]
  metaTitle?: string
  metaDescription?: string
  readingTime?: number
  
  // Relations (may be populated)
  anime?: AnimeApiData
  manga?: MangaApiData
  membre?: MemberApiData
  commentaires?: CommentApiData[]
}

export interface AnimeApiData {
  id: number
  titre: string
  titreOriginal?: string
  description?: string
  image?: string
  imageBanner?: string
  annee?: number
  saison?: string
  status?: string
  nbEpisodes?: number
  dureeEpisode?: number
  studio?: string
  producteur?: string
  realisateur?: string
  genres?: string[]
  tags?: string[]
  noteGlobale?: number
  nbNotes?: number
  nbReviews?: number
  rang?: number
  popularity?: number
  dateAjout?: string
  dateModification?: string
}

export interface MangaApiData {
  id: number
  titre: string
  titreOriginal?: string
  description?: string
  image?: string
  imageBanner?: string
  annee?: number
  status?: string
  nbVolumes?: number
  nbChapitres?: number
  auteur?: string
  illustrateur?: string
  editeur?: string
  genres?: string[]
  tags?: string[]
  noteGlobale?: number
  nbNotes?: number
  nbReviews?: number
  rang?: number
  popularity?: number
  dateAjout?: string
  dateModification?: string
}

export interface MemberApiData {
  id: number
  pseudo: string
  email?: string
  avatar?: string
  bio?: string
  dateInscription: string
  derniereConnexion?: string
  isVerified?: boolean
  isActive?: boolean
  isBanned?: boolean
  role?: 'user' | 'moderator' | 'admin'
  niveau?: number
  experience?: number
  nbReviews?: number
  nbCommentaires?: number
  nbLikes?: number
  moyenneNotes?: number
  preferences?: {
    notifications?: boolean
    newsletter?: boolean
    profilePublic?: boolean
    showEmail?: boolean
  }
  stats?: {
    reviewsCount: number
    averageRating: number
    totalViews: number
    totalLikes: number
    joinDate: string
    lastActivity: string
  }
}

export interface CommentApiData {
  id: number
  contenu: string
  dateCreation: string
  dateModification?: string
  idMembre: number
  idCritique: number
  idParent?: number
  estApprouve: boolean
  nbLikes?: number
  membre?: MemberApiData
  reponses?: CommentApiData[]
}

// Request/Response type mappings
export interface ReviewQueryParams extends QueryParams {
  idAnime?: number
  idManga?: number
  idMembre?: number
  statut?: number
  minNotation?: number
  maxNotation?: number
  dateDebut?: string
  dateFin?: string
  estPublique?: boolean
  estFeatured?: boolean
  tags?: string[]
  hasComments?: boolean
  minViews?: number
}

export interface ReviewCreateRequest {
  titre: string
  contenu: string
  notation: number
  idAnime?: number
  idManga?: number
  tags?: string[]
  estPublique?: boolean
  allowComments?: boolean
  metaTitle?: string
  metaDescription?: string
}

export interface ReviewUpdateRequest extends Partial<ReviewCreateRequest> {
  statut?: number
  estFeatured?: boolean
}

export interface ReviewStatsResponse {
  totalReviews: number
  publishedReviews: number
  draftReviews: number
  averageRating: number
  totalViews: number
  totalLikes: number
  totalComments: number
  topTags: Array<{
    tag: string
    count: number
  }>
  ratingDistribution: Array<{
    rating: number
    count: number
  }>
  monthlyStats: Array<{
    month: string
    count: number
    views: number
  }>
}

// Type guards for API responses
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessApiResponse<T> {
  return response.success === true
}

export function isErrorResponse(response: ApiResponse): response is ErrorApiResponse {
  return response.success === false
}

export function isPaginatedResponse<T>(response: ApiResponse<T[]>): response is PaginatedResponse<T> {
  return isSuccessResponse(response) && 
         response.meta !== undefined &&
         'total' in response.meta &&
         'page' in response.meta
}

// Type-safe API response handlers
export function handleApiResponse<T>(
  response: ApiResponse<T>
): T {
  if (isErrorResponse(response)) {
    throw new ApiError(response.error.message, response.error.code, response.error.details)
  }
  return response.data
}

export function handlePaginatedResponse<T>(
  response: ApiResponse<T[]>
): { data: T[]; meta: PaginationMeta } {
  if (isErrorResponse(response)) {
    throw new ApiError(response.error.message, response.error.code, response.error.details)
  }
  
  if (!isPaginatedResponse(response)) {
    throw new Error('Response is not paginated')
  }
  
  return {
    data: response.data,
    meta: response.meta
  }
}

// Custom API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public field?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  toString(): string {
    return `${this.name}: ${this.message} (Code: ${this.code})`
  }
}

// Validation schemas (using Zod-like structure)
export interface ValidationSchema<T> {
  parse(data: unknown): T
  safeParse(data: unknown): { success: boolean; data?: T; error?: string }
}

// Helper function to create type-safe validators
export function createValidator<T>(validator: (data: unknown) => T): ValidationSchema<T> {
  return {
    parse: (data: unknown) => validator(data),
    safeParse: (data: unknown) => {
      try {
        return { success: true, data: validator(data) }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  }
}

// Review data validator
export const reviewValidator = createValidator<ReviewApiData>((data: any) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid review data')
  }

  if (!data.idCritique || typeof data.idCritique !== 'number') {
    throw new Error('Review ID is required and must be a number')
  }

  if (!data.titre || typeof data.titre !== 'string') {
    throw new Error('Review title is required and must be a string')
  }

  if (!data.contenu || typeof data.contenu !== 'string') {
    throw new Error('Review content is required and must be a string')
  }

  if (data.notation === undefined || typeof data.notation !== 'number' || data.notation < 0 || data.notation > 10) {
    throw new Error('Review rating must be a number between 0 and 10')
  }

  return data as ReviewApiData
})

// Pagination validator
export const paginationValidator = createValidator<PaginationMeta>((data: any) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid pagination data')
  }

  const required = ['total', 'page', 'limit', 'hasMore', 'lastPage', 'totalPages']
  for (const field of required) {
    if (data[field] === undefined) {
      throw new Error(`Pagination field '${field}' is required`)
    }
  }

  return data as PaginationMeta
})

// Export commonly used types for convenience
export type {
  ReviewApiData as Review,
  AnimeApiData as Anime,
  MangaApiData as Manga,
  MemberApiData as Member,
  CommentApiData as Comment,
  ReviewQueryParams as ReviewQuery,
  ReviewCreateRequest as CreateReview,
  ReviewUpdateRequest as UpdateReview
}