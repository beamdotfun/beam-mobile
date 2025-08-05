module.exports = {
  dependencies: {
    'react-native-svg': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-svg/android',
          packageImportPath: 'import com.horcrux.svg.SvgPackage;',
        },
      },
    },
  },
  project: {
    android: {
      sourceDir: './android',
      appName: 'app',
    },
  },
  assets: ['./src/assets/fonts/'],
};
