// Product status
export type ProductStatus = 'active' | 'discontinued' | 'draft'

// Category interface
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  parent_id?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  children?: Category[]
}

// Supplier interface
export interface Supplier {
  id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Product interface
export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  brand: string
  category_id?: string
  subcategory_id?: string
  supplier_id?: string
  description?: string
  price_cents: number
  discount_percent: number
  alcohol_percent?: number
  volume_ml?: number
  stock_quantity: number
  reserved_quantity: number
  reorder_level: number
  status: ProductStatus
  image_urls: string[]
  metadata: Record<string, any>
  search_vector?: string
  created_at: string
  updated_at: string
  // Joined fields from views
  category_name?: string
  supplier_name?: string
  average_rating?: number
  review_count?: number
}

// Product image interface
export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text?: string
  sort_order: number
  is_primary: boolean
  created_at: string
}

// Product form data for creation/update
export interface ProductFormData {
  sku: string
  name: string
  brand: string
  category_id?: string
  subcategory_id?: string
  supplier_id?: string
  description?: string
  price_cents: number
  discount_percent: number
  alcohol_percent?: number
  volume_ml?: number
  stock_quantity: number
  reorder_level: number
  status: ProductStatus
  image_urls: string[]
  metadata: Record<string, any>
}

// Product search filters
export interface ProductSearchFilters {
  q?: string // Full-text search query
  categories?: string[]
  minPrice?: number
  maxPrice?: number
  minAlcohol?: number
  maxAlcohol?: number
  inStock?: boolean
  brands?: string[]
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'name_asc' | 'name_desc'
  page?: number
  limit?: number
}

// Product search response
export interface ProductSearchResponse {
  items: Product[]
  total: number
  hasMore: boolean
  executionMs: number
  currentPage: number
  totalPages: number
}

// Product detail view (with additional info)
export interface ProductDetail extends Product {
  images: ProductImage[]
  category?: Category
  supplier?: Supplier
  reviews?: Review[]
  related_products?: Product[]
}

// Stock movement interface
export interface StockMovement {
  id: string
  product_id: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  reference_type?: string
  reference_id?: string
  reason?: string
  created_by?: string
  created_at: string
}
