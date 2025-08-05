#!/bin/bash

# Script to install Solana Mobile fakewallet for testing

echo "🔧 Installing Solana Mobile fakewallet..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create a temporary directory for fakewallet
TEMP_DIR="../fakewallet-temp"
echo "📁 Creating temporary directory: $TEMP_DIR"

# Clone the mobile-wallet-adapter repo
echo "📥 Cloning mobile-wallet-adapter repository..."
cd ..
git clone https://github.com/solana-mobile/mobile-wallet-adapter.git fakewallet-temp

# Check if clone was successful
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to clone repository"
    exit 1
fi

cd fakewallet-temp/android

echo "📱 Building fakewallet..."
echo "⚠️  Note: This requires Android Studio or command line build tools"
echo ""
echo "To complete installation:"
echo "1. Open Android Studio"
echo "2. Select 'Open project' and navigate to: $(pwd)"
echo "3. Select the build.gradle file"
echo "4. After loading, select 'fakewallet' in the build configuration dropdown"
echo "5. Click 'Run' to install on your emulator"
echo ""
echo "Alternative (command line):"
echo "cd $(pwd)"
echo "./gradlew :fakewallet:installDebug"
echo ""
echo "Once installed, fakewallet will handle wallet connections in your emulator!"