# Beam Mobile App

A React Native mobile application for Beam - a decentralized social media platform built on Solana blockchain.

## Quick Start

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

## Project Structure

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

## Development

### Key Technologies

- **React Native 0.73+** - Mobile framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **React Navigation v6** - Navigation
- **TanStack Query** - Data fetching
- **NativeWind** - Styling (TailwindCSS for React Native)
- **Solana Mobile Wallet Adapter** - Blockchain integration

## License

This project is part of the Beam social media platform.
