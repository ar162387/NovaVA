import { v4 as uuidv4 } from 'uuid'
import { clsx, type ClassValue } from 'clsx'

/**
 * Utility function to merge and conditionally include class names
 * @param inputs - Class names and conditional expressions
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Generate a unique ID
 * @returns UUID v4 string
 */
export function generateId(): string {
  return uuidv4()
}

/**
 * Format timestamp to readable format
 * @param timestamp - Date object or ISO string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatTimestamp(
  timestamp: Date | string,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return new Intl.DateTimeFormat('en-US', options).format(date)
}

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 * @param timestamp - Date object or ISO string
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second')
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute')
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour')
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return rtf.format(-diffInDays, 'day')
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return rtf.format(-diffInWeeks, 'week')
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return rtf.format(-diffInMonths, 'month')
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return rtf.format(-diffInYears, 'year')
}

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Debounce function to limit function calls
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Throttle function to limit function calls to once per interval
 * @param func - Function to throttle
 * @param interval - Interval in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCallTime >= interval) {
      lastCallTime = now
      func(...args)
    }
  }
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise<boolean> - Success status
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const success = document.execCommand('copy')
      textArea.remove()
      return success
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Format file size in human readable format
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns Boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format (basic validation)
 * @param phone - Phone string to validate
 * @returns True if phone appears valid
 */
export function isValidPhone(phone: string): boolean {
  // Basic phone validation - adjust regex as needed for your requirements
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Sleep/delay function
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate session title from first message
 * @param message - First message in conversation
 * @param maxLength - Maximum title length
 * @returns Generated title
 */
export function generateSessionTitle(message: string, maxLength: number = 30): string {
  // Remove extra whitespace and newlines
  const cleaned = message.trim().replace(/\s+/g, ' ')
  
  // If message is short enough, use it as is
  if (cleaned.length <= maxLength) {
    return cleaned
  }
  
  // Try to break at word boundary
  const truncated = cleaned.slice(0, maxLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')
  
  if (lastSpaceIndex > maxLength * 0.7) {
    return truncated.slice(0, lastSpaceIndex) + '...'
  }
  
  return truncated + '...'
}

/**
 * Debug logging utility - only logs in development
 * @param message - Log message
 * @param data - Optional data to log
 */
export function devLog(message: string, data?: any): void {
  if (import.meta.env.VITE_DEBUG === 'true' && import.meta.env.VITE_NODE_ENV === 'development') {
    if (data) {
      console.log(`🔧 NovaVA Debug: ${message}`, data)
    } else {
      console.log(`🔧 NovaVA Debug: ${message}`)
    }
  }
}

/**
 * Format duration in seconds to human readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  if (minutes === 0) {
    return `${remainingSeconds}s`
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Check if the current environment is development
 * @returns True if in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.VITE_NODE_ENV === 'development'
}

/**
 * Check if the current environment is production
 * @returns True if in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.VITE_NODE_ENV === 'production'
}

/**
 * Get environment variable with fallback
 * @param key - Environment variable key
 * @param fallback - Fallback value
 * @returns Environment variable value or fallback
 */
export function getEnvVar(key: string, fallback: string = ''): string {
  return import.meta.env[key] ?? fallback
}

/**
 * Audio Player Manager for Vapi TTS
 * Handles realistic speech playback using Vapi + ElevenLabs
 */
export class AudioPlayerManager {
  private static instance: AudioPlayerManager | null = null
  private currentAudio: HTMLAudioElement | null = null
  private onPlaybackEnd: (() => void) | null = null
  private isIntentionallyStopped: boolean = false

  private constructor() {
    // Singleton pattern to ensure only one audio instance
  }

  public static getInstance(): AudioPlayerManager {
    if (!AudioPlayerManager.instance) {
      AudioPlayerManager.instance = new AudioPlayerManager()
    }
    return AudioPlayerManager.instance
  }

  /**
   * Set callback for when playback ends
   */
  public setOnPlaybackEnd(callback: (() => void) | null): void {
    this.onPlaybackEnd = callback
  }

  /**
   * Stop current audio playback
   */
  public stop(): void {
    this.isIntentionallyStopped = true

    // Stop HTML audio if playing
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }

    // Stop speech synthesis if active
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }

    // Notify that playback has ended
    if (this.onPlaybackEnd) {
      this.onPlaybackEnd()
    }
  }

  /**
   * Play audio from URL (Vapi TTS audio) or fallback to enhanced browser TTS
   */
  public async playAudioUrl(audioUrl: string | null, ttsConfig?: any): Promise<void> {
    // Reset the intentionally stopped flag when starting new playback
    this.isIntentionallyStopped = false

    // If we have an audio URL, play it directly
    if (audioUrl) {
      return this.playDirectAudio(audioUrl)
    }
    
    // Fallback to enhanced browser TTS if no audio URL
    if (ttsConfig && ttsConfig.text) {
      return this.playEnhancedBrowserTTS(ttsConfig.text, ttsConfig.voiceSettings, ttsConfig.enhancedSettings)
    }
    
    throw new Error('No audio URL or TTS configuration provided')
  }

  /**
   * Play audio directly from URL
   */
  private async playDirectAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any current audio
      this.stop()

      try {
        const audio = new Audio(audioUrl)
        
        // Configure audio settings
        audio.volume = 1.0
        audio.preload = 'auto'

        // Set up event handlers
        audio.onloadstart = () => {
          console.log('🎵 Loading Vapi TTS audio...')
        }

        audio.oncanplay = () => {
          console.log('🎵 Vapi TTS audio ready to play')
        }

        audio.onplay = () => {
          console.log('🎵 Vapi TTS playback started')
        }

        audio.onended = () => {
          console.log('🎵 Vapi TTS playback ended')
          this.currentAudio = null
          if (this.onPlaybackEnd && !this.isIntentionallyStopped) {
            this.onPlaybackEnd()
          }
          resolve()
        }

        audio.onerror = (event) => {
          console.error('🔴 Vapi TTS playback error:', event)
          this.currentAudio = null
          if (this.onPlaybackEnd && !this.isIntentionallyStopped) {
            this.onPlaybackEnd()
          }
          reject(new Error('Failed to play TTS audio'))
        }

        // Store current audio
        this.currentAudio = audio

        // Play the audio
        audio.play().catch(error => {
          console.error('🔴 Audio play error:', error)
          reject(error)
        })
      } catch (error) {
        console.error('🔴 Audio creation error:', error)
        reject(error)
      }
    })
  }

  /**
   * Enhanced browser TTS with natural-sounding voices
   */
  private async playEnhancedBrowserTTS(text: string, voiceSettings: any = {}, enhancedSettings: any = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported in this browser'))
        return
      }

      // Stop any current speech
      this.stop()

      try {
        // Wait for voices to load
        const loadVoices = () => {
          const voices = speechSynthesis.getVoices()
          
          if (voices.length === 0) {
            // Voices not loaded yet, wait and retry
            setTimeout(loadVoices, 100)
            return
          }

          console.log('🎵 Available voices:', voices.map(v => v.name))

          // Create enhanced utterance
          const utterance = new SpeechSynthesisUtterance(text)
          
          // Apply voice settings
          utterance.rate = voiceSettings.rate || 0.85
          utterance.pitch = voiceSettings.pitch || 1.0
          utterance.volume = voiceSettings.volume || 1.0
          utterance.lang = voiceSettings.lang || 'en-US'

          // Try to find and use a high-quality voice
          if (enhancedSettings.preferredVoices) {
            for (const preferredVoice of enhancedSettings.preferredVoices) {
              const voice = voices.find(v => 
                v.name.includes(preferredVoice) || 
                v.name.toLowerCase().includes(preferredVoice.toLowerCase())
              )
              if (voice) {
                utterance.voice = voice
                console.log('🎵 Selected voice:', voice.name)
                break
              }
            }
          }

          // If no preferred voice found, use the best available English voice
          if (!utterance.voice) {
            const englishVoices = voices.filter(v => v.lang.startsWith('en'))
            if (englishVoices.length > 0) {
              // Prefer Google or Microsoft voices
              const qualityVoice = englishVoices.find(v => 
                v.name.includes('Google') || 
                v.name.includes('Microsoft') ||
                v.name.includes('Enhanced')
              ) || englishVoices[0]
              
              utterance.voice = qualityVoice
              console.log('🎵 Using fallback voice:', qualityVoice.name)
            }
          }

          // Set up event handlers
          utterance.onstart = () => {
            console.log('🎵 Enhanced browser TTS started')
          }

          utterance.onend = () => {
            console.log('🎵 Enhanced browser TTS completed')
            if (this.onPlaybackEnd && !this.isIntentionallyStopped) {
              this.onPlaybackEnd()
            }
            resolve()
          }

          utterance.onerror = (event) => {
            console.error('🔴 Enhanced TTS error:', event.error)
            
            // If this was intentionally stopped, don't treat it as an error
            if (this.isIntentionallyStopped && event.error === 'interrupted') {
              console.log('🛑 TTS was intentionally stopped')
              resolve()
              return
            }
            
            if (this.onPlaybackEnd && !this.isIntentionallyStopped) {
              this.onPlaybackEnd()
            }
            reject(new Error(`Speech synthesis error: ${event.error}`))
          }

          // Start speaking
          speechSynthesis.speak(utterance)
        }

        // Load voices
        loadVoices()

      } catch (error) {
        console.error('🔴 Enhanced TTS setup error:', error)
        reject(error)
      }
    })
  }
}

/**
 * Get Audio Player Manager instance for Vapi TTS
 */
export const getTTSManager = (): AudioPlayerManager => {
  return AudioPlayerManager.getInstance()
} 