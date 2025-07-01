import React from 'react'
import { Heart, Github } from 'lucide-react'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white/60 backdrop-blur-sm border-t border-secondary-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left Side - Attribution */}
          <div className="flex items-center gap-2 text-sm text-secondary-600">
            <span>Prototype by</span>
            <span className="font-semibold text-secondary-800">Abdur Rehman</span>
            <Heart className="w-4 h-4 text-error-500 fill-current" />
          </div>

          {/* Center - Copyright */}
          <div className="text-sm text-secondary-500">
            © {currentYear} NovaVA.
          </div>

          {/* Right Side - Links */}
          <div className="flex items-center gap-4">
            {/* GitHub Link */}
            <a
              href="https://github.com/ar162387/NovaVA.git"
              className="flex items-center gap-1.5 text-sm text-secondary-600 hover:text-secondary-800 transition-colors"
              title="View Source Code"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Source</span>
            </a>

            
          </div>
        </div>
        
       
      </div>
    </footer>
  )
}

export default Footer 