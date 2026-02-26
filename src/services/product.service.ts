// Product service

import { supabase } from './supabase'
import type { 
  Product, 
  ProductDetail, 
  ProductSearchFilters, 
  ProductSearchResponse, 
  ProductFormData,
  Category,
  ProductImage,
  StockMovement
} from '@/types/product'
import { AppError, NotFoundError, ValidationError } from '@/utils/errors'
import { validateProduct } from '@/utils/validation'

export class ProductService {
  /**
   * Get all products with optional filters
   */
  static async getProducts(
    filters: ProductSearchFilters = {}
  ): Promise<ProductSearchResponse> {
    try {
      let query = supabase
        .from('product_details')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.q) {
        query = query.textSearch('search_vector', filters.q)
      }

      if (filters.categories && filters.categories.length > 0) {
        query = query.in('category_id', filters.categories)
      }

      if (filters.minPrice) {
        query = query.gte('price_cents', filters.minPrice)
      }

      if (filters.maxPrice) {
        query = query.lte('price_cents', filters.maxPrice)
      }

      if (filters.minAlcohol) {
        query = query.gte('alcohol_percent', filters.minAlcohol)
      }

      if (filters.maxAlcohol) {
        query = query.lte('alcohol_percent', filters.maxAlcohol)
      }

      if (filters.inStock) {
        query = query.gt('stock_quantity', 0)
      }

      if (filters.brands && filters.brands.length > 0) {
        query = query.in('brand', filters.brands)
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price_cents', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price_cents', { ascending: false })
          break
        case 'rating':
          query = query.order('average_rating', { ascending: false })
          break
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'name_asc':
          query = query.order('name', { ascending: true })
          break
        case 'name_desc':
          query = query.order('name', { ascending: false })
          break
        case 'relevance':
        default:
          if (filters.q) {
            query = query.order('rank', { ascending: false })
          } else {
            query = query.order('created_at', { ascending: false })
          }
      }

      // Apply pagination
      const page = filters.page || 1
      const limit = Math.min(filters.limit || 20, 100)
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw new AppError(error.message, 'PRODUCTS_FETCH_FAILED', 500)
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      return {
        items: data || [],
        total,
        hasMore: page < totalPages,
        executionMs: 0, // Would need to measure this
        currentPage: page,
        totalPages,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch products', 'PRODUCTS_FETCH_FAILED', 500)
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string): Promise<ProductDetail> {
    try {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from('product_details')
        .select('*')
        .eq('id', id)
        .single()

      if (productError) {
        throw new NotFoundError('Product')
      }

      // Get product images
      const { data: images, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('sort_order', { ascending: true })

      if (imagesError) {
        throw new AppError(imagesError.message, 'PRODUCT_IMAGES_FETCH_FAILED', 500)
      }

      // Get category details
      let category = null
      if (product.category_id) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', product.category_id)
          .single()

        if (!categoryError) {
          category = categoryData
        }
      }

      return {
        ...product,
        images: images || [],
        category,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch product', 'PRODUCT_FETCH_FAILED', 500)
    }
  }

  /**
   * Get product by slug
   */
  static async getProductBySlug(slug: string): Promise<ProductDetail> {
    try {
      const { data: product, error: productError } = await supabase
        .from('product_details')
        .select('*')
        .eq('slug', slug)
        .single()

      if (productError) {
        throw new NotFoundError('Product')
      }

      return await this.getProductById(product.id)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch product', 'PRODUCT_FETCH_FAILED', 500)
    }
  }

  /**
   * Get all categories
   */
  static async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        throw new AppError(error.message, 'CATEGORIES_FETCH_FAILED', 500)
      }

      return data || []
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch categories', 'CATEGORIES_FETCH_FAILED', 500)
    }
  }

  /**
   * Create new product (admin only)
   */
  static async createProduct(productData: ProductFormData): Promise<Product> {
    // Validate product data
    const validation = validateProduct(productData)
    if (!validation.isValid) {
      throw new ValidationError('Product validation failed', validation.errors)
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          status: 'draft',
        })
        .select()
        .single()

      if (error) {
        throw new AppError(error.message, 'PRODUCT_CREATE_FAILED', 500)
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to create product', 'PRODUCT_CREATE_FAILED', 500)
    }
  }

  /**
   * Update product (admin only)
   */
  static async updateProduct(id: string, updates: Partial<ProductFormData>): Promise<Product> {
    // Validate product data
    const validation = validateProduct({ ...updates, id } as any)
    if (!validation.isValid) {
      throw new ValidationError('Product validation failed', validation.errors)
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new AppError(error.message, 'PRODUCT_UPDATE_FAILED', 500)
      }

      if (!data) {
        throw new NotFoundError('Product')
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to update product', 'PRODUCT_UPDATE_FAILED', 500)
    }
  }

  /**
   * Delete product (admin only)
   */
  static async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        throw new AppError(error.message, 'PRODUCT_DELETE_FAILED', 500)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to delete product', 'PRODUCT_DELETE_FAILED', 500)
    }
  }

  /**
   * Upload product image
   */
  static async uploadProductImage(
    productId: string,
    file: File,
    isPrimary: boolean = false
  ): Promise<ProductImage> {
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw new AppError(uploadError.message, 'IMAGE_UPLOAD_FAILED', 500)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      // Save to database
      const { data, error } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          url: publicUrl,
          alt_text: file.name,
          is_primary: isPrimary,
        })
        .select()
        .single()

      if (error) {
        throw new AppError(error.message, 'PRODUCT_IMAGE_SAVE_FAILED', 500)
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to upload product image', 'IMAGE_UPLOAD_FAILED', 500)
    }
  }

  /**
   * Update stock quantity
   */
  static async updateStock(
    productId: string,
    quantity: number,
    movementType: 'in' | 'out' | 'adjustment',
    reason?: string,
    referenceId?: string
  ): Promise<void> {
    try {
      // Get current stock
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single()

      if (fetchError) {
        throw new NotFoundError('Product')
      }

      const currentStock = product.stock_quantity
      let newStock = currentStock

      switch (movementType) {
        case 'in':
          newStock = currentStock + quantity
          break
        case 'out':
          newStock = currentStock - quantity
          if (newStock < 0) {
            throw new ValidationError('Insufficient stock')
          }
          break
        case 'adjustment':
          newStock = quantity
          break
      }

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', productId)

      if (updateError) {
        throw new AppError(updateError.message, 'STOCK_UPDATE_FAILED', 500)
      }

      // Record stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          movement_type: movementType,
          quantity: Math.abs(quantity),
          reference_type: 'adjustment',
          reference_id: referenceId,
          reason,
        })

      if (movementError) {
        throw new AppError(movementError.message, 'STOCK_MOVEMENT_RECORD_FAILED', 500)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to update stock', 'STOCK_UPDATE_FAILED', 500)
    }
  }

  /**
   * Get stock movements for a product
   */
  static async getStockMovements(productId: string): Promise<StockMovement[]> {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new AppError(error.message, 'STOCK_MOVEMENTS_FETCH_FAILED', 500)
      }

      return data || []
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch stock movements', 'STOCK_MOVEMENTS_FETCH_FAILED', 500)
    }
  }

  /**
   * Search products (alias for getProducts with search query)
   */
  static async searchProducts(query: string, limit: number = 20): Promise<Product[]> {
    const result = await this.getProducts({
      q: query,
      limit,
      sortBy: 'relevance',
    })
    return result.items
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('product_details')
        .select('*')
        .eq('status', 'active')
        .gt('stock_quantity', 0)
        .order('average_rating', { ascending: false })
        .limit(limit)

      if (error) {
        throw new AppError(error.message, 'FEATURED_PRODUCTS_FETCH_FAILED', 500)
      }

      return data || []
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch featured products', 'FEATURED_PRODUCTS_FETCH_FAILED', 500)
    }
  }

  /**
   * Get related products
   */
  static async getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    try {
      // First get the product's category
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('category_id')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        return []
      }

      if (!product.category_id) {
        return []
      }

      // Get products in the same category
      const { data, error } = await supabase
        .from('product_details')
        .select('*')
        .eq('category_id', product.category_id)
        .eq('status', 'active')
        .gt('stock_quantity', 0)
        .neq('id', productId)
        .order('average_rating', { ascending: false })
        .limit(limit)

      if (error) {
        throw new AppError(error.message, 'RELATED_PRODUCTS_FETCH_FAILED', 500)
      }

      return data || []
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch related products', 'RELATED_PRODUCTS_FETCH_FAILED', 500)
    }
  }
}

export default ProductService
