import { User } from '@supabase/supabase-js'

// User roles
export type UserRole = 'customer' | 'staff' | 'admin'

// Profile interface extending Supabase User
export interface Profile {
  id: string
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  role: UserRole
  is_active: boolean
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

// Auth state
export interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Login credentials
export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

// Registration data
export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}

// Password reset request
export interface PasswordResetRequest {
  email: string
}

// Password reset confirmation
export interface PasswordResetConfirm {
  token: string
  password: string
}

// Profile update data
export interface ProfileUpdateData {
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  preferences?: Record<string, any>
}

// Address interface
export interface Address {
  id: string
  user_id: string
  type: 'shipping' | 'billing'
  is_default: boolean
  street_address: string
  city: string
  postal_code?: string
  country: string
  created_at: string
  updated_at: string
}

// Address form data
export interface AddressFormData {
  type: 'shipping' | 'billing'
  is_default: boolean
  street_address: string
  city: string
  postal_code?: string
  country: string
}

// JWT Claims (for reference)
export interface JWTClaims {
  sub: string
  email: string
  email_verified: boolean
  role: string
  app_metadata: {
    provider: string
    providers: string[]
  }
  user_metadata: {
    preferred_name?: string
  }
  iss: string
  aud: string
  iat: number
  exp: number
  nbf: number
}
