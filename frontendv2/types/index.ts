// User types
export interface User {
  id: number
  email: string
  pseudo: string
  isAdmin?: boolean
  role?: string
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  pseudo: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

// Anime types (based on actual database schema)
export interface Anime {
  id: number // This is idAnime from DB, formatted by API
  idAnime?: number // Original DB field
  niceUrl?: string
  titre: string
  titreOrig?: string
  annee?: number
  nbEp?: number
  image?: string
  studio?: string
  synopsis?: string
  statut: number
  realisateur?: string
  nbReviews?: number
  moyenneNotes?: number // Note: this is a float, not moyenneNotes
  dateAjout?: string // Formatted by API as ISO string
  addedDate?: string // API formatted field
  // Relations
  reviews?: Review[]
  episodes?: AnimeEpisode[]
  businessRelations?: BusinessToAnime[]
}

export interface AnimeEpisode {
  idEpisode: number
  idAnime: number
  numero: number
  titre?: string
  resume?: string
  dateAjout?: string
}

export interface BusinessToAnime {
  idRelation: number
  idAnime?: number
  idBusiness?: number
  type?: string
  precisions?: string
  business?: Business
}

export interface AnimeQueryParams {
  page?: number
  limit?: number
  search?: string
  studio?: string // Changed from genre to studio (as per actual API)
  annee?: number
  statut?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  includeReviews?: boolean
  includeEpisodes?: boolean
}

export interface CreateAnimeDto {
  titre: string
  synopsis?: string
  annee?: number
  genre?: string
  episodes?: number
  image?: string
  statut?: string
}

export interface UpdateAnimeDto extends Partial<CreateAnimeDto> {}

// Manga types
export interface Manga {
  id: number
  niceUrl: string
  titre: string
  auteur?: string
  annee?: string
  origine?: string
  titreOrig?: string
  titreFr?: string
  titresAlternatifs?: string
  licence?: string
  nbVolumes?: string
  nbVol?: string
  statutVol?: string
  synopsis?: string
  image?: string
  editeur?: string
  isbn?: string
  precisions?: string
  tags?: string
  nbClics?: number
  nbClicsDay?: number
  nbClicsWeek?: number
  nbClicsMonth?: number
  nbReviews?: number
  label?: string
  moyenneNotes?: number
  lienForum?: string
  statut: number
  ficheComplete?: number
  dateAjout?: string
  dateModification?: number
  latestCache?: number
  classementPopularite?: number
  variationPopularite?: string
}

export interface MangaQueryParams {
  page?: number
  limit?: number
  search?: string
  genre?: string
  annee?: string
  statut?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  includeReviews?: boolean
}

export interface CreateMangaDto {
  titre: string
  synopsis?: string
  annee?: number
  genre?: string
  chapitres?: number
  image?: string
  statut?: string
}

export interface UpdateMangaDto extends Partial<CreateMangaDto> {}

// Review types (based on actual database schema)
export interface Review {
  id: number // This is idCritique from DB, formatted by API
  idCritique?: number // Original DB field
  niceUrl?: string
  titre?: string // Review title
  critique?: string // Review content
  notation?: number // Rating (0-10 scale)
  dateCritique?: string // Unix timestamp, formatted to ISO by API
  reviewDate?: string // API formatted date
  statut: number
  questions?: string
  acceptImages?: number
  evaluation?: string
  idMembre: number
  userId?: number // API formatted field
  idAnime: number
  idManga: number
  animeId?: number // API formatted field
  mangaId?: number // API formatted field
  idOst?: number
  idJeu?: number
  causeSuppr?: string
  nbClics?: number
  nbClicsDay?: number
  nbClicsWeek?: number
  nbClicsMonth?: number
  nbCarac?: number
  popularite?: number
  classementPopularite?: number
  variationPopularite?: string
  // Relations
  membre?: SmfMember
  anime?: Anime
  manga?: Manga
}

export interface SmfMember {
  idMember: number
  memberName: string
  realName?: string
  emailAddress: string
  avatar?: string
  signature?: string
  personalText?: string
  location?: string
  websiteTitle?: string
  websiteUrl?: string
  birthdate?: string
  nbCritiques: number
  nbSynopsis: number
  nbContributions: number
  experience: number
}

export interface ReviewQueryParams {
  page?: number
  limit?: number
  search?: string
  idAnime?: number
  idManga?: number
  idMembre?: number
  statut?: number
  minNotation?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateReviewDto {
  titre?: string
  critique: string
  notation: number
  idAnime?: number
  idManga?: number
  questions?: string
  evaluation?: string
}

export interface UpdateReviewDto extends Partial<CreateReviewDto> {}

// Article types (based on actual API response format)
export interface Article {
  // Common fields (used by both ak_webzine_articles and wp_posts)
  idArt: number
  titre: string
  niceUrl: string
  date: string
  img?: string
  imgunebig?: string
  imgunebig2?: string
  auteur: number
  metaDescription?: string
  tags?: string
  nbCom: number
  nbClics: number
  statut: number
  author?: ArticleAuthor
  categories?: ArticleCategory[]
  commentCount: number
  imageCount: number
  contenu?: string // Full content for detail view
  content?: string // Alternative content field
  texte?: string // Alternative content field

  // WordPress-specific fields (wp_posts)
  ID?: number | string
  postTitle?: string
  postName?: string
  postDate?: string
  postContent?: string
  postExcerpt?: string
  postAuthor?: number
  postStatus?: string
  postModified?: string
  commentCount?: number
}

export interface ArticleAuthor {
  idMember: number
  memberName: string
  realName?: string
}

export interface ArticleCategory {
  id: number
  name: string
  slug?: string
}

export interface ArticleComment {
  id: number
  id_article: number
  id_membre: number
  nom: string
  commentaire: string
  date: string
  moderation: number
  author?: ArticleAuthor // Optional, populated from join with smf_members
}

export interface ArticleQueryParams {
  page?: number
  limit?: number
  categoryId?: number
  authorId?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  featured?: boolean
}

export interface ArticlesResponse {
  articles: Article[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export interface CreateArticleDto {
  titre: string
  contenu: string
  metaDescription?: string
  img?: string
  tags?: string
  categoryId?: number
  statut?: number
}

export interface UpdateArticleDto extends Partial<CreateArticleDto> {}

// Search types
export interface SearchResult {
  id: number
  titre: string
  title?: string
  image?: string
  type: 'anime' | 'manga' | 'article' | 'user'
  annee?: number
  moyenne_notes?: number
  genre?: string
  synopsis?: string
  excerpt?: string
}

export interface SearchFilters {
  type?: string
  genre?: string
  year?: number
  rating?: number
  limit?: number
}

export interface SearchResponse {
  data: SearchResult[]
  meta: PaginationMeta
}

// Business types (based on actual database schema)
export interface Business {
  idBusiness: number
  niceUrl?: string
  type?: string
  denomination?: string
  autresDenominations?: string
  image?: string
  date?: string
  origine?: string
  siteOfficiel?: string
  notes?: string
  relations?: number
  nbClics?: number
  nbClicsDay?: number
  nbClicsWeek?: number
  nbClicsMonth?: number
  statut: number
  dateAjout?: string
  dateModification?: number
  latestCache?: number
}

export interface BusinessQueryParams {
  page?: number
  limit?: number
  category?: string
  featured?: boolean
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Notification types
export interface Notification {
  id: number
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  user_id: number
  data?: any
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  review_notifications: boolean
  follow_notifications: boolean
  article_notifications: boolean
}

// Media types
export interface MediaItem {
  id: number
  filename: string
  original_name: string
  mime_type: string
  size: number
  path: string
  url: string
  type: 'image' | 'video' | 'document'
  related_type?: string
  related_id?: number
  created_at: string
  updated_at: string
}

// Common types
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  data?: T
  animes?: T
  mangas?: T
  pagination?: PaginationMeta
  meta?: PaginationMeta
  message?: string
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'file'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
  }
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  loading: boolean
}

// Statistics types
export interface SiteStats {
  animes: number
  mangas: number
  reviews: number
  users: number
  articles: number
}

export interface UserStats {
  reviews_count: number
  favorites_count: number
  articles_count: number
  joined_at: string
}

// Settings types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: NotificationPreferences
  privacy: {
    profile_public: boolean
    reviews_public: boolean
    favorites_public: boolean
  }
}

// Filter types
export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterGroup {
  name: string
  label: string
  type: 'select' | 'checkbox' | 'range'
  options: FilterOption[]
  multiple?: boolean
}

// Chart/Analytics types
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
  }[]
}

export interface AnalyticsData {
  views: ChartData
  users: ChartData
  content: ChartData
  engagement: ChartData
}

// Toast/Alert types
export interface ToastMessage {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  duration?: number
  persistent?: boolean
}

// Theme types
export interface ThemeConfig {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  border: string
}

// Navigation types
export interface NavItem {
  name: string
  href: string
  icon?: string
  children?: NavItem[]
  external?: boolean
  badge?: string | number
}

export interface BreadcrumbItem {
  name: string
  href?: string
  current?: boolean
}

// Modal types
export interface ModalProps {
  show: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  persistent?: boolean
}

// Table types
export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  format?: (value: any) => string
}

export interface TableData {
  columns: TableColumn[]
  rows: Record<string, any>[]
  loading?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}