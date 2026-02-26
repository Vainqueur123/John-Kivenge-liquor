// Order status
export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'packed' 
  | 'ready_for_pickup' 
  | 'in_transit' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled'

// Payment status
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

// Payment method
export type PaymentMethod = 'mtn' | 'airtel' | 'stripe'

// Import Product type for reference
import type { Product } from './product'

// Order interface
export interface Order {
  id: string
  order_number: string
  customer_id: string
  status: OrderStatus
  total_amount_cents: number
  tax_cents: number
  discount_cents: number
  shipping_cost_cents: number
  payment_method?: PaymentMethod
  payment_status: PaymentStatus
  payment_reference?: string
  shipping_address: AddressData
  billing_address?: AddressData
  customer_notes?: string
  admin_notes?: string
  created_at: string
  updated_at: string
  completed_at?: string
  // Joined fields
  customer_name?: string
  customer_email?: string
  item_count?: number
}

// Order item interface
export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price_cents: number
  discount_cents: number
  total_cents: number
  created_at: string
  // Joined fields
  product?: Product
}

// Order status history
export interface OrderStatusHistory {
  id: string
  order_id: string
  from_status?: OrderStatus
  to_status: OrderStatus
  notes?: string
  changed_by?: string
  created_at: string
}

// Address data structure
export interface AddressData {
  street_address: string
  city: string
  postal_code?: string
  country: string
}

// Create order request
export interface CreateOrderRequest {
  items: CreateOrderItemRequest[]
  shipping_address: AddressData
  billing_address?: AddressData
  customer_notes?: string
  payment_method: PaymentMethod
}

// Create order item request
export interface CreateOrderItemRequest {
  product_id: string
  quantity: number
}

// Order summary (for dashboard)
export interface OrderSummary {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  status: OrderStatus
  payment_status: PaymentStatus
  total_amount_cents: number
  item_count: number
  created_at: string
}

// Order filters
export interface OrderFilters {
  status?: OrderStatus[]
  payment_status?: PaymentStatus[]
  customer_id?: string
  date_from?: string
  date_to?: string
  search?: string // Search by order number or customer name
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'total_amount' | 'order_number'
  sort_order?: 'asc' | 'desc'
}

// Order statistics
export interface OrderStatistics {
  total_orders: number
  total_revenue: number
  average_order_value: number
  orders_by_status: Record<OrderStatus, number>
  revenue_by_month: Array<{
    month: string
    revenue: number
    orders: number
  }>
  top_products: Array<{
    product_id: string
    product_name: string
    quantity_sold: number
    revenue: number
  }>
}

// Order update data
export interface OrderUpdateData {
  status?: OrderStatus
  payment_status?: PaymentStatus
  admin_notes?: string
  shipping_address?: AddressData
}
