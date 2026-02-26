// Review interface
export interface Review {
  id: string
  product_id: string
  customer_id: string
  order_id?: string
  rating: number
  title?: string
  content?: string
  is_verified: boolean
  is_approved: boolean
  helpful_count: number
  created_at: string
  updated_at: string
  // Joined fields
  customer_name?: string
  product_name?: string
  order_number?: string
}

// Review helpful vote
export interface ReviewHelpfulVote {
  id: string
  review_id: string
  user_id: string
  is_helpful: boolean
  created_at: string
}

// Create review request
export interface CreateReviewRequest {
  product_id: string
  order_id: string
  rating: number
  title?: string
  content?: string
}

// Update review request
export interface UpdateReviewRequest {
  rating?: number
  title?: string
  content?: string
}

// Review statistics
export interface ReviewStatistics {
  total_reviews: number
  average_rating: number
  rating_distribution: Record<number, number> // 1-5 stars
  verified_reviews: number
  pending_approval: number
  reviews_by_month: Array<{
    month: string
    count: number
    average_rating: number
  }>
  top_reviewed_products: Array<{
    product_id: string
    product_name: string
    review_count: number
    average_rating: number
  }>
}

// Review filters
export interface ReviewFilters {
  product_id?: string
  customer_id?: string
  rating?: number[]
  is_verified?: boolean
  is_approved?: boolean
  date_from?: string
  date_to?: string
  search?: string // Search by title or content
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'rating' | 'helpful_count'
  sort_order?: 'asc' | 'desc'
}

// Review moderation queue
export interface ReviewModerationQueue {
  id: string
  review_id: string
  product_id: string
  product_name: string
  customer_id: string
  customer_name: string
  rating: number
  title?: string
  content?: string
  is_verified: boolean
  created_at: string
  // Moderation actions
  approved_by?: string
  approved_at?: string
  rejected_by?: string
  rejected_at?: string
  rejection_reason?: string
}

// Review analytics
export interface ReviewAnalytics {
  total_reviews: number
  average_rating: number
  response_rate: number
  conversion_rate: number // Reviews per order
  sentiment_analysis: {
    positive: number
    neutral: number
    negative: number
  }
  common_themes: Array<{
    theme: string
    count: number
    sentiment: 'positive' | 'neutral' | 'negative'
  }>
  improvement_areas: Array<{
    area: string
    mention_count: number
    average_rating: number
  }>
}
