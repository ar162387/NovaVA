/**
 * ChatInterface Component
 * 
 * MAIN CHAT COMPONENT:
 * - Primary interface for user interactions with NovaVA assistant
 * - Manages message display, input handling, and API communication
 * - Handles session creation and management for conversation continuity
 * - Integrates with Vapi Chat API through frontend API service layer
 * 
 * TECHNICAL FLOW:
 * 1. User types message and submits via form
 * 2. Creates user message and adds to session immediately (optimistic UI)
 * 3. Calls backend API (/api/conversation/text) which uses Vapi Chat API
 * 4. Receives GPT-4o generated response and updates conversation
 * 5. Maintains session continuity for threaded conversations
 */

import React, { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import ChatMessage from './ChatMessage'
import { apiService } from '@/services/api'
import { generateId, generateSessionTitle, devLog } from '@/utils'
import type { ConversationSession, ChatMessage as ChatMessageType } from '@/types'

interface ChatInterfaceProps {
  currentSession: ConversationSession | null
  onCreateSession: () => ConversationSession
  onUpdateSession: (updates: Partial<ConversationSession>) => void
  isConnected: boolean
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentSession,
  onCreateSession,
  onUpdateSession,
  isConnected,
}) => {
  // STATE MANAGEMENT
  const [inputMessage, setInputMessage] = useState('') // User's current input text
  const [isLoading, setIsLoading] = useState(false) // Loading state for API calls

  // REFS FOR DOM ACCESS
  const messagesEndRef = useRef<HTMLDivElement>(null) // For auto-scrolling to bottom
  const inputRef = useRef<HTMLTextAreaElement>(null) // For input focus management

  // AUTO-SCROLL EFFECT: Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages])

  // INPUT FOCUS EFFECT: Focus input when session changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentSession])

  /**
   * Scroll to the bottom of the messages
   * 
   * UX ENHANCEMENT:
   * - Ensures latest messages are always visible
   * - Smooth scrolling for better user experience
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  /**
   * Send a text message
   * 
   * API FLOW:
   * 1. Validates input and current state
   * 2. Creates or uses existing session for continuity
   * 3. Adds user message immediately (optimistic UI update)
   * 4. Calls API service -> backend -> Vapi Chat API -> GPT-4o
   * 5. Processes response and adds assistant message
   * 6. Handles errors gracefully with error messages
   * 
   * ENDPOINT CALLED: POST /api/conversation/text
   * BACKEND SERVICE: vapiService.generateTextResponse()
   * VAPI API: POST /chat (with GPT-4o model)
   * 
   * @param {string} message - User's message text to send
   */
  const sendTextMessage = async (message: string) => {
    // INPUT VALIDATION: Ensure message exists and not already loading
    if (!message.trim() || isLoading) return

    // SESSION MANAGEMENT: Get existing session or create new one
    const session = currentSession || onCreateSession()

    // USER MESSAGE CREATION: Create message object with metadata
    const userMessage: ChatMessageType = {
      id: generateId(), // Unique identifier for the message
      type: 'user', // Message type for styling and behavior
      content: message.trim(), // Clean message content
      timestamp: new Date().toISOString(), // ISO timestamp for consistency
      sessionId: session.id, // Link message to session
    }

    // OPTIMISTIC UI UPDATE: Add user message immediately for responsive feel
    onUpdateSession({
      messages: [...session.messages, userMessage],
      title: session.messages.length === 0 ? generateSessionTitle(message) : session.title,
    })

    // LOADING STATE: Set loading and clear input for UX
    setIsLoading(true)
    setInputMessage('')

    try {
      // API CALL: Send message to backend which communicates with Vapi Chat API
      // This triggers: Frontend -> Backend API -> Vapi Service -> Vapi Chat API -> GPT-4o
      const response = await apiService.sendTextMessage({
        message: message.trim(),
        sessionId: session.id, // For conversation continuity
      })

      devLog('Vapi chat response:', response)

      // ASSISTANT MESSAGE CREATION: Create response message from Vapi/GPT-4o
      const assistantMessage: ChatMessageType = {
        id: response.chatId || generateId(), // Use Vapi chat ID if available for threading
        type: 'assistant', // Assistant message type
        content: response.response, // GPT-4o generated response text
        timestamp: response.timestamp, // Timestamp from API response
        sessionId: response.sessionId, // Session ID from API (may be different if new)
      }

      // SESSION UPDATE: Add assistant message to conversation
      // Note: userMessage is already added above, so we only add the assistant message
              onUpdateSession({
          messages: [...session.messages, userMessage, assistantMessage],
        })

      // SESSION CONTINUITY: Store Vapi chat ID for future threading
      if (response.chatId) {
        devLog('Chat session continued with Vapi chatId:', response.chatId)
      }

    } catch (error) {
      console.error('Failed to send message to Vapi:', error)

      // ERROR HANDLING: Create error message for user feedback
      const errorMessage: ChatMessageType = {
        id: generateId(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date().toISOString(),
        sessionId: session.id,
      }

      // ERROR UI UPDATE: Replace loading state with error message
      onUpdateSession({
        messages: [...session.messages, userMessage, errorMessage],
      })
    } finally {
      // CLEANUP: Always clear loading state
      setIsLoading(false)
    }
  }



  /**
   * Handle input submission
   * 
   * FORM HANDLING:
   * - Prevents default form submission behavior
   * - Triggers text message sending process
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendTextMessage(inputMessage)
  }

  /**
   * Handle input key press
   * 
   * KEYBOARD SHORTCUTS:
   * - Enter: Send message (without Shift)
   * - Shift+Enter: New line in textarea
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendTextMessage(inputMessage)
    }
  }

  /**
   * Welcome screen when no session exists
   * 
   * EMPTY STATE UI:
   * - Displays welcome message and branding
   * - Provides session creation button
   * - Shows connection status for backend availability
   */
  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          {/* BRANDING SECTION */}
          <div className="inline-flex items-center gap-3 mb-6">
            <MessageSquare className="w-12 h-12 text-primary-500" />
            <h2 className="text-3xl font-bold gradient-text">Welcome to NovaVA</h2>
          </div>
          
          {/* WELCOME MESSAGE */}
          <p className="text-secondary-600 mb-8 leading-relaxed">
            Your AI-powered virtual assistant is ready to help! Start a conversation below.
          </p>
          
          {/* SESSION CREATION BUTTON */}
          <div className="flex justify-center">
            <button
              onClick={() => onCreateSession()}
              className="btn-primary flex items-center gap-2"
              disabled={!isConnected || isLoading}
            >
              <MessageSquare className="w-5 h-5" />
              Start Chat
            </button>
          </div>
          
          {/* CONNECTION STATUS WARNING */}
          {!isConnected && (
            <p className="text-error-500 text-sm mt-4">
              Backend connection required to start conversations
            </p>
          )}
        </div>
      </div>
    )
  }

  /**
   * Chat interface
   * 
   * MAIN CHAT UI:
   * - Messages display area with scrolling
   * - Loading indicator during API calls
   * - Input form with send button
   * - Character counter and keyboard shortcuts info
   */
  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">

      {/* MESSAGES DISPLAY AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* MESSAGE LIST: Render all messages in current session */}
        {currentSession.messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
          />
        ))}
        
        {/* LOADING INDICATOR: Show during API calls to Vapi */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="chat-bubble-assistant">
              {/* ANIMATED DOTS: Visual feedback for processing */}
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot" style={{ animationDelay: '0.1s' }}></div>
                <div className="loading-dot" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* SCROLL ANCHOR: Reference point for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="border-t border-secondary-200 bg-white/80 backdrop-blur-sm p-4">
        {/* MESSAGE INPUT FORM */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          {/* TEXT INPUT AREA */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={!isConnected || isLoading} // Disable during loading or when disconnected
              className="input-field resize-none min-h-[44px] max-h-32"
              rows={1}
            />
          </div>
          
          {/* SEND BUTTON */}
          <button
            type="submit"
            disabled={!inputMessage.trim() || !isConnected || isLoading}
            className="btn-primary flex items-center justify-center min-w-[44px] h-[44px]"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        
        {/* INPUT HELPERS: Keyboard shortcuts and character count */}
        <div className="flex items-center justify-between mt-2 text-xs text-secondary-500">
          <span>Press Enter to send, Shift + Enter for new line</span>
          <span>
            {inputMessage.length > 0 && `${inputMessage.length} characters`}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface 