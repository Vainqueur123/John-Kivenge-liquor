// Conversation status
export type ConversationStatus = 'active' | 'resolved' | 'archived'

// Message types
export type MessageType = 'text' | 'image' | 'file' | 'system'

// Conversation interface
export interface Conversation {
  id: string
  customer_id: string
  admin_id?: string
  order_id?: string
  status: ConversationStatus
  subject?: string
  last_message_at?: string
  created_at: string
  updated_at: string
  // Joined fields
  customer_name?: string
  admin_name?: string
  order_number?: string
  unread_count?: number
  last_message_preview?: string
}

// Message interface
export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  attachment_urls: string[]
  is_read: boolean
  read_at?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  // Joined fields
  sender_name?: string
  sender_role?: 'customer' | 'staff' | 'admin'
  sender_avatar?: string
}

// Create conversation request
export interface CreateConversationRequest {
  order_id?: string
  subject?: string
  initial_message?: string
}

// Send message request
export interface SendMessageRequest {
  conversation_id: string
  content: string
  attachments?: File[]
}

// Chat presence
export interface ChatPresence {
  user_id: string
  conversation_id: string
  is_online: boolean
  last_seen: string
  is_typing: boolean
}

// Typing indicator
export interface TypingIndicator {
  conversation_id: string
  user_id: string
  is_typing: boolean
  timestamp: string
}

// Chat notification
export interface ChatNotification {
  id: string
  type: 'new_message' | 'conversation_assigned' | 'conversation_status_changed'
  conversation_id: string
  user_id: string
  data: Record<string, any>
  created_at: string
  read_at?: string
}

// Chat statistics
export interface ChatStatistics {
  total_conversations: number
  active_conversations: number
  average_response_time: number
  customer_satisfaction_score: number
  conversations_by_status: Record<ConversationStatus, number>
  messages_by_period: Array<{
    period: string
    messages: number
    conversations: number
  }>
  top_agents: Array<{
    agent_id: string
    agent_name: string
    conversations_handled: number
    average_response_time: number
    satisfaction_score: number
  }>
}

// Chat settings
export interface ChatSettings {
  business_hours: {
    monday: { open: string; close: string }
    tuesday: { open: string; close: string }
    wednesday: { open: string; close: string }
    thursday: { open: string; close: string }
    friday: { open: string; close: string }
    saturday: { open: string; close: string }
    sunday: { open: string; close: string }
  }
  auto_response_enabled: boolean
  auto_response_message: string
  max_file_size_mb: number
  allowed_file_types: string[]
  agent_assignment_rules: {
    round_robin: boolean
    assign_by_order: boolean
    assign_by_customer: boolean
  }
}

// Chat filters for admin
export interface ChatFilters {
  status?: ConversationStatus[]
  customer_id?: string
  admin_id?: string
  order_id?: string
  date_from?: string
  date_to?: string
  has_unread_messages?: boolean
  search?: string // Search by subject or customer name
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'last_message_at' | 'customer_name'
  sort_order?: 'asc' | 'desc'
}

// Real-time chat events
export type ChatEvent = 
  | 'message_sent'
  | 'message_read'
  | 'conversation_created'
  | 'conversation_updated'
  | 'user_typing'
  | 'user_online'
  | 'user_offline'
  | 'agent_assigned'

// Chat event payload
export interface ChatEventPayload {
  type: ChatEvent
  conversation_id: string
  user_id: string
  data: Record<string, any>
  timestamp: string
}
