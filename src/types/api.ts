// API endpoint definitions and request/response types
import type { PaginationMeta } from './common'

// Base API configuration
export interface ApiConfig {
  baseURL: string
  timeout: number
  retries: number
  retryDelay: number
}

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// API request options
export interface ApiRequestOptions {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: any
  params?: Record<string, any>
  timeout?: number
  retries?: number
  signal?: AbortSignal
}

// API error response
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
  path: string
  status: number
}

// Success response wrapper
export interface SuccessResponse<T = any> {
  success: true
  data: T
  meta?: {
    pagination?: PaginationMeta
    timestamp: string
    execution_time: number
  }
}

// Error response wrapper
export interface ErrorResponse {
  success: false
  error: ApiError
  meta?: {
    timestamp: string
    request_id: string
  }
}

// API response type
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

// Product API endpoints
export interface ProductApiEndpoints {
  list: '/products'
  get: '/products/:id'
  search: '/products/search'
  categories: '/categories'
  create: '/products' // Admin only
  update: '/products/:id' // Admin only
  delete: '/products/:id' // Admin only
  uploadImage: '/products/:id/images' // Admin only
}

// Order API endpoints
export interface OrderApiEndpoints {
  list: '/orders'
  get: '/orders/:id'
  create: '/orders'
  update: '/orders/:id'
  cancel: '/orders/:id/cancel'
  items: '/orders/:id/items'
  statusHistory: '/orders/:id/status-history'
}

// Payment API endpoints
export interface PaymentApiEndpoints {
  initiate: '/payments/initiate'
  verify: '/payments/verify/:transaction_id'
  refund: '/payments/refund'
  methods: '/payments/methods'
  webhook: '/payments/webhook/:gateway'
}

// Chat API endpoints
export interface ChatApiEndpoints {
  conversations: '/conversations'
  messages: '/conversations/:id/messages'
  sendMessage: '/conversations/:id/messages'
  markAsRead: '/conversations/:id/read'
  typing: '/conversations/:id/typing'
  presence: '/chat/presence'
}

// Review API endpoints
export interface ReviewApiEndpoints {
  list: '/reviews'
  get: '/reviews/:id'
  create: '/reviews'
  update: '/reviews/:id'
  delete: '/reviews/:id'
  helpful: '/reviews/:id/helpful'
  moderate: '/reviews/:id/moderate' // Admin only
}

// Auth API endpoints
export interface AuthApiEndpoints {
  login: '/auth/login'
  register: '/auth/register'
  logout: '/auth/logout'
  refresh: '/auth/refresh'
  resetPassword: '/auth/reset-password'
  confirmReset: '/auth/confirm-reset'
  updateProfile: '/auth/profile'
  changePassword: '/auth/change-password'
}

// Admin API endpoints
export interface AdminApiEndpoints {
  dashboard: '/admin/dashboard'
  users: '/admin/users'
  orders: '/admin/orders'
  products: '/admin/products'
  analytics: '/admin/analytics'
  settings: '/admin/settings'
  auditLogs: '/admin/audit-logs'
}

// Request/response interceptors
export interface RequestInterceptor {
  onRequest?: (config: ApiRequestOptions) => ApiRequestOptions
  onRequestError?: (error: any) => any
}

export interface ResponseInterceptor {
  onResponse?: (response: any) => any
  onResponseError?: (error: any) => any
}

// API client configuration
export interface ApiClientConfig extends ApiConfig {
  interceptors?: {
    request?: RequestInterceptor[]
    response?: ResponseInterceptor[]
  }
  transformRequest?: (data: any) => any
  transformResponse?: (data: any) => any
}

// Cache configuration
export interface CacheConfig {
  enabled: boolean
  ttl: number // Time to live in seconds
  maxSize: number // Maximum number of cached items
  strategy: 'lru' | 'fifo' | 'lfu'
}

// Rate limiting configuration
export interface RateLimitConfig {
  enabled: boolean
  maxRequests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

// WebSocket configuration
export interface WebSocketConfig {
  url: string
  protocols?: string[]
  reconnectInterval: number
  maxReconnectAttempts: number
  timeout: number
  heartbeatInterval: number
}

// Real-time subscription
export interface RealtimeSubscription {
  id: string
  channel: string
  event?: string
  filter?: Record<string, any>
  callback: (payload: any) => void
  isActive: boolean
}

// API monitoring metrics
export interface ApiMetrics {
  requestCount: number
  errorCount: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsByEndpoint: Record<string, number>
  errorsByType: Record<string, number>
  uptime: number
}
