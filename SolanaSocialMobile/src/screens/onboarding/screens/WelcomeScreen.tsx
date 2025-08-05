import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {ChevronRight} from 'lucide-react-native';

interface WelcomeScreenProps {
  onContinue: () => void;
}

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({onContinue}) => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/beam-banner.png')}
        style={styles.backgroundImage}
        resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.content}>
            {/* Main Content Card */}
            <View style={styles.cardContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../../../assets/logo.png')}
                    style={styles.cardLogo}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <View style={styles.textContent}>
                <Text style={styles.title}>Welcome!</Text>
                
                <Text style={styles.description}>
                  Beam is social media built for network states. All posts and most 
                  in-app actions are recorded publicly to create a transparent and 
                  permanent record.
                </Text>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={styles.continueButton}
                onPress={onContinue}
                activeOpacity={0.8}>
                <Text style={styles.continueButtonText}>Continue</Text>
                <View style={styles.iconSpacer} />
                <ChevronRight size={20} color="#1f2937" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    backdropFilter: 'blur(8px)',
    maxWidth: 400,
    width: '100%',
  },
  header: {
    marginBottom: 0,
  },
  cardLogo: {
    width: 160,
    height: 112,
  },
  textContent: {
    alignItems: 'center',
    marginTop: 19,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  continueButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'Inter',
  },
  iconSpacer: {
    width: 8,
  },
});