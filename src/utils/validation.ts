// Validation utility functions

import { VALIDATION } from './constants'

/**
 * Email validation
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }
  
  if (email.length < VALIDATION.email.minLength) {
    return { isValid: false, error: `Email must be at least ${VALIDATION.email.minLength} characters` }
  }
  
  if (email.length > VALIDATION.email.maxLength) {
    return { isValid: false, error: `Email must be less than ${VALIDATION.email.maxLength} characters` }
  }
  
  if (!VALIDATION.email.pattern.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }
  
  return { isValid: true }
}

/**
 * Password validation
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!password) {
    errors.push('Password is required')
    return { isValid: false, errors }
  }
  
  if (password.length < VALIDATION.password.minLength) {
    errors.push(`Password must be at least ${VALIDATION.password.minLength} characters`)
  }
  
  if (password.length > VALIDATION.password.maxLength) {
    errors.push(`Password must be less than ${VALIDATION.password.maxLength} characters`)
  }
  
  if (VALIDATION.password.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (VALIDATION.password.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (VALIDATION.password.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (VALIDATION.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return { isValid: errors.length === 0, errors }
}

/**
 * Phone number validation
 */
export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' }
  }
  
  const cleanedPhone = phone.replace(/\D/g, '')
  
  if (cleanedPhone.length < VALIDATION.phone.minLength) {
    return { isValid: false, error: `Phone number must be at least ${VALIDATION.phone.minLength} digits` }
  }
  
  if (cleanedPhone.length > VALIDATION.phone.maxLength) {
    return { isValid: false, error: `Phone number must be less than ${VALIDATION.phone.maxLength} digits` }
  }
  
  if (!VALIDATION.phone.pattern.test(phone)) {
    return { isValid: false, error: 'Please enter a valid phone number' }
  }
  
  return { isValid: true }
}

/**
 * Name validation
 */
export const validateName = (name: string, fieldName: string = 'Name'): { isValid: boolean; error?: string } => {
  if (!name) {
    return { isValid: false, error: `${fieldName} is required` }
  }
  
  if (name.length < VALIDATION.name.minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${VALIDATION.name.minLength} characters` }
  }
  
  if (name.length > VALIDATION.name.maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${VALIDATION.name.maxLength} characters` }
  }
  
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` }
  }
  
  return { isValid: true }
}

/**
 * Address validation
 */
export const validateAddress = (address: string, fieldName: string = 'Address'): { isValid: boolean; error?: string } => {
  if (!address) {
    return { isValid: false, error: `${fieldName} is required` }
  }
  
  if (address.length < VALIDATION.address.minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${VALIDATION.address.minLength} characters` }
  }
  
  if (address.length > VALIDATION.address.maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${VALIDATION.address.maxLength} characters` }
  }
  
  return { isValid: true }
}

/**
 * Required field validation
 */
export const validateRequired = (value: any, fieldName: string): { isValid: boolean; error?: string } => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` }
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` }
  }
  
  return { isValid: true }
}

/**
 * Number validation
 */
export const validateNumber = (
  value: any,
  options: {
    min?: number
    max?: number
    integer?: boolean
    fieldName?: string
  } = {}
): { isValid: boolean; error?: string } => {
  const { min, max, integer = false, fieldName = 'Value' } = options
  
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` }
  }
  
  const num = Number(value)
  
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` }
  }
  
  if (integer && !Number.isInteger(num)) {
    return { isValid: false, error: `${fieldName} must be an integer` }
  }
  
  if (min !== undefined && num < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` }
  }
  
  if (max !== undefined && num > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max}` }
  }
  
  return { isValid: true }
}

/**
 * File validation
 */
export const validateFile = (
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    fieldName?: string
  } = {}
): { isValid: boolean; errors: string[] } => {
  const { maxSize, allowedTypes, fieldName = 'File' } = options
  const errors: string[] = []
  
  if (!file) {
    errors.push(`${fieldName} is required`)
    return { isValid: false, errors }
  }
  
  if (maxSize && file.size > maxSize) {
    errors.push(`${fieldName} must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
  }
  
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    errors.push(`${fieldName} must be one of: ${allowedTypes.join(', ')}`)
  }
  
  return { isValid: errors.length === 0, errors }
}

/**
 * Product validation
 */
export const validateProduct = (product: any): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}
  
  // SKU validation
  if (!product.sku) {
    errors.sku = 'SKU is required'
  }
  
  // Name validation
  const nameValidation = validateName(product.name, 'Product name')
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error!
  }
  
  // Brand validation
  const brandValidation = validateName(product.brand, 'Brand')
  if (!brandValidation.isValid) {
    errors.brand = brandValidation.error!
  }
  
  // Price validation
  const priceValidation = validateNumber(product.price_cents, {
    min: 1,
    fieldName: 'Price',
  })
  if (!priceValidation.isValid) {
    errors.price_cents = priceValidation.error!
  }
  
  // Stock validation
  const stockValidation = validateNumber(product.stock_quantity, {
    min: 0,
    integer: true,
    fieldName: 'Stock quantity',
  })
  if (!stockValidation.isValid) {
    errors.stock_quantity = stockValidation.error!
  }
  
  // Discount validation
  if (product.discount_percent !== undefined) {
    const discountValidation = validateNumber(product.discount_percent, {
      min: 0,
      max: 100,
      fieldName: 'Discount',
    })
    if (!discountValidation.isValid) {
      errors.discount_percent = discountValidation.error!
    }
  }
  
  // Alcohol percentage validation
  if (product.alcohol_percent !== undefined) {
    const alcoholValidation = validateNumber(product.alcohol_percent, {
      min: 0,
      max: 100,
      fieldName: 'Alcohol percentage',
    })
    if (!alcoholValidation.isValid) {
      errors.alcohol_percent = alcoholValidation.error!
    }
  }
  
  // Volume validation
  if (product.volume_ml !== undefined) {
    const volumeValidation = validateNumber(product.volume_ml, {
      min: 1,
      integer: true,
      fieldName: 'Volume',
    })
    if (!volumeValidation.isValid) {
      errors.volume_ml = volumeValidation.error!
    }
  }
  
  return { isValid: Object.keys(errors).length === 0, errors }
}

/**
 * Order validation
 */
export const validateOrder = (order: any): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}
  
  // Items validation
  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
    errors.items = 'Order must contain at least one item'
  } else {
    order.items.forEach((item: any, index: number) => {
      if (!item.product_id) {
        errors[`items_${index}_product_id`] = 'Product ID is required'
      }
      
      const quantityValidation = validateNumber(item.quantity, {
        min: 1,
        integer: true,
        fieldName: 'Quantity',
      })
      if (!quantityValidation.isValid) {
        errors[`items_${index}_quantity`] = quantityValidation.error!
      }
    })
  }
  
  // Shipping address validation
  if (!order.shipping_address) {
    errors.shipping_address = 'Shipping address is required'
  } else {
    const streetValidation = validateAddress(order.shipping_address.street_address, 'Street address')
    if (!streetValidation.isValid) {
      errors.shipping_street = streetValidation.error!
    }
    
    const cityValidation = validateName(order.shipping_address.city, 'City')
    if (!cityValidation.isValid) {
      errors.shipping_city = cityValidation.error!
    }
  }
  
  // Payment method validation
  if (!order.payment_method) {
    errors.payment_method = 'Payment method is required'
  }
  
  return { isValid: Object.keys(errors).length === 0, errors }
}

/**
 * Form validation helper
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, (value: any) => { isValid: boolean; error?: string }>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}
  
  for (const [field, validator] of Object.entries(rules)) {
    const validation = validator(data[field])
    if (!validation.isValid) {
      errors[field] = validation.error!
    }
  }
  
  return { isValid: Object.keys(errors).length === 0, errors }
}
