// Payment service

import { supabase } from './supabase'
import type { 
  PaymentTransaction,
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  MobileMoneyPaymentRequest,
  MobileMoneyPaymentResponse,
  StripePaymentRequest,
  StripePaymentResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
  RefundRequest,
  RefundResponse
} from '@/types/payment'
import { AppError, ValidationError, BusinessError } from '@/utils/errors'
import { validateNumber } from '@/utils/validation'

export class PaymentService {
  /**
   * Initiate payment
   */
  static async initiatePayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    try {
      switch (request.method) {
        case 'stripe':
          return await this.initiateStripePayment(request)
        case 'mtn':
          return await this.initiateMobileMoneyPayment(request, 'mtn')
        case 'airtel':
          return await this.initiateMobileMoneyPayment(request, 'airtel')
        default:
          throw new ValidationError('Invalid payment method')
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to initiate payment', 'PAYMENT_INITIATION_FAILED', 500)
    }
  }

  /**
   * Initiate Stripe payment
   */
  private static async initiateStripePayment(
    request: PaymentInitiationRequest
  ): Promise<PaymentInitiationResponse> {
    try {
      // Create payment intent with Stripe (this would integrate with Stripe API)
      // For now, return a mock response
      const paymentIntent = {
        id: `pi_${Date.now()}`,
        client_secret: `pi_${Date.now()}_secret_${Date.now()}`,
        status: 'requires_payment_method',
        amount: request.order_id ? 10000 : 50000, // Mock amount
      }

      return {
        success: true,
        transaction_id: paymentIntent.id,
        payment_intent_client_secret: paymentIntent.client_secret,
        payment_url: `https://checkout.stripe.com/pay/${paymentIntent.id}`,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }
    } catch (error) {
      throw new AppError('Failed to initiate Stripe payment', 'STRIPE_PAYMENT_INITIATION_FAILED', 500)
    }
  }

  /**
   * Initiate Mobile Money payment
   */
  private static async initiateMobileMoneyPayment(
    request: PaymentInitiationRequest,
    provider: 'mtn' | 'airtel'
  ): Promise<PaymentInitiationResponse> {
    try {
      // This would integrate with MTN or Airtel Money APIs
      // For now, return a mock response
      const transactionId = `${provider}_${Date.now()}`
      
      return {
        success: true,
        transaction_id: transactionId,
        instructions: `Dial *182# and follow the prompts to complete your payment. Transaction ID: ${transactionId}`,
        qr_code: `data:image/png;base64,mock_qr_code_data`,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }
    } catch (error) {
      throw new AppError(`Failed to initiate ${provider.toUpperCase()} payment`, 'MOBILE_MONEY_PAYMENT_INITIATION_FAILED', 500)
    }
  }

  /**
   * Process Mobile Money payment
   */
  static async processMobileMoneyPayment(
    request: MobileMoneyPaymentRequest
  ): Promise<MobileMoneyPaymentResponse> {
    // Validate phone number
    const phoneValidation = validateNumber(request.phone_number, {
      min: 1000000000,
      max: 9999999999,
      fieldName: 'Phone number',
    })
    
    if (!phoneValidation.isValid) {
      throw new ValidationError(phoneValidation.error!)
    }

    try {
      // This would integrate with the actual Mobile Money APIs
      // For now, return a mock response
      const referenceId = `${request.provider}_${Date.now()}`
      
      return {
        success: true,
        transaction_id: `txn_${Date.now()}`,
        reference_id: referenceId,
        status: 'pending',
        instructions: `Payment initiated. Please confirm on your phone.`,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }
    } catch (error) {
      throw new AppError('Failed to process Mobile Money payment', 'MOBILE_MONEY_PAYMENT_FAILED', 500)
    }
  }

  /**
   * Process Stripe payment
   */
  static async processStripePayment(
    request: StripePaymentRequest
  ): Promise<StripePaymentResponse> {
    try {
      // This would integrate with Stripe API
      // For now, return a mock response
      return {
        success: true,
        payment_intent_id: `pi_${Date.now()}`,
        client_secret: `pi_${Date.now()}_secret_${Date.now()}`,
        status: 'requires_payment_method',
        requires_action: true,
        next_action: {
          type: 'use_stripe_sdk',
          redirect_to_url: {
            url: `https://js.stripe.com/v3/${Date.now()}`,
          },
        },
      }
    } catch (error) {
      throw new AppError('Failed to process Stripe payment', 'STRIPE_PAYMENT_FAILED', 500)
    }
  }

  /**
   * Verify payment
   */
  static async verifyPayment(
    request: PaymentVerificationRequest
  ): Promise<PaymentVerificationResponse> {
    try {
      let transaction: PaymentTransaction | null = null

      // Get transaction from database
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', request.transaction_id)
        .single()

      if (error || !data) {
        throw new AppError('Transaction not found', 'TRANSACTION_NOT_FOUND', 404)
      }

      transaction = data

      // Verify with gateway based on transaction gateway
      let verificationResult: { status: string; gateway_response?: any } = { status: 'pending' }

      switch (transaction.gateway) {
        case 'stripe':
          verificationResult = await this.verifyStripePayment(transaction.gateway_transaction_id!)
          break
        case 'mtn':
          verificationResult = await this.verifyMobileMoneyPayment(transaction.gateway_transaction_id!, 'mtn')
          break
        case 'airtel':
          verificationResult = await this.verifyMobileMoneyPayment(transaction.gateway_transaction_id!, 'airtel')
          break
      }

      // Update transaction status
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: verificationResult.status,
          gateway_response: verificationResult.gateway_response,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.transaction_id)

      if (updateError) {
        throw new AppError('Failed to update transaction status', 'TRANSACTION_UPDATE_FAILED', 500)
      }

      return {
        success: verificationResult.status === 'completed',
        status: verificationResult.status as any,
        amount_cents: transaction.amount_cents,
        currency: transaction.currency,
        gateway_response: verificationResult.gateway_response,
        verified_at: new Date().toISOString(),
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to verify payment', 'PAYMENT_VERIFICATION_FAILED', 500)
    }
  }

  /**
   * Verify Stripe payment
   */
  private static async verifyStripePayment(paymentIntentId: string): Promise<{ status: string; gateway_response?: any }> {
    try {
      // This would integrate with Stripe API to verify payment intent
      // For now, return a mock response
      return {
        status: 'completed',
        gateway_response: {
          id: paymentIntentId,
          status: 'succeeded',
          amount: 10000,
        },
      }
    } catch (error) {
      return { status: 'failed' }
    }
  }

  /**
   * Verify Mobile Money payment
   */
  private static async verifyMobileMoneyPayment(
    transactionId: string,
    provider: 'mtn' | 'airtel'
  ): Promise<{ status: string; gateway_response?: any }> {
    try {
      // This would integrate with MTN or Airtel Money APIs
      // For now, return a mock response
      return {
        status: 'completed',
        gateway_response: {
          transactionId,
          status: 'SUCCESSFUL',
          amount: 10000,
        },
      }
    } catch (error) {
      return { status: 'failed' }
    }
  }

  /**
   * Process refund
   */
  static async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', request.order_id)
        .single()

      if (orderError || !order) {
        throw new AppError('Order not found', 'ORDER_NOT_FOUND', 404)
      }

      // Check if order can be refunded
      if (order.status !== 'completed' && order.status !== 'delivered') {
        throw new BusinessError('Order cannot be refunded in current status', 'ORDER_CANNOT_BE_REFUNDED')
      }

      // Calculate refund amount
      const refundAmount = request.amount_cents || order.total_amount_cents

      // Process refund with appropriate gateway
      let refundResult: any

      if (order.payment_method === 'stripe') {
        refundResult = await this.processStripeRefund(order.payment_reference!, refundAmount)
      } else if (order.payment_method === 'mtn') {
        refundResult = await this.processMobileMoneyRefund(order.payment_reference!, refundAmount, 'mtn')
      } else if (order.payment_method === 'airtel') {
        refundResult = await this.processMobileMoneyRefund(order.payment_reference!, refundAmount, 'airtel')
      }

      // Create refund record
      const { data, error } = await supabase
        .from('refunds')
        .insert({
          order_id: request.order_id,
          amount_cents: refundAmount,
          reason: request.reason,
          gateway: order.payment_method,
          gateway_refund_id: refundResult?.id,
          status: refundResult?.status || 'pending',
        })
        .select()
        .single()

      if (error) {
        throw new AppError('Failed to create refund record', 'REFUND_CREATE_FAILED', 500)
      }

      // Update order status if full refund
      if (refundAmount >= order.total_amount_cents) {
        await supabase
          .from('orders')
          .update({ status: 'refunded' })
          .eq('id', request.order_id)
      }

      return {
        success: refundResult?.status === 'succeeded',
        refund_id: data.id,
        amount_cents: refundAmount,
        status: refundResult?.status || 'pending',
        processed_at: refundResult?.processed_at,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to process refund', 'REFUND_PROCESS_FAILED', 500)
    }
  }

  /**
   * Process Stripe refund
   */
  private static async processStripeRefund(paymentIntentId: string, amount: number): Promise<any> {
    try {
      // This would integrate with Stripe API to process refund
      // For now, return a mock response
      return {
        id: `re_${Date.now()}`,
        status: 'succeeded',
        amount,
        processed_at: new Date().toISOString(),
      }
    } catch (error) {
      throw new AppError('Failed to process Stripe refund', 'STRIPE_REFUND_FAILED', 500)
    }
  }

  /**
   * Process Mobile Money refund
   */
  private static async processMobileMoneyRefund(
    transactionId: string,
    amount: number,
    provider: 'mtn' | 'airtel'
  ): Promise<any> {
    try {
      // This would integrate with MTN or Airtel Money APIs
      // For now, return a mock response
      return {
        id: `refund_${provider}_${Date.now()}`,
        status: 'succeeded',
        amount,
        processed_at: new Date().toISOString(),
      }
    } catch (error) {
      throw new AppError(`Failed to process ${provider.toUpperCase()} refund`, 'MOBILE_MONEY_REFUND_FAILED', 500)
    }
  }

  /**
   * Get payment transaction
   */
  static async getPaymentTransaction(transactionId: string): Promise<PaymentTransaction> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (error) {
        throw new AppError('Transaction not found', 'TRANSACTION_NOT_FOUND', 404)
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch payment transaction', 'TRANSACTION_FETCH_FAILED', 500)
    }
  }

  /**
   * Get payment methods
   */
  static async getPaymentMethods(): Promise<any[]> {
    try {
      // This would return available payment methods from system settings
      return [
        {
          id: 'stripe',
          name: 'Credit/Debit Card',
          description: 'Pay with Visa, Mastercard, or other credit/debit cards',
          enabled: true,
          icon: 'credit-card',
        },
        {
          id: 'mtn',
          name: 'MTN Mobile Money',
          description: 'Pay with MTN Mobile Money',
          enabled: true,
          icon: 'mobile',
        },
        {
          id: 'airtel',
          name: 'Airtel Money',
          description: 'Pay with Airtel Money',
          enabled: true,
          icon: 'mobile',
        },
      ]
    } catch (error) {
      throw new AppError('Failed to fetch payment methods', 'PAYMENT_METHODS_FETCH_FAILED', 500)
    }
  }

  /**
   * Handle webhook
   */
  static async handleWebhook(gateway: string, payload: any, signature?: string): Promise<void> {
    try {
      // Verify webhook signature
      if (gateway === 'stripe' && signature) {
        // This would verify Stripe webhook signature
        // const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
      }

      // Process webhook event
      switch (gateway) {
        case 'stripe':
          await this.handleStripeWebhook(payload)
          break
        case 'mtn':
          await this.handleMobileMoneyWebhook(payload, 'mtn')
          break
        case 'airtel':
          await this.handleMobileMoneyWebhook(payload, 'airtel')
          break
      }
    } catch (error) {
      throw new AppError('Failed to handle webhook', 'WEBHOOK_HANDLER_FAILED', 500)
    }
  }

  /**
   * Handle Stripe webhook
   */
  private static async handleStripeWebhook(payload: any): Promise<void> {
    try {
      const eventType = payload.type
      const eventObject = payload.data.object

      switch (eventType) {
        case 'payment_intent.succeeded':
          // Update payment transaction status
          await supabase
            .from('payment_transactions')
            .update({
              status: 'completed',
              gateway_response: eventObject,
              updated_at: new Date().toISOString(),
            })
            .eq('gateway_transaction_id', eventObject.id)
          
          // Update order payment status
          await supabase
            .from('orders')
            .update({
              payment_status: 'completed',
              payment_reference: eventObject.id,
            })
            .eq('id', eventObject.metadata?.order_id)
          break

        case 'payment_intent.payment_failed':
          // Update payment transaction status
          await supabase
            .from('payment_transactions')
            .update({
              status: 'failed',
              gateway_response: eventObject,
              updated_at: new Date().toISOString(),
            })
            .eq('gateway_transaction_id', eventObject.id)
          break
      }
    } catch (error) {
      throw new AppError('Failed to handle Stripe webhook', 'STRIPE_WEBHOOK_FAILED', 500)
    }
  }

  /**
   * Handle Mobile Money webhook
   */
  private static async handleMobileMoneyWebhook(payload: any, provider: string): Promise<void> {
    try {
      // This would handle MTN or Airtel Money webhooks
      const transactionId = payload.transactionId
      const status = payload.status

      // Update payment transaction status
      await supabase
        .from('payment_transactions')
        .update({
          status: status === 'SUCCESSFUL' ? 'completed' : 'failed',
          gateway_response: payload,
          updated_at: new Date().toISOString(),
        })
        .eq('gateway_transaction_id', transactionId)

      // Update order payment status if successful
      if (status === 'SUCCESSFUL') {
        await supabase
          .from('orders')
          .update({
            payment_status: 'completed',
            payment_reference: transactionId,
          })
          .eq('id', payload.orderId)
      }
    } catch (error) {
      throw new AppError(`Failed to handle ${provider} webhook`, 'MOBILE_MONEY_WEBHOOK_FAILED', 500)
    }
  }
}

export default PaymentService
