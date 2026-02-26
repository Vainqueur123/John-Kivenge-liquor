// Chat service

import { supabase } from './supabase'
import type { 
  Conversation,
  Message,
  CreateConversationRequest,
  SendMessageRequest,
  ChatFilters,
  ChatPresence,
  TypingIndicator
} from '@/types/chat'
import { AppError, NotFoundError, ValidationError } from '@/utils/errors'

export class ChatService {
  /**
   * Get user conversations
   */
  static async getUserConversations(
    userId: string,
    filters: ChatFilters = {}
  ): Promise<{ items: Conversation[]; total: number }> {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          customer:profiles!conversations_customer_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          admin:profiles!conversations_admin_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          orders:orders (
            id,
            order_number
          )
        `, { count: 'exact' })
        .or(`customer_id.eq.${userId},admin_id.eq.${userId}`)

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      if (filters.search) {
        query = query.or(`subject.ilike.%${filters.search}%,customer.first_name.ilike.%${filters.search}%,customer.last_name.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'last_message_at'
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
        throw new AppError(error.message, 'CONVERSATIONS_FETCH_FAILED', 500)
      }

      // Transform data to include derived fields
      const conversations = data?.map(conv => ({
        ...conv,
        customer_name: conv.customer ? `${conv.customer.first_name} ${conv.customer.last_name}` : null,
        admin_name: conv.admin ? `${conv.admin.first_name} ${conv.admin.last_name}` : null,
        order_number: conv.orders?.order_number,
      })) || []

      return {
        items: conversations,
        total: count || 0,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch conversations', 'CONVERSATIONS_FETCH_FAILED', 500)
    }
  }

  /**
   * Get conversation by ID
   */
  static async getConversationById(id: string): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          customer:profiles!conversations_customer_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          admin:profiles!conversations_admin_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          orders:orders (
            id,
            order_number
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        throw new NotFoundError('Conversation')
      }

      return {
        ...data,
        customer_name: data.customer ? `${data.customer.first_name} ${data.customer.last_name}` : null,
        admin_name: data.admin ? `${data.admin.first_name} ${data.admin.last_name}` : null,
        order_number: data.orders?.order_number,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch conversation', 'CONVERSATION_FETCH_FAILED', 500)
    }
  }

  /**
   * Create new conversation
   */
  static async createConversation(
    userId: string,
    request: CreateConversationRequest
  ): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          customer_id: userId,
          order_id: request.order_id,
          subject: request.subject,
          status: 'active',
        })
        .select()
        .single()

      if (error) {
        throw new AppError(error.message, 'CONVERSATION_CREATE_FAILED', 500)
      }

      // Send initial message if provided
      if (request.initial_message) {
        await this.sendMessage(userId, {
          conversation_id: data.id,
          content: request.initial_message,
        })
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to create conversation', 'CONVERSATION_CREATE_FAILED', 500)
    }
  }

  /**
   * Get conversation messages
   */
  static async getConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ items: Message[]; hasMore: boolean }> {
    try {
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url,
            role
          )
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', 'null')
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        throw new AppError(error.message, 'MESSAGES_FETCH_FAILED', 500)
      }

      // Transform data to include sender info
      const messages = data?.map(msg => ({
        ...msg,
        sender_name: msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : null,
        sender_role: msg.sender?.role,
        sender_avatar: msg.sender?.avatar_url,
      })) || []

      return {
        items: messages,
        hasMore: data?.length === limit,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch messages', 'MESSAGES_FETCH_FAILED', 500)
    }
  }

  /**
   * Send message
   */
  static async sendMessage(
    userId: string,
    request: SendMessageRequest
  ): Promise<Message> {
    // Validate message content
    if (!request.content || request.content.trim().length === 0) {
      throw new ValidationError('Message content is required')
    }

    if (request.content.length > 1000) {
      throw new ValidationError('Message content must be less than 1000 characters')
    }

    try {
      // Check if user is participant in conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('customer_id, admin_id')
        .eq('id', request.conversation_id)
        .single()

      if (convError || !conversation) {
        throw new NotFoundError('Conversation')
      }

      const isParticipant = conversation.customer_id === userId || conversation.admin_id === userId
      if (!isParticipant) {
        throw new ValidationError('User is not a participant in this conversation')
      }

      // Create message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: request.conversation_id,
          sender_id: userId,
          content: request.content.trim(),
          attachment_urls: request.attachments ? [] : [], // Would handle file uploads
        })
        .select()
        .single()

      if (error) {
        throw new AppError(error.message, 'MESSAGE_SEND_FAILED', 500)
      }

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.conversation_id)

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to send message', 'MESSAGE_SEND_FAILED', 500)
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(
    userId: string,
    conversationId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId)
        .eq('sender_id', userId)
        .is('is_read', false)

      if (error) {
        throw new AppError(error.message, 'MESSAGES_MARK_READ_FAILED', 500)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to mark messages as read', 'MESSAGES_MARK_READ_FAILED', 500)
    }
  }

  /**
   * Update conversation status
   */
  static async updateConversationStatus(
    conversationId: string,
    status: 'active' | 'resolved' | 'archived'
  ): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .select()
        .single()

      if (error) {
        throw new AppError(error.message, 'CONVERSATION_UPDATE_FAILED', 500)
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to update conversation', 'CONVERSATION_UPDATE_FAILED', 500)
    }
  }

  /**
   * Assign admin to conversation
   */
  static async assignAdminToConversation(
    conversationId: string,
    adminId: string
  ): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update({
          admin_id: adminId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .select()
        .single()

      if (error) {
        throw new AppError(error.message, 'CONVERSATION_ASSIGN_FAILED', 500)
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to assign admin to conversation', 'CONVERSATION_ASSIGN_FAILED', 500)
    }
  }

  /**
   * Get unread message count
   */
  static async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .is('is_read', false)

      if (error) {
        throw new AppError(error.message, 'UNREAD_COUNT_FETCH_FAILED', 500)
      }

      return data?.length || 0
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch unread message count', 'UNREAD_COUNT_FETCH_FAILED', 500)
    }
  }

  /**
   * Subscribe to conversation messages
   */
  static subscribeToConversationMessages(
    conversationId: string,
    callback: (message: Message) => void
  ) {
    return supabase
      .channel(`conversation-${conversationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        (payload) => {
          callback(payload.new as Message)
        }
      )
      .subscribe()
  }

  /**
   * Subscribe to user conversations
   */
  static subscribeToUserConversations(
    userId: string,
    callback: (conversation: Conversation) => void
  ) {
    return supabase
      .channel(`user-conversations-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `customer_id=eq.${userId}`
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback(payload.new as Conversation)
          }
        }
      )
      .subscribe()
  }

  /**
   * Set typing indicator
   */
  static async setTypingIndicator(
    userId: string,
    conversationId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      // This would typically be handled via real-time channels
      // For now, we could store it in a temporary table or Redis
      // For demo purposes, we'll just log it
      console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'} in conversation ${conversationId}`)
    } catch (error) {
      throw new AppError('Failed to set typing indicator', 'TYPING_INDICATOR_FAILED', 500)
    }
  }

  /**
   * Get typing users in conversation
   */
  static async getTypingUsers(conversationId: string): Promise<string[]> {
    try {
      // This would typically fetch from a real-time store
      // For demo purposes, return empty array
      return []
    } catch (error) {
      throw new AppError('Failed to get typing users', 'TYPING_USERS_FETCH_FAILED', 500)
    }
  }

  /**
   * Delete message
   */
  static async deleteMessage(
    userId: string,
    messageId: string
  ): Promise<void> {
    try {
      // Check if user owns the message
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id, conversation_id')
        .eq('id', messageId)
        .single()

      if (fetchError || !message) {
        throw new NotFoundError('Message')
      }

      if (message.sender_id !== userId) {
        throw new ValidationError('User can only delete their own messages')
      }

      // Soft delete message
      const { error } = await supabase
        .from('messages')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)

      if (error) {
        throw new AppError(error.message, 'MESSAGE_DELETE_FAILED', 500)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to delete message', 'MESSAGE_DELETE_FAILED', 500)
    }
  }

  /**
   * Get all conversations (admin)
   */
  static async getAllConversations(
    filters: ChatFilters = {}
  ): Promise<{ items: Conversation[]; total: number }> {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          customer:profiles!conversations_customer_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          admin:profiles!conversations_admin_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          orders:orders (
            id,
            order_number
          )
        `, { count: 'exact' })

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.admin_id) {
        query = query.eq('admin_id', filters.admin_id)
      }

      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
      }

      if (filters.order_id) {
        query = query.eq('order_id', filters.order_id)
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      if (filters.search) {
        query = query.or(`subject.ilike.%${filters.search}%,customer.first_name.ilike.%${filters.search}%,customer.last_name.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'last_message_at'
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
        throw new AppError(error.message, 'CONVERSATIONS_FETCH_FAILED', 500)
      }

      // Transform data to include derived fields
      const conversations = data?.map(conv => ({
        ...conv,
        customer_name: conv.customer ? `${conv.customer.first_name} ${conv.customer.last_name}` : null,
        admin_name: conv.admin ? `${conv.admin.first_name} ${conv.admin.last_name}` : null,
        order_number: conv.orders?.order_number,
      })) || []

      return {
        items: conversations,
        total: count || 0,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to fetch conversations', 'CONVERSATIONS_FETCH_FAILED', 500)
    }
  }
}

export default ChatService
