#!/bin/bash

echo "🔄 Updating app icons for Android..."

# Clean everything
echo "🧹 Cleaning build directories..."
cd android
./gradlew clean
cd ..

# Remove build folders
echo "🗑️  Removing build folders..."
rm -rf android/app/build
rm -rf android/build
rm -rf node_modules/.cache

# Kill any running Metro bundler
echo "🛑 Stopping Metro bundler..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

echo "✅ Build cleaned successfully!"
echo ""
echo "To complete the icon update:"
echo "1. Uninstall the app from your device/emulator"
echo "2. Run: npx react-native run-android"
echo ""
echo "For iOS (if needed):"
echo "1. You'll need to add icon files to ios/SolanaSocialMobile/Images.xcassets/AppIcon.appiconset/"
echo "2. Then clean and rebuild: cd ios && pod install && cd .. && npx react-native run-ios"