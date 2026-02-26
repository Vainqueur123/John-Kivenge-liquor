// Authentication service

import { supabase, getCurrentUser, getCurrentSession, getUserProfile, updateUserProfile } from './supabase'
import type { 
  User, 
  Profile, 
  LoginCredentials, 
  RegisterData, 
  PasswordResetRequest, 
  PasswordResetConfirm, 
  ProfileUpdateData 
} from '@/types/auth'
import { AppError, AuthenticationError, ValidationError } from '@/utils/errors'
import { validateEmail, validatePassword, validateName } from '@/utils/validation'

export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<{ user: User; profile: Profile }> {
    // Validate input
    const emailValidation = validateEmail(credentials.email)
    if (!emailValidation.isValid) {
      throw new ValidationError(emailValidation.error!)
    }

    const passwordValidation = validatePassword(credentials.password)
    if (!passwordValidation.isValid) {
      throw new ValidationError('Invalid password')
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        throw new AuthenticationError(error.message)
      }

      if (!data.user) {
        throw new AuthenticationError('Login failed')
      }

      // Get user profile
      const profile = await getUserProfile(data.user.id)
      if (!profile) {
        throw new AuthenticationError('User profile not found')
      }

      return { user: data.user, profile }
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
  static async register(data: RegisterData): Promise<{ user: User; profile: Profile }> {
    // Validate input
    const emailValidation = validateEmail(data.email)
    if (!emailValidation.isValid) {
      throw new ValidationError(emailValidation.error!)
    }

    const passwordValidation = validatePassword(data.password)
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.errors.join(', '))
    }

    const firstNameValidation = validateName(data.first_name, 'First name')
    if (!firstNameValidation.isValid) {
      throw new ValidationError(firstNameValidation.error!)
    }

    const lastNameValidation = validateName(data.last_name, 'Last name')
    if (!lastNameValidation.isValid) {
      throw new ValidationError(lastNameValidation.error!)
    }

    try {
      // Create user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
          },
        },
      })

      if (authError) {
        throw new AppError(authError.message, 'REGISTRATION_FAILED', 400)
      }

      if (!authData.user) {
        throw new AppError('Registration failed', 'REGISTRATION_FAILED', 500)
      }

      // Create profile (will be created by trigger, but let's ensure it exists)
      let profile = await getUserProfile(authData.user.id)
      if (!profile) {
        // Profile creation might be delayed, wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 1000))
        profile = await getUserProfile(authData.user.id)
        
        if (!profile) {
          throw new AppError('Profile creation failed', 'PROFILE_CREATION_FAILED', 500)
        }
      }

      return { user: authData.user, profile }
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
  static async logout(): Promise<void> {
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
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<{ user: User; profile: Profile } | null> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return null
      }

      const profile = await getUserProfile(user.id)
      if (!profile) {
        return null
      }

      return { user, profile }
    } catch (error) {
      return null
    }
  }

  /**
   * Get current session
   */
  static async getSession(): Promise<any> {
    return await getCurrentSession()
  }

  /**
   * Reset password request
   */
  static async resetPassword(request: PasswordResetRequest): Promise<void> {
    const emailValidation = validateEmail(request.email)
    if (!emailValidation.isValid) {
      throw new ValidationError(emailValidation.error!)
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
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
   * Confirm password reset
   */
  static async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    const passwordValidation = validatePassword(data.password)
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.errors.join(', '))
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        throw new AppError(error.message, 'PASSWORD_RESET_CONFIRM_FAILED', 500)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Password reset confirmation failed', 'PASSWORD_RESET_CONFIRM_FAILED', 500)
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: ProfileUpdateData): Promise<Profile> {
    // Validate input
    if (updates.first_name) {
      const validation = validateName(updates.first_name, 'First name')
      if (!validation.isValid) {
        throw new ValidationError(validation.error!)
      }
    }

    if (updates.last_name) {
      const validation = validateName(updates.last_name, 'Last name')
      if (!validation.isValid) {
        throw new ValidationError(validation.error!)
      }
    }

    try {
      const profile = await updateUserProfile(userId, updates)
      if (!profile) {
        throw new AppError('Profile update failed', 'PROFILE_UPDATE_FAILED', 500)
      }

      return profile
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Profile update failed', 'PROFILE_UPDATE_FAILED', 500)
    }
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const newPasswordValidation = validatePassword(newPassword)
    if (!newPasswordValidation.isValid) {
      throw new ValidationError(newPasswordValidation.errors.join(', '))
    }

    try {
      // First verify current password by trying to get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new AuthenticationError('User not authenticated')
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw new AppError(error.message, 'PASSWORD_CHANGE_FAILED', 500)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Password change failed', 'PASSWORD_CHANGE_FAILED', 500)
    }
  }

  /**
   * Update email
   */
  static async updateEmail(newEmail: string): Promise<void> {
    const emailValidation = validateEmail(newEmail)
    if (!emailValidation.isValid) {
      throw new ValidationError(emailValidation.error!)
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      })

      if (error) {
        throw new AppError(error.message, 'EMAIL_UPDATE_FAILED', 500)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Email update failed', 'EMAIL_UPDATE_FAILED', 500)
    }
  }

  /**
   * Sign in with OAuth provider
   */
  static async signInWithOAuth(provider: 'google' | 'facebook' | 'apple'): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw new AppError(error.message, 'OAUTH_SIGNIN_FAILED', 500)
      }
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
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export default AuthService
