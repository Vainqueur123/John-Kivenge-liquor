// Common utility types
import React from 'react'

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    pagination?: PaginationMeta
    execution_time?: number
    timestamp?: string
  }
}

// Pagination metadata
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
  has_more: boolean
  has_prev: boolean
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

// Sort options
export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
  label: string
}

// Filter option
export interface FilterOption {
  value: string | number
  label: string
  count?: number
}

// Select option
export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
}

// Form validation error
export interface ValidationError {
  field: string
  message: string
  code?: string
}

// Form state
export interface FormState<T = any> {
  data: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean
}

// Loading states
export interface LoadingState {
  isLoading: boolean
  isInitialLoad: boolean
  isRefreshing: boolean
  error?: string
}

// Async state
export interface AsyncState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated?: Date
}

// Currency formatting options
export interface CurrencyOptions {
  currency: string
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

// Date formatting options
export interface DateFormatOptions {
  format?: string
  locale?: string
  includeTime?: boolean
  relative?: boolean
}

// Image upload options
export interface ImageUploadOptions {
  maxSize: number // in bytes
  allowedTypes: string[]
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

// File upload response
export interface FileUploadResponse {
  success: boolean
  url?: string
  filename?: string
  size?: number
  type?: string
  error?: string
}

// Notification types
export type NotificationType = 
  | 'success'
  | 'error'
  | 'warning'
  | 'info'

// Notification interface
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
  timestamp: Date
}

// Modal props
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
}

// Table column definition
export interface TableColumn<T = any> {
  key: keyof T
  title: string
  sortable?: boolean
  filterable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: T, index: number) => React.ReactNode
}

// Table props
export interface TableProps<T = any> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  pagination?: PaginationMeta
  onPageChange?: (page: number) => void
  onSort?: (sort: SortOption) => void
  onFilter?: (filters: Record<string, any>) => void
  onRowClick?: (row: T, index: number) => void
  selectable?: boolean
  selectedRows?: T[]
  onSelectionChange?: (selectedRows: T[]) => void
}

// Search suggestions
export interface SearchSuggestion {
  id: string
  type: 'product' | 'category' | 'brand'
  title: string
  subtitle?: string
  url?: string
  image_url?: string
}

// Breadcrumb item
export interface BreadcrumbItem {
  label: string
  href?: string
  active?: boolean
}

// Menu item
export interface MenuItem {
  id: string
  label: string
  href?: string
  icon?: string
  badge?: string | number
  children?: MenuItem[]
  disabled?: boolean
  onClick?: () => void
}

// Theme configuration
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  accentColor: string
  fontSize: 'sm' | 'md' | 'lg'
  borderRadius: 'none' | 'sm' | 'md' | 'lg'
}

// Language configuration
export interface LanguageConfig {
  code: string
  name: string
  flag: string
  rtl: boolean
}

// Error boundary state
export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  reset: () => void
}

// Analytics event
export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp: Date
  userId?: string
  sessionId?: string
}

// System health check
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: Record<string, {
    status: 'up' | 'down'
    responseTime?: number
    error?: string
  }>
  version: string
  uptime: number
}
