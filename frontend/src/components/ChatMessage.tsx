/**
 * ChatMessage Component
 * 
 * INDIVIDUAL MESSAGE COMPONENT:
 * - Renders individual chat messages with different styles for user/assistant/system
 * - Implements Text-to-Speech (TTS) functionality for assistant messages
 * - Provides message actions like copy and audio playback
 * - Manages TTS state and audio playback through centralized TTS manager
 * 
 * TTS INTEGRATION FLOW:
 * 1. User clicks audio button on assistant message
 * 2. Calls backend API (/api/conversation/tts) for TTS configuration
 * 3. Backend returns enhanced browser TTS settings (currently) or future audio URLs
 * 4. Plays audio using TTS manager with enhanced voice settings
 * 5. Manages playback state with loading and playing indicators
 * 
 * TECHNICAL FEATURES:
 * - Copy to clipboard functionality
 * - Enhanced browser TTS with optimized voice settings
 * - Smooth state management for audio playback
 * - Responsive UI with hover actions and loading states
 */

import React, { useState, useEffect, useRef } from 'react'
import { User, Bot, Info, Copy, Volume2, Square, Loader2 } from 'lucide-react'
import { formatTimestamp, copyToClipboard, getTTSManager } from '@/utils'
import { apiService } from '@/services/api'
import type { MessageProps } from '@/types'

const ChatMessage: React.FC<MessageProps> = ({ message }) => {
  // TTS STATE MANAGEMENT
  const [isLoadingTTS, setIsLoadingTTS] = useState(false) // Loading state for TTS API calls
  const [isPlayingTTS, setIsPlayingTTS] = useState(false) // Playing state for active audio
  
  // TTS MANAGER AND MESSAGE TRACKING
  const ttsManager = getTTSManager() // Centralized TTS manager for audio playback
  const messageIdRef = useRef(message.id) // Stable reference to message ID for callbacks

  // TTS PLAYBACK END HANDLER: Set up callback for when audio ends to sync state
  useEffect(() => {
    // Create a callback specific to this message
    const handlePlaybackEnd = () => {
      console.log('🔄 Audio playback ended, updating state for message:', messageIdRef.current)
      setIsPlayingTTS(false)
    }

    // Set the callback when this component has playing audio
    if (isPlayingTTS) {
      ttsManager.setOnPlaybackEnd(handlePlaybackEnd)
    }

    // Cleanup: only clear callback if this component set it
    return () => {
      if (isPlayingTTS) {
        ttsManager.setOnPlaybackEnd(null)
      }
    }
  }, [isPlayingTTS, ttsManager])

  /**
   * Copy message content to clipboard
   * 
   * UTILITY FUNCTION:
   * - Uses utility function for cross-browser clipboard access
   * - Provides user feedback through console (TODO: add toast notifications)
   */
  const handleCopy = async () => {
    const success = await copyToClipboard(message.content)
    if (success) {
      // TODO: Show success notification
      console.log('Message copied to clipboard')
    }
  }

  /**
   * Handle TTS playback for assistant messages using Vapi + Enhanced Browser TTS
   * 
   * TTS API FLOW:
   * 1. Validates message type (only assistant messages have TTS)
   * 2. Toggles playback if already playing (stop functionality)
   * 3. Calls backend API (/api/conversation/tts) for TTS configuration
   * 4. Backend calls vapiService.getTTSConfig() for enhanced settings
   * 5. Receives optimized browser TTS configuration with voice preferences
   * 6. Plays audio through TTS manager with enhanced voice settings
   * 7. Manages state transitions and error handling
   * 
   * ENDPOINT CALLED: POST /api/conversation/tts
   * BACKEND SERVICE: vapiService.getTTSConfig()
   * TTS METHOD: Enhanced browser TTS with optimized voice settings
   * 
   * CURRENT TTS IMPLEMENTATION:
   * - Uses enhanced browser TTS with optimized settings
   * - Prefers high-quality voices (Google US English, Microsoft voices)
   * - Slower speech rate (0.85) for natural delivery
   * - SSML support for better prosody when available
   * - Future: Will integrate with Vapi's TTS infrastructure for premium voices
   */
  const handlePlayTTS = async () => {
    // MESSAGE TYPE VALIDATION: Only assistant messages support TTS
    if (message.type !== 'assistant') return

    try {
      if (isPlayingTTS) {
        // STOP CURRENT AUDIO: Toggle functionality for active playback
        console.log('🛑 Stopping TTS playback for message:', message.id)
        ttsManager.stop()
        setIsPlayingTTS(false)
        return
      }

      console.log('▶️ Starting TTS playback for message:', message.id)
      setIsLoadingTTS(true)
      
      console.log('🎤 Requesting Vapi TTS for:', message.content.substring(0, 50) + '...')

      // API CALL: Get TTS configuration from backend
      // This calls: Frontend -> Backend API -> vapiService.getTTSConfig()
      // Currently returns enhanced browser TTS config, future: audio URLs from Vapi
      const ttsData = await apiService.getTTSConfig(message.content, {
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice (natural, professional)
        stability: 0.5, // Voice stability setting
        similarityBoost: 0.8, // Voice similarity enhancement
        style: 0.0, // Voice style adjustment
        useSpeakerBoost: true // Speaker boost for clarity
      })

      console.log('🎵 Vapi TTS response received:', {
        hasAudioUrl: !!ttsData.audioUrl,
        method: ttsData.method,
        voiceProvider: ttsData.voiceProvider
      })

      // STATE TRANSITION: Move from loading to playing
      setIsLoadingTTS(false)
      console.log('🎮 Setting isPlayingTTS to true for message:', message.id)
      setIsPlayingTTS(true)

      // AUDIO PLAYBACK: Play using enhanced audio player
      // Supports both direct audio URLs and enhanced browser TTS
      await ttsManager.playAudioUrl(ttsData.audioUrl, ttsData)

      console.log('🎵 Vapi TTS playback completed successfully for message:', message.id)
      // State will be updated by the onPlaybackEnd callback

    } catch (error) {
      console.error('🔴 Vapi TTS Error for message:', message.id, error)
      
      // ERROR STATE CLEANUP
      setIsLoadingTTS(false)
      setIsPlayingTTS(false)
      
      // GRACEFUL ERROR HANDLING: Don't show error for user-initiated stops
      if (error instanceof Error && error.message.includes('interrupted')) {
        console.log('🛑 TTS was stopped by user for message:', message.id)
        return
      }
      
      // TODO: Show error notification to user for actual errors
    }
  }

  /**
   * Get message styles based on type
   * 
   * STYLING LOGIC:
   * - User messages: Right-aligned, primary color, user icon
   * - Assistant messages: Left-aligned, secondary color, bot icon
   * - System messages: Center-aligned, muted style, info icon
   * 
   * @returns {object} Styling configuration for the message type
   */
  const getMessageStyles = () => {
    switch (message.type) {
      case 'user':
        return {
          container: 'flex justify-end', // Right alignment for user messages
          bubble: 'chat-bubble-user', // Primary styling for user
          icon: <User className="w-4 h-4" />,
          iconBg: 'bg-primary-500 text-white',
        }
      case 'assistant':
        return {
          container: 'flex justify-start', // Left alignment for assistant
          bubble: 'chat-bubble-assistant', // Secondary styling for assistant
          icon: <Bot className="w-4 h-4" />,
          iconBg: 'bg-secondary-100 text-secondary-700',
        }
      case 'system':
        return {
          container: 'flex justify-center', // Center alignment for system messages
          bubble: 'bg-secondary-100 text-secondary-600 rounded-lg px-3 py-2 text-sm max-w-xs',
          icon: <Info className="w-4 h-4" />,
          iconBg: 'bg-secondary-200 text-secondary-600',
        }
      default:
        return {
          container: 'flex justify-start',
          bubble: 'chat-bubble-assistant',
          icon: <Bot className="w-4 h-4" />,
          iconBg: 'bg-secondary-100 text-secondary-700',
        }
    }
  }

  const styles = getMessageStyles()

  // DEBUG LOGGING: Track button state for development and interview demonstration
  console.log(`🔍 ChatMessage ${message.id} render:`, {
    isLoadingTTS,
    isPlayingTTS,
    messageType: message.type,
    content: message.content.substring(0, 30) + '...'
  })

  /**
   * System message (simpler layout)
   * 
   * SYSTEM MESSAGE UI:
   * - Simple centered layout with icon and text
   * - Used for status updates and system notifications
   * - No action buttons (copy, TTS) for system messages
   */
  if (message.type === 'system') {
    return (
      <div className={styles.container}>
        <div className="flex items-center gap-2">
          {/* SYSTEM MESSAGE ICON */}
          <div className={`p-1 rounded-full ${styles.iconBg}`}>
            {styles.icon}
          </div>
          {/* SYSTEM MESSAGE CONTENT */}
          <div className={styles.bubble}>
            {message.content}
          </div>
        </div>
      </div>
    )
  }

  /**
   * User/Assistant message (full layout)
   * 
   * FULL MESSAGE UI:
   * - Avatar with appropriate icon (user/assistant)
   * - Message bubble with content
   * - Action buttons on hover (copy, TTS for assistant)
   * - Timestamp and metadata display
   * - Responsive layout with proper spacing
   */
  return (
    <div className={`${styles.container} group animate-fade-in`}>
      <div className="flex items-start gap-3 max-w-3xl">
        {/* AVATAR: Show for assistant messages on left side */}
        {message.type === 'assistant' && (
          <div className={`p-2 rounded-full ${styles.iconBg} flex-shrink-0 mt-1`}>
            {styles.icon}
          </div>
        )}

        {/* MESSAGE CONTENT CONTAINER */}
        <div className="flex flex-col gap-1">
          {/* MESSAGE BUBBLE: Main content area */}
          <div className={styles.bubble}>
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </div>

          {/* MESSAGE ACTIONS: Timestamp and action buttons (visible on hover) */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* TIMESTAMP: Formatted message time */}
            <span className="text-xs text-secondary-400">
              {formatTimestamp(message.timestamp)}
            </span>

            {/* ACTION BUTTONS CONTAINER */}
            <div className="flex items-center gap-1">
              {/* COPY BUTTON: Available for all message types */}
              <button
                onClick={handleCopy}
                className="p-1 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded transition-colors"
                title="Copy message"
              >
                <Copy className="w-3 h-3" />
              </button>

              {/* TTS BUTTON: Only for assistant messages */}
              {message.type === 'assistant' && (
                <button
                  onClick={handlePlayTTS}
                  disabled={isLoadingTTS} // Disable during API calls
                  className="p-1 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded transition-colors disabled:opacity-50"
                  title={isPlayingTTS ? "Stop audio" : "Play audio"}
                >
                  {/* DYNAMIC ICON: Shows loading, playing, or play state */}
                  {isLoadingTTS ? (
                    <Loader2 className="w-3 h-3 animate-spin" /> // Loading spinner during TTS API call
                  ) : isPlayingTTS ? (
                    <Square className="w-3 h-3" /> // Stop icon during playback
                  ) : (
                    <Volume2 className="w-3 h-3" /> // Play icon for ready state
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* AVATAR: Show for user messages on right side */}
        {message.type === 'user' && (
          <div className={`p-2 rounded-full ${styles.iconBg} flex-shrink-0 mt-1`}>
            {styles.icon}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessage 