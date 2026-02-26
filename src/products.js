import { supabase } from './supabaseClient.js'

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
  
  return { data, error }
}

export async function fetchProduct(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  
  return { data, error }
}

export async function searchProducts(query) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('status', 'active')
  
  return { data, error }
}
