// Payment gateway types
import type { PaymentStatus } from './order'

export type PaymentGateway = 'stripe' | 'mtn' | 'airtel'
export type PaymentMethod = 'mtn' | 'airtel' | 'stripe'

// Payment transaction interface
export interface PaymentTransaction {
  id: string
  order_id: string
  gateway: PaymentGateway
  gateway_transaction_id?: string
  amount_cents: number
  currency: string
  status: PaymentStatus
  gateway_response?: Record<string, any>
  created_at: string
  updated_at: string
}

// Payment initiation request
export interface PaymentInitiationRequest {
  order_id: string
  method: PaymentMethod
  success_url?: string
  cancel_url?: string
  customer_info?: {
    email: string
    name: string
    phone?: string
  }
}

// Payment initiation response
export interface PaymentInitiationResponse {
  success: boolean
  transaction_id: string
  payment_url?: string // For redirect-based payments (Stripe, Mobile Money)
  payment_intent_client_secret?: string // For Stripe Elements
  qr_code?: string // For Mobile Money QR codes
  instructions?: string // Payment instructions
  expires_at?: string
  error?: string
}

// Mobile Money payment request
export interface MobileMoneyPaymentRequest {
  order_id: string
  phone_number: string
  provider: 'mtn' | 'address'
  amount_cents: number
  currency?: string
}

// Mobile Money payment response
export interface MobileMoneyPaymentResponse {
  success: boolean
  transaction_id: string
  reference_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  instructions?: string
  expires_at?: string
  error?: string
}

// Stripe payment request
export interface StripePaymentRequest {
  order_id: string
  payment_method_id?: string
  save_payment_method?: boolean
  customer_id?: string
}

// Stripe payment response
export interface StripePaymentResponse {
  success: boolean
  payment_intent_id: string
  client_secret: string
  status: string
  requires_action?: boolean
  next_action?: {
    type: string
    redirect_to_url?: {
      url: string
    }
  }
  error?: string
}

// Webhook event types
export type WebhookEvent = 
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'charge.succeeded'
  | 'charge.failed'
  | 'momo.payment.completed'
  | 'momo.payment.failed'
  | 'airtel.payment.completed'
  | 'airtel.payment.failed'

// Webhook payload base
export interface WebhookPayload {
  id: string
  type: WebhookEvent
  data: {
    object: any
  }
  created: number
  livemode: boolean
  pending_webhooks: number
  request: {
    id: string | null
    idempotency_key: string | null
  }
}

// Payment verification request
export interface PaymentVerificationRequest {
  transaction_id: string
  gateway: PaymentGateway
}

// Payment verification response
export interface PaymentVerificationResponse {
  success: boolean
  status: PaymentStatus
  amount_cents: number
  currency: string
  gateway_response?: Record<string, any>
  verified_at: string
  error?: string
}

// Refund request
export interface RefundRequest {
  order_id: string
  reason: string
  amount_cents?: number // If not provided, refund full amount
  refund_items?: Array<{
    order_item_id: string
    quantity: number
    reason: string
  }>
}

// Refund response
export interface RefundResponse {
  success: boolean
  refund_id: string
  amount_cents: number
  status: 'pending' | 'succeeded' | 'failed'
  processed_at?: string
  error?: string
}

// Payment method configuration
export interface PaymentMethodConfig {
  gateway: PaymentGateway
  enabled: boolean
  config: Record<string, any>
  fees: {
    flat_fee_cents: number
    percentage_fee: number
  }
  limits: {
    min_amount_cents: number
    max_amount_cents: number
  }
}

// Payment analytics
export interface PaymentAnalytics {
  total_payments: number
  total_volume: number
  success_rate: number
  average_processing_time: number
  payments_by_gateway: Record<PaymentGateway, {
    count: number
    volume: number
    success_rate: number
  }>
  payments_by_method: Record<PaymentMethod, {
    count: number
    volume: number
  }>
  revenue_by_period: Array<{
    period: string
    revenue: number
    payments: number
  }>
}
