// Order service

import { supabase } from './supabase'
import type { 
  Order, 
  OrderItem, 
  CreateOrderRequest, 
  CreateOrderItemRequest,
  OrderFilters,
  OrderUpdateData,
  OrderSummary,
  OrderStatusHistory
} from '@/types/order'
import type { Product } from '@/types/product'
import { AppError, NotFoundError, ValidationError, BusinessError } from '@/utils/errors'
import { validateOrder } from '@/utils/validation'

export class OrderService {
  /**
   * Create new order
   */
  static async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    // Validate order data
    const validation = validateOrder(orderData)
    if (!validation.isValid) {
      throw new ValidationError('Order validation failed', validation.errors)
    }

    try {
      // Check stock availability for all items
      const productIds = orderData.items.map(item => item.product_id)
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, stock_quantity, reserved_quantity, price_cents, name')
        .in('id', productIds)

      if (productError) {
        throw new AppError(productError.message, 'PRODUCTS_FETCH_FAILED', 500)
      }

      // Check stock availability
      for (const item of orderData.items) {
        const product = products?.find(p => p.id === item.product_id)
        if (!product) {
          throw new NotFoundError('Product')
        }

        const availableStock = product.stock_quantity - product.reserved_quantity
        if (availableStock < item.quantity) {
          throw new BusinessError(
            `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`,
            'INSUFFICIENT_STOCK'
          )
        }
      }

      // Reserve stock
      for (const item of orderData.items) {
        const product = products!.find(p => p.id === item.product_id)!
        const { error: reserveError } = await supabase
          .from('products')
          .update({ 
            reserved_quantity: product.reserved_quantity + item.quantity 
          })
          .eq('id', item.product_id)

        if (reserveError) {
          throw new AppError(reserveError.message, 'STOCK_RESERVATION_FAILED', 500)
        }
      }

      // Calculate totals
      let totalAmount = 0
      const orderItems: any[] = []

      for (const item of orderData.items) {
        const product = products!.find(p => p.id === item.product_id)!
        const unitPrice = product.price_cents
        const itemTotal = unitPrice * item.quantity
        totalAmount += itemTotal

        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_cents: unitPrice,
          total_cents: itemTotal,
        })
      }

      // Add shipping cost
      const shippingCost = 2000 // Default shipping cost
      totalAmount += shippingCost

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: (await supabase.auth.getUser()).data.user?.id,
          status: 'pending',
          total_amount_cents: totalAmount,
          tax_cents: Math.round(totalAmount * 0.18), // 18% tax
          shipping_cost_cents: shippingCost,
          payment_method: orderData.payment_method,
          shipping_address: orderData.shipping_address,
          billing_address: orderData.billing_address,
          customer_notes: orderData.customer_notes,
        })
        .select()
        .single()

      if (orderError) {
        // Rollback stock reservation
        for (const item of orderData.items) {
          const product = products!.find(p => p.id === item.product_id)!
          await supabase
            .from('products')
            .update({ 
              reserved_quantity: product.reserved_quantity 
            })
            .eq('id', item.product_id)
        }
        throw new AppError(orderError.message, 'ORDER_CREATE_FAILED', 500)
      }

      // Create order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          orderItems.map(item => ({
            ...item,
            order_id: order.id,
          }))
        )

      if (itemsError) {
        throw new AppError(itemsError.message, 'ORDER_ITEMS_CREATE_FAILED', 500)
      }

      return order
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to create order', 'ORDER_CREATE_FAILED', 500)
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(id: string): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('order_summary')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new NotFoundError('Order')
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch order', 'ORDER_FETCH_FAILED', 500)
    }
  }

  /**
   * Get user orders
   */
  static async getUserOrders(
    userId: string,
    filters: OrderFilters = {}
  ): Promise<{ items: Order[]; total: number }> {
    try {
      let query = supabase
        .from('order_summary')
        .select('*', { count: 'exact' })
        .eq('customer_id', userId)

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.payment_status && filters.payment_status.length > 0) {
        query = query.in('payment_status', filters.payment_status)
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      if (filters.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'created_at'
      const sortOrder = filters.sort_order || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const page = filters.page || 1
      const limit = filters.limit || 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw new AppError(error.message, 'ORDERS_FETCH_FAILED', 500)
      }

      return {
        items: data || [],
        total: count || 0,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch orders', 'ORDERS_FETCH_FAILED', 500)
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<Order> {
    try {
      // Get current order
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new NotFoundError('Order')
      }

      // Update order
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status,
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new AppError(error.message, 'ORDER_UPDATE_FAILED', 500)
      }

      // Record status change
      await supabase
        .from('order_status_history')
        .insert({
          order_id: id,
          from_status: currentOrder.status,
          to_status: status,
          notes,
          changed_by: (await supabase.auth.getUser()).data.user?.id,
        })

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to update order', 'ORDER_UPDATE_FAILED', 500)
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(id: string, reason?: string): Promise<Order> {
    try {
      // Get order with items
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_id,
            quantity
          )
        `)
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new NotFoundError('Order')
      }

      // Check if order can be cancelled
      if (order.status === 'processing' || order.status === 'packed') {
        throw new BusinessError('Order cannot be cancelled in current status', 'ORDER_CANNOT_BE_CANCELLED')
      }

      // Release reserved stock
      if (order.order_items) {
        for (const item of order.order_items) {
          const { data: product } = await supabase
            .from('products')
            .select('reserved_quantity')
            .eq('id', item.product_id)
            .single()

          if (product) {
            await supabase
              .from('products')
              .update({
                reserved_quantity: Math.max(0, product.reserved_quantity - item.quantity),
              })
              .eq('id', item.product_id)
          }
        }
      }

      // Update order status
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          admin_notes: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new AppError(error.message, 'ORDER_CANCEL_FAILED', 500)
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to cancel order', 'ORDER_CANCEL_FAILED', 500)
    }
  }

  /**
   * Get order items
   */
  static async getOrderItems(orderId: string): Promise<OrderItem[]> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            id,
            name,
            sku,
            image_urls
          )
        `)
        .eq('order_id', orderId)

      if (error) {
        throw new AppError(error.message, 'ORDER_ITEMS_FETCH_FAILED', 500)
      }

      return data || []
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch order items', 'ORDER_ITEMS_FETCH_FAILED', 500)
    }
  }

  /**
   * Get order status history
   */
  static async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      if (error) {
        throw new AppError(error.message, 'ORDER_STATUS_HISTORY_FETCH_FAILED', 500)
      }

      return data || []
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch order status history', 'ORDER_STATUS_HISTORY_FETCH_FAILED', 500)
    }
  }

  /**
   * Get all orders (admin)
   */
  static async getAllOrders(filters: OrderFilters = {}): Promise<{ items: OrderSummary[]; total: number }> {
    try {
      let query = supabase
        .from('order_summary')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.payment_status && filters.payment_status.length > 0) {
        query = query.in('payment_status', filters.payment_status)
      }

      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      if (filters.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'created_at'
      const sortOrder = filters.sort_order || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const page = filters.page || 1
      const limit = filters.limit || 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw new AppError(error.message, 'ORDERS_FETCH_FAILED', 500)
      }

      return {
        items: data || [],
        total: count || 0,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch orders', 'ORDERS_FETCH_FAILED', 500)
    }
  }

  /**
   * Confirm order (after successful payment)
   */
  static async confirmOrder(orderId: string): Promise<Order> {
    try {
      // Get order with items
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_id,
            quantity
          )
        `)
        .eq('id', orderId)
        .single()

      if (fetchError) {
        throw new NotFoundError('Order')
      }

      // Deduct from reserved stock and actual stock
      if (order.order_items) {
        for (const item of order.order_items) {
          const { data: product } = await supabase
            .from('products')
            .select('stock_quantity, reserved_quantity')
            .eq('id', item.product_id)
            .single()

          if (product) {
            await supabase
              .from('products')
              .update({
                stock_quantity: product.stock_quantity - item.quantity,
                reserved_quantity: Math.max(0, product.reserved_quantity - item.quantity),
              })
              .eq('id', item.product_id)

            // Record stock movement
            await supabase
              .from('stock_movements')
              .insert({
                product_id: item.product_id,
                movement_type: 'out',
                quantity: item.quantity,
                reference_type: 'order',
                reference_id: orderId,
                reason: 'Order fulfillment',
              })
          }
        }
      }

      // Update order status
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'processing',
          payment_status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        throw new AppError(error.message, 'ORDER_CONFIRM_FAILED', 500)
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to confirm order', 'ORDER_CONFIRM_FAILED', 500)
    }
  }
}

export default OrderService
