import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Wifi, WifiOff } from 'lucide-react'
import Header from '@/components/Header'
import ChatInterface from '@/components/ChatInterface'
import Footer from '@/components/Footer'
import { apiService } from '@/services/api'
import { devLog } from '@/utils'
import type { AppState, ConversationSession } from '@/types'

function App() {
  // Application state
  const [appState, setAppState] = useState<AppState>({
    isConnected: false,
    isLoading: true,
    currentSession: null,
    sessions: [],
    error: null,
  })

  // Ref to store the health check interval
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check backend connectivity on app load and set up periodic checks
  useEffect(() => {
    checkBackendConnection()
    
    // Set up periodic health checks every 10 seconds
    healthCheckIntervalRef.current = setInterval(() => {
      console.log('⏰ Running periodic health check...')
      checkBackendConnectionSilent()
    }, 10000)

    // Cleanup interval on component unmount
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current)
      }
    }
  }, [])

  /**
   * Check if the backend is accessible and healthy (with loading state)
   */
  const checkBackendConnection = async () => {
    try {
      setAppState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const health = await apiService.getHealth()
      devLog('Health check response:', health)
      
      // Determine connection status based on service health
      const isConnected = health.status !== 'critical' && !health.connectionDetails?.networkError
      let errorMessage = null
      
      // Create meaningful error messages based on service status
      if (health.status === 'critical') {
        if (health.connectionDetails?.networkError) {
          errorMessage = 'Unable to connect to NovaVA backend. Please ensure the server is running.'
        } else if (!health.connectionDetails?.vapi && !health.connectionDetails?.elevenlabs) {
          errorMessage = 'Critical services unavailable: Both OpenAI and ElevenLabs are disconnected.'
        } else if (!health.connectionDetails?.vapi) {
          errorMessage = 'OpenAI/Vapi service unavailable. Chat functionality may not work.'
        } else {
          errorMessage = 'Critical system error. Please check service configuration.'
        }
      } else if (health.status === 'degraded') {
        const degradedServices = []
        if (!health.connectionDetails?.vapi) degradedServices.push('Chat AI')
        if (!health.connectionDetails?.elevenlabs) degradedServices.push('Voice TTS')
        if (degradedServices.length > 0) {
          errorMessage = `Some services unavailable: ${degradedServices.join(', ')}. Limited functionality may be available.`
        }
      }
      
      setAppState(prev => ({
        ...prev,
        isConnected,
        isLoading: false,
        error: errorMessage,
        healthStatus: health,
      }))
    } catch (error) {
      console.error('Backend connection failed:', error)
      setAppState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: 'Unable to connect to NovaVA backend. Please ensure the server is running.',
        healthStatus: {
          status: 'critical',
          services: {},
          errors: [(error as any)?.message || 'Network connection failed'],
          connectionDetails: {
            vapi: false,
            elevenlabs: false,
            networkError: true
          }
        }
      }))
    }
  }

  /**
   * Check backend connection silently (for periodic updates without loading state)
   */
  const checkBackendConnectionSilent = async () => {
    try {
      const health = await apiService.getHealth()
      devLog('Silent health check response:', health)
      
      // Determine connection status based on service health
      const isConnected = health.status !== 'critical' && !health.connectionDetails?.networkError
      let errorMessage = null
      
      // Create meaningful error messages based on service status
      if (health.status === 'degraded') {
        const degradedServices = []
        if (!health.connectionDetails?.vapi) degradedServices.push('Chat AI')
        if (!health.connectionDetails?.elevenlabs) degradedServices.push('Voice TTS')
        if (degradedServices.length > 0) {
          errorMessage = `Some services unavailable: ${degradedServices.join(', ')}. Limited functionality may be available.`
        }
      }
      
      // Only update if connection status changed or health details changed
      setAppState(prev => {
        const statusChanged = prev.isConnected !== isConnected
        const healthChanged = JSON.stringify(prev.healthStatus) !== JSON.stringify(health)
        
        if (statusChanged || healthChanged) {
          if (statusChanged && isConnected) {
            console.log('🟢 Backend connection restored - updating UI')
          } else if (statusChanged && !isConnected) {
            console.log('🔴 Backend services degraded - updating UI')
          }
          
          return { 
            ...prev, 
            isConnected, 
            error: errorMessage,
            healthStatus: health
          }
        }
        return prev
      })
    } catch (error) {
      console.log('🔴 Silent health check failed:', error)
      
      // Only update connection status if it changed
      setAppState(prev => {
        if (prev.isConnected) {
          console.log('🔴 Backend connection lost - updating UI')
          return { 
            ...prev, 
            isConnected: false,
            error: 'Connection to backend lost. Attempting to reconnect...',
            healthStatus: {
              status: 'critical',
              services: {},
              errors: [(error as any)?.message || 'Network connection failed'],
              connectionDetails: {
                vapi: false,
                elevenlabs: false,
                networkError: true
              }
            }
          }
        }
        return prev
      })
    }
  }

  /**
   * Handle API errors to detect connection issues
   */
  const handleApiError = (error: any) => {
    // Check if this is a network/connection error
    if (error?.code === 'NETWORK_ERROR' || (typeof error?.message === 'string' && error.message.includes('Network error'))) {
      setAppState(prev => ({
        ...prev,
        isConnected: false,
        error: 'Connection to backend lost. Attempting to reconnect...'
      }))
    }
  }

  /**
   * Create a new conversation session
   */
  const createNewSession = (): ConversationSession => {
    const newSession: ConversationSession = {
      id: `session-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
    }

    setAppState(prev => ({
      ...prev,
      currentSession: newSession,
      sessions: [...prev.sessions, newSession],
    }))

    return newSession
  }

  /**
   * Update the current session with new data
   */
  const updateCurrentSession = (updates: Partial<ConversationSession>) => {
    if (!appState.currentSession) return

    const updatedSession = {
      ...appState.currentSession,
      ...updates,
      updatedAt: new Date(),
    }

    setAppState(prev => ({
      ...prev,
      currentSession: updatedSession,
      sessions: prev.sessions.map(session =>
        session.id === updatedSession.id ? updatedSession : session
      ),
    }))
  }

  /**
   * Enhanced connection status indicator with service details
   */
  const ConnectionStatus = () => {
    const { isConnected, healthStatus } = appState
    const health = healthStatus
    
    // Determine status color and text based on overall health
    const getStatusConfig = () => {
      if (!isConnected || health?.status === 'critical') {
        return {
          bgClass: 'bg-error-100 text-error-700',
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Disconnected'
        }
      } else if (health?.status === 'degraded') {
        return {
          bgClass: 'bg-warning-100 text-warning-700',
          icon: <Wifi className="w-4 h-4" />,
          text: 'Limited'
        }
      } else {
        return {
          bgClass: 'bg-success-100 text-success-700',
          icon: <Wifi className="w-4 h-4" />,
          text: 'Connected'
        }
      }
    }
    
    const statusConfig = getStatusConfig()
    
    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgClass}`}>
        {statusConfig.icon}
        {statusConfig.text}
        
        {/* Show service details on hover */}
        {health && (
          <div className="hidden md:inline-flex items-center gap-1 ml-2 text-xs opacity-75">
            {/* Vapi/OpenAI status */}
            <span title={health.connectionDetails?.vapiError || 'AI Chat Service'}>
              🤖 {health.connectionDetails?.vapi ? '✓' : '✗'}
            </span>
            
            {/* ElevenLabs status */}
            <span title={health.connectionDetails?.elevenlabsError || 'Voice TTS Service'}>
              🔊 {health.connectionDetails?.elevenlabs ? '✓' : '✗'}
            </span>
          </div>
        )}
      </div>
    )
  }

  /**
   * Loading screen
   */
  if (appState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <MessageSquare className="w-8 h-8 text-primary-500 animate-bounce" />
            <h1 className="text-2xl font-bold gradient-text">NovaVA</h1>
          </div>
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot" style={{ animationDelay: '0.1s' }}></div>
            <div className="loading-dot" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-secondary-600 mt-4">Initializing Nova Virtual Assistant...</p>
        </div>
      </div>
    )
  }

  /**
   * Error screen
   */
  if (appState.error) {
    // Log detailed error info for debugging
    console.error('NovaVA Connection Error:', {
      errorMessage: appState.error,
      healthStatus: appState.healthStatus
    })
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <MessageSquare className="w-8 h-8 text-error-500" />
            <h1 className="text-2xl font-bold text-secondary-800">NovaVA</h1>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-error-600 mb-2">Connection Error</h2>
            <p className="text-secondary-600">{appState.error}</p>
          </div>
          
          <button
            onClick={checkBackendConnection}
            className="btn-primary w-full"
            disabled={appState.isLoading}
          >
            {appState.isLoading ? 'Reconnecting...' : 'Try Again'}
          </button>
          
          <div className="mt-4 text-sm text-secondary-500">
            <p>Make sure the backend server is running on port 5001</p>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Main application
   */
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header connectionStatus={<ConnectionStatus />} />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <ChatInterface
          currentSession={appState.currentSession}
          onCreateSession={createNewSession}
          onUpdateSession={updateCurrentSession}
          isConnected={appState.isConnected}
          onApiError={handleApiError}
        />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default App 