module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      // No react-native-reanimated plugin needed since we're using built-in Animated API
    ],
  };
};
