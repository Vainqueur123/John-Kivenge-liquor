import { supabase } from './supabaseClient.js'

export async function createOrder(userId, orderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_id: userId,
      total_amount_cents: orderData.total,
      shipping_address: orderData.shipping,
      billing_address: orderData.billing,
      customer_notes: orderData.notes,
      status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single()
  
  return { data, error }
}

export async function fetchUserOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function fetchOrder(id) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (*)
      )
    `)
    .eq('id', id)
    .single()
  
  return { data, error }
}
