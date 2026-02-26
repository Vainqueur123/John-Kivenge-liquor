// Application constants

export const APP_CONFIG = {
  name: 'John Kivenge Liquor Stock',
  description: 'Premium liquor collection delivered to your door',
  version: '1.0.0',
  author: 'John Kivenge Team',
} as const

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
} as const

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
  pageSizeOptions: [10, 20, 50, 100],
} as const

export const CURRENCY = {
  code: 'RWF',
  symbol: 'FRw',
  locale: 'rw-RW',
} as const

export const VALIDATION = {
  email: {
    minLength: 5,
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  phone: {
    pattern: /^\+?[0-9]{10,15}$/,
    minLength: 10,
    maxLength: 15,
  },
  name: {
    minLength: 2,
    maxLength: 100,
  },
  address: {
    minLength: 5,
    maxLength: 500,
  },
} as const

export const UPLOAD = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxImageWidth: 2048,
  maxImageHeight: 2048,
  imageQuality: 0.8,
} as const

export const CHAT = {
  maxMessageLength: 1000,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  typingTimeout: 3000, // 3 seconds
  reconnectInterval: 5000, // 5 seconds
  maxReconnectAttempts: 10,
} as const

export const ORDER = {
  minOrderAmount: 5000, // 50 RWF in cents
  defaultShippingCost: 2000, // 20 RWF in cents
  taxRate: 0.18, // 18%
  reservationTimeout: 5 * 60 * 1000, // 5 minutes in milliseconds
  cancellationWindow: 24 * 60 * 60 * 1000, // 24 hours
} as const

export const PAYMENT = {
  gateways: {
    stripe: {
      name: 'Stripe',
      enabled: true,
      fees: { flatFeeCents: 50, percentageFee: 0.029 },
    },
    mtn: {
      name: 'MTN Mobile Money',
      enabled: true,
      fees: { flatFeeCents: 0, percentageFee: 0.0 },
    },
    airtel: {
      name: 'Airtel Money',
      enabled: true,
      fees: { flatFeeCents: 0, percentageFee: 0.0 },
    },
  },
  limits: {
    minAmountCents: 100,
    maxAmountCents: 1000000, // 10,000 RWF
  },
} as const

export const PRODUCT = {
  defaultImage: '/images/product-placeholder.jpg',
  maxImages: 10,
  discountMax: 100,
  stockLowLevel: 10,
  searchDebounceMs: 300,
} as const

export const UI = {
  toast: {
    duration: 5000,
    position: 'top-right' as const,
  },
  modal: {
    defaultSize: 'md' as const,
    closeOnOverlayClick: true,
    closeOnEscape: true,
  },
  loading: {
    minDisplayTime: 500,
    skeletonCount: 3,
  },
} as const

export const ROUTES = {
  public: {
    home: '/',
    products: '/products',
    product: '/products/:slug',
    category: '/category/:slug',
    search: '/search',
    about: '/about',
    contact: '/contact',
    login: '/auth/login',
    register: '/auth/register',
    forgot: '/auth/forgot-password',
    reset: '/auth/reset-password',
  },
  protected: {
    profile: '/profile',
    orders: '/orders',
    order: '/orders/:id',
    cart: '/cart',
    checkout: '/checkout',
    payment: '/payment/:id',
    chat: '/chat',
    conversation: '/chat/:id',
  },
  admin: {
    dashboard: '/admin',
    products: '/admin/products',
    orders: '/admin/orders',
    customers: '/admin/customers',
    analytics: '/admin/analytics',
    settings: '/admin/settings',
    chat: '/admin/chat',
  },
} as const

export const STORAGE_KEYS = {
  auth: 'jk_auth',
  cart: 'jk_cart',
  preferences: 'jk_preferences',
  theme: 'jk_theme',
  language: 'jk_language',
  notifications: 'jk_notifications',
} as const

export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Business logic errors
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
  
  // System errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export const BUSINESS_HOURS = {
  monday: { open: '08:00', close: '18:00', closed: false },
  tuesday: { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday: { open: '08:00', close: '18:00', closed: false },
  friday: { open: '08:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '16:00', closed: false },
  sunday: { open: '00:00', close: '00:00', closed: true },
} as const

export const ANALYTICS = {
  events: {
    pageView: 'page_view',
    productView: 'product_view',
    addToCart: 'add_to_cart',
    removeFromCart: 'remove_from_cart',
    initiateCheckout: 'initiate_checkout',
    purchase: 'purchase',
    search: 'search',
    login: 'login',
    register: 'register',
    contact: 'contact',
  },
  properties: {
    productId: 'product_id',
    productName: 'product_name',
    categoryId: 'category_id',
    categoryName: 'category_name',
    price: 'price',
    quantity: 'quantity',
    orderId: 'order_id',
    orderValue: 'order_value',
    paymentMethod: 'payment_method',
    searchQuery: 'search_query',
    searchResults: 'search_results',
  },
} as const
