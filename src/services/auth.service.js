// Authentication service

import { supabase, getCurrentUser, getUserProfile, updateUserProfile } from './supabase.js'
import { AppError, AuthenticationError, ValidationError } from '../utils/errors.js'
import { validateEmail, validatePassword, validateName } from '../utils/validation.js'

export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(credentials) {
    const { email, password } = credentials
    
    // Validate input
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      throw new ValidationError(emailValidation.error)
    }
    
    if (!password) {
      throw new ValidationError('Password is required')
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new AuthenticationError(error.message)
      }

      // Get user profile
      const profile = await getUserProfile(data.user.id)
      
      return {
        user: data.user,
        profile,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Login failed', 'LOGIN_FAILED', 500)
    }
  }

  /**
   * Register new user
   */
  static async register(userData) {
    const { email, password, firstName, lastName, phone } = userData
    
    // Validate input
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      throw new ValidationError(emailValidation.error)
    }
    
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.error)
    }
    
    const firstNameValidation = validateName(firstName, 'First name')
    if (!firstNameValidation.isValid) {
      throw new ValidationError(firstNameValidation.error)
    }
    
    const lastNameValidation = validateName(lastName, 'Last name')
    if (!lastNameValidation.isValid) {
      throw new ValidationError(lastNameValidation.error)
    }

    try {
      // Create user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
          },
        },
      })

      if (error) {
        throw new AuthenticationError(error.message)
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Registration failed', 'REGISTRATION_FAILED', 500)
    }
  }

  /**
   * Logout user
   */
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new AppError(error.message, 'LOGOUT_FAILED', 500)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Logout failed', 'LOGOUT_FAILED', 500)
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email) {
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      throw new ValidationError(emailValidation.error)
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw new AppError(error.message, 'PASSWORD_RESET_FAILED', 500)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Password reset failed', 'PASSWORD_RESET_FAILED', 500)
    }
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword) {
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.error)
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw new AppError(error.message, 'PASSWORD_UPDATE_FAILED', 500)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Password update failed', 'PASSWORD_UPDATE_FAILED', 500)
    }
  }

  /**
   * Get current user with profile
   */
  static async getCurrentUser() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return null
      }

      const profile = await getUserProfile(user.id)
      return {
        user,
        profile,
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updates) {
    try {
      return await updateUserProfile(userId, updates)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Profile update failed', 'PROFILE_UPDATE_FAILED', 500)
    }
  }

  /**
   * Sign in with OAuth provider
   */
  static async signInWithOAuth(provider, options = {}) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          ...options,
        },
      })

      if (error) {
        throw new AuthenticationError(error.message)
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('OAuth sign in failed', 'OAUTH_SIGNIN_FAILED', 500)
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export default AuthService
