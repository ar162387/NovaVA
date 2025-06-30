# NovaVA Frontend

**Nova Virtual Assistant** - A modern, AI-powered conversational interface built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern Tech Stack**: React 18 + TypeScript + Vite + Tailwind CSS v4
- **Conversational AI**: Text and voice conversation capabilities
- **Real-time Communication**: Seamless integration with NovaVA backend API
- **Responsive Design**: Beautiful, mobile-first interface
- **Audio Support**: Voice message playback and recording
- **Session Management**: Persistent conversation history
- **Error Handling**: Robust error states and loading indicators
- **Accessibility**: Screen reader friendly and keyboard navigable

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client for API communication
- **UUID** - Unique identifier generation
- **CLSX** - Conditional class name utility

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- NovaVA Backend server running (see `../backend/README.md`)

## 🏗️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   VITE_API_URL=http://localhost:5001/api
   VITE_NODE_ENV=development
   VITE_DEBUG=true
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # App header with branding
│   ├── Footer.tsx      # App footer with attribution
│   ├── ChatInterface.tsx   # Main chat interface
│   ├── ChatMessage.tsx     # Individual message component

├── services/           # API and external services
│   └── api.ts         # Backend API client
├── types/             # TypeScript type definitions
│   └── index.ts       # All type exports
├── utils/             # Utility functions
│   └── index.ts       # Helper functions
├── App.tsx            # Main application component
├── main.tsx           # React app entry point
└── index.css          # Global styles and Tailwind
```

## 🎨 Design System

### Colors
- **Primary**: Blue palette for main actions and branding
- **Secondary**: Gray palette for neutral elements
- **Accent**: Emerald palette for voice/special features
- **Success**: Green for positive states
- **Warning**: Yellow for attention states
- **Error**: Red for error states

### Components
- **Buttons**: Primary, secondary, and accent variants
- **Cards**: Glass morphism with backdrop blur
- **Chat Bubbles**: Distinct styles for user/assistant messages
- **Loading States**: Animated dots and spinners

## 🔌 API Integration

The frontend integrates with the NovaVA backend API:

- **Text Conversations**: Send text messages and receive AI responses
- **Voice Conversations**: Start/end voice calls with AI assistant
- **Assistant Management**: Create and manage AI assistant configurations
- **Health Monitoring**: Backend connectivity and service status

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Tablet**: Enhanced layout for medium screens
- **Desktop**: Full-featured experience with sidebar navigation

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5001/api` |
| `VITE_NODE_ENV` | Environment mode | `development` |
| `VITE_DEBUG` | Enable debug logging | `true` |

### Tailwind Configuration

The project uses Tailwind CSS v4 with custom theme extensions:
- Extended color palette
- Custom animations
- Glass morphism utilities
- Component classes

## 🚀 Deployment

### Production Build

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

### Deploy to Static Hosting

The built files in `dist/` can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Azure Static Web Apps

## 🔍 Development

### Code Style

- ESLint + TypeScript ESLint for code quality
- Prettier formatting (recommended)
- Strict TypeScript configuration
- Path aliases for clean imports

### State Management

- React hooks for local state
- Props drilling for component communication
- Future: Consider Zustand or Context API for global state

### Error Handling

- Try-catch blocks for async operations
- Error boundaries for React component errors
- User-friendly error messages
- Fallback UI components

## 🧪 Testing

To add testing to this project:

1. Install testing dependencies:
   ```bash
   npm install -D @testing-library/react @testing-library/jest-dom vitest
   ```

2. Add test scripts to `package.json`
3. Create test files alongside components

## 🤝 Contributing

1. Follow the existing code style
2. Add TypeScript types for all new code
3. Update README if adding new features
4. Test across different screen sizes
5. Ensure accessibility compliance

## 📝 License

This project is part of the NovaVA prototype by Abdur Rehman.

## 🙏 Acknowledgments

- **Vapi** - Conversational AI API platform
- **Lucide** - Beautiful icon library
- **Tailwind CSS** - Utility-first CSS framework
- **React Team** - Amazing frontend framework 