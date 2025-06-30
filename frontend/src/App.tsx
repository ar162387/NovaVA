import { useState, useEffect } from 'react'
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

  // Check backend connectivity on app load
  useEffect(() => {
    checkBackendConnection()
  }, [])

  /**
   * Check if the backend is accessible and healthy
   */
  const checkBackendConnection = async () => {
    try {
      setAppState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const health = await apiService.getHealth()
      devLog('Health check response:', health)
      
      setAppState(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      console.error('Backend connection failed:', error)
      setAppState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: 'Unable to connect to NovaVA backend. Please ensure the server is running.',
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
   * Connection status indicator
   */
  const ConnectionStatus = () => (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
      appState.isConnected
        ? 'bg-success-100 text-success-700'
        : 'bg-error-100 text-error-700'
    }`}>
      {appState.isConnected ? (
        <>
          <Wifi className="w-4 h-4" />
          Connected
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          Disconnected
        </>
      )}
    </div>
  )

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
        />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default App 