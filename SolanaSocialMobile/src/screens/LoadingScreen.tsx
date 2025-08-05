import React from 'react';
import {View, StyleSheet, Image} from 'react-native';

export default function LoadingScreen() {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    splashImage: {
      flex: 1,
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
  });

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/splash.png')} 
        style={styles.splashImage}
      />
    </View>
  );
}