import React from 'react'
import { MessageSquare, Settings, HelpCircle } from 'lucide-react'

interface HeaderProps {
  connectionStatus?: React.ReactNode
}

const Header: React.FC<HeaderProps> = ({ connectionStatus }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-secondary-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <MessageSquare className="w-8 h-8 text-primary-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold gradient-text">NovaVA</h1>
              <p className="text-xs text-secondary-500 -mt-1">Nova Virtual Assistant</p>
            </div>
          </div>

          {/* Center - Connection Status */}
          <div className="hidden sm:flex items-center">
            {connectionStatus}
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Connection Status */}
            <div className="sm:hidden">
              {connectionStatus}
            </div>
            
            
          </div>
        </div>
      </div>
      
      {/* Gradient Line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-300 to-transparent"></div>
    </header>
  )
}

export default Header 