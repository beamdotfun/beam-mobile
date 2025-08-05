# Beam Mobile App

A React Native mobile application for Beam - a decentralized social media platform built on Solana blockchain.

## 🚀 Quick Start

```bash
# Navigate to the React Native project
cd SolanaSocialMobile

# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android (in a new terminal)
npm run android

# Run on iOS (in a new terminal, macOS only)
npm run ios
```

## 📋 Prerequisites

- Node.js 18+
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Solana Mobile Wallet for testing

## 🏗️ Project Structure

```
SolanaSocialMobile/           # Main React Native application
├── src/                      # Source code
│   ├── components/          # Reusable components
│   ├── screens/            # Screen components
│   ├── services/           # API and external services
│   ├── store/              # State management (Zustand)
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
├── android/                 # Android-specific code
├── ios/                    # iOS-specific code
└── docs/                   # Additional documentation

docs/                        # Project documentation
specs/                       # API and feature specifications
```

## 🔧 Development

### Key Technologies

- **React Native 0.73+** - Mobile framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **React Navigation v6** - Navigation
- **TanStack Query** - Data fetching
- **NativeWind** - Styling (TailwindCSS for React Native)
- **Solana Mobile Wallet Adapter** - Blockchain integration

### Architecture

The app implements a dual data source architecture:
- **Backend API Mode**: Fast, cached responses via REST API
- **Direct RPC Mode**: Decentralized access via Solana RPC endpoints
- **Real-time Updates**: WebSocket integration for live social features

### Available Scripts

```bash
# Development
npm start                    # Start Metro bundler
npm run android             # Run on Android
npm run ios                 # Run on iOS

# Code Quality
npm run lint                # Run ESLint
npm test                    # Run tests

# Build
npm run build              # Build for production
```

## 📚 Documentation

- **[CLAUDE.md](docs/CLAUDE.md)** - Development guidelines and architecture
- **[docs/](docs/)** - Integration guides and API documentation
- **[specs/](specs/)** - Detailed specifications and requirements

## 🔐 Security

- Never commit private keys or sensitive data
- Use environment variables for configuration
- Follow Solana Mobile security best practices
- Implement proper authentication token handling

## 🧪 Testing

The project includes comprehensive testing for:
- Component rendering
- State management
- API integration
- Wallet connection flows
- Navigation patterns

## 📱 Mobile-First Features

- Solana Mobile Wallet integration
- One-handed operation support
- Haptic feedback
- Optimized for mobile performance
- Cross-platform compatibility (Android/iOS)

## 🤝 Contributing

1. Follow the existing code style and architecture
2. Run tests before submitting changes
3. Update documentation as needed
4. Ensure TypeScript compilation passes

## 📄 License

This project is part of the Beam social media platform.

---

For detailed development instructions, see [CLAUDE.md](docs/CLAUDE.md).