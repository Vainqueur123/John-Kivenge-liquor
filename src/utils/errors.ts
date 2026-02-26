// Error handling utilities

import { ERROR_CODES } from './constants'

/**
 * Custom error class
 */
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details?: Record<string, any>

  constructor(
    message: string,
    code: string = ERROR_CODES.UNKNOWN_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400, true, details)
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, ERROR_CODES.INVALID_CREDENTIALS, 401)
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, ERROR_CODES.ACCESS_DENIED, 403)
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, ERROR_CODES.ORDER_NOT_FOUND, 404)
  }
}

/**
 * Business logic error class
 */
export class BusinessError extends AppError {
  constructor(message: string, code: string, statusCode: number = 400) {
    super(message, code, statusCode)
  }
}

/**
 * Network error class
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(message, ERROR_CODES.NETWORK_ERROR, 0)
  }
}

/**
 * Server error class
 */
export class ServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, ERROR_CODES.SERVER_ERROR, 500)
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorListeners: Array<(error: AppError) => void> = []

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Add error listener
   */
  public addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener)
  }

  /**
   * Remove error listener
   */
  public removeErrorListener(listener: (error: AppError) => void): void {
    const index = this.errorListeners.indexOf(listener)
    if (index > -1) {
      this.errorListeners.splice(index, 1)
    }
  }

  /**
   * Handle error
   */
  public handleError(error: Error): AppError {
    let appError: AppError

    if (error instanceof AppError) {
      appError = error
    } else if (error instanceof TypeError) {
      appError = new ValidationError(error.message)
    } else if (error instanceof SyntaxError) {
      appError = new ValidationError('Invalid data format')
    } else {
      appError = new AppError(
        error.message || 'An unexpected error occurred',
        ERROR_CODES.UNKNOWN_ERROR,
        500,
        false
      )
    }

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(appError)
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError)
      }
    })

    // Log error
    this.logError(appError)

    return appError
  }

  /**
   * Log error
   */
  private logError(error: AppError): void {
    const logData = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      details: error.details,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server',
    }

    if (error.statusCode >= 500) {
      console.error('Server Error:', logData)
    } else {
      console.warn('Client Error:', logData)
    }
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = ErrorHandler.getInstance()

/**
 * Safe async function wrapper
 */
export const safeAsync = <T>(
  asyncFn: () => Promise<T>,
  errorHandler?: (error: AppError) => void
): Promise<[T | null, AppError | null]> => {
  return asyncFn()
    .then<[T, null]>((data: T) => [data, null])
    .catch<[null, AppError]>((error: Error) => {
      const appError = errorHandler.handleError(error)
      if (errorHandler) {
        errorHandler(appError)
      }
      return [null, appError]
    })
}

/**
 * Safe function wrapper
 */
export const safeFn = <T>(
  fn: () => T,
  errorHandler?: (error: AppError) => void
): [T | null, AppError | null] => {
  try {
    const result = fn()
    return [result, null]
  } catch (error) {
    const appError = errorHandler.handleError(error as Error)
    if (errorHandler) {
      errorHandler(appError)
    }
    return [null, appError]
  }
}

/**
 * Create error from API response
 */
export const createApiError = (response: any): AppError => {
  const message = response?.error?.message || response?.message || 'API request failed'
  const code = response?.error?.code || ERROR_CODES.SERVER_ERROR
  const statusCode = response?.error?.status || response?.status || 500
  const details = response?.error?.details

  return new AppError(message, code, statusCode, true, details)
}

/**
 * Check if error is network related
 */
export const isNetworkError = (error: Error): boolean => {
  return (
    error instanceof NetworkError ||
    error.message.includes('Network Error') ||
    error.message.includes('fetch') ||
    error.message.includes('timeout') ||
    !navigator.onLine
  )
}

/**
 * Check if error is authentication related
 */
export const isAuthError = (error: Error): boolean => {
  return (
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError ||
    (error as any).code === ERROR_CODES.INVALID_CREDENTIALS ||
    (error as any).code === ERROR_CODES.ACCESS_DENIED ||
    (error as any).code === ERROR_CODES.TOKEN_EXPIRED
  )
}

/**
 * Check if error is validation related
 */
export const isValidationError = (error: Error): boolean => {
  return (
    error instanceof ValidationError ||
    (error as any).code === ERROR_CODES.VALIDATION_ERROR ||
    (error as any).statusCode === 400
  )
}

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error: Error): string => {
  if (isNetworkError(error)) {
    return 'Please check your internet connection and try again.'
  }

  if (isAuthError(error)) {
    return 'Please log in to continue.'
  }

  if (isValidationError(error)) {
    return 'Please check your input and try again.'
  }

  if (error instanceof BusinessError) {
    return error.message
  }

  return 'Something went wrong. Please try again later.'
}

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        break
      }

      // Don't retry on client errors (4xx)
      if ((error as any).statusCode >= 400 && (error as any).statusCode < 500) {
        break
      }

      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
