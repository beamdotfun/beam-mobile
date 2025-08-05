import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Users,
  Zap,
  ExternalLink,
  Book,
  Search,
  Clock,
} from 'lucide-react-native';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {SidebarMenu} from '../../components/navigation/SidebarMenu';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';

interface HelpScreenProps {
  navigation: any;
}

export default function HelpScreen({navigation}: HelpScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleContactSupport = useCallback(() => {
    // This would open a contact form or navigate to a support screen
    console.log('Open contact form');
    // For now, we could open email
    Linking.openURL('mailto:support@beam.fun?subject=Support Request');
  }, []);

  const handleViewDocumentation = useCallback(() => {
    // This would open documentation in browser or navigate to docs screen
    Linking.openURL('https://docs.beam.fun');
  }, []);

  const handleSidebarNavigate = useCallback((screen: string, params?: any) => {
    setSidebarVisible(false);
    if (screen === 'Profile') {
      navigation.navigate('UserProfile', params);
    } else {
      navigation.navigate(screen, params);
    }
  }, [navigation]);


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    heroSection: {
      paddingHorizontal: 20,
      paddingVertical: 32,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    heroIcon: {
      marginBottom: 16,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 24,
    },
    optionsContainer: {
      paddingHorizontal: 20,
      paddingBottom: 80, // Extra space for bottom navigation
    },
    optionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    optionIcon: {
      marginRight: 12,
    },
    optionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    optionDescription: {
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      lineHeight: 22,
      marginBottom: 16,
    },
    featureList: {
      marginBottom: 20,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    featureIcon: {
      marginRight: 12,
    },
    featureText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      flex: 1,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
      marginRight: 8,
    },
    secondaryActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    secondaryActionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.secondaryForeground,
      fontFamily: 'Inter-SemiBold',
      marginRight: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <AppNavBar
        title="Help Center"
        onProfilePress={() => setSidebarVisible(true)}
        onNewPostPress={() => navigation.navigate('CreatePost')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <HelpCircle size={48} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Help Center</Text>
          <Text style={styles.heroSubtitle}>
            Find answers in our documentation or reach out to our support team
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Contact Support */}
          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <MessageCircle size={24} color={colors.primary} style={styles.optionIcon} />
              <Text style={styles.optionTitle}>Contact Support</Text>
            </View>
            <Text style={styles.optionDescription}>
              Get personalized help from our support team. We typically respond within 24 hours.
            </Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Mail size={16} color={colors.mutedForeground} style={styles.featureIcon} />
                <Text style={styles.featureText}>Direct email support</Text>
              </View>
              <View style={styles.featureItem}>
                <Users size={16} color={colors.mutedForeground} style={styles.featureIcon} />
                <Text style={styles.featureText}>Expert assistance</Text>
              </View>
              <View style={styles.featureItem}>
                <Zap size={16} color={colors.mutedForeground} style={styles.featureIcon} />
                <Text style={styles.featureText}>Priority response for Pro users</Text>
              </View>
            </View>

            <Pressable style={styles.actionButton} onPress={handleContactSupport}>
              <Text style={styles.actionButtonText}>Open Contact Form</Text>
              <ExternalLink size={16} color={colors.primaryForeground} />
            </Pressable>
          </View>

          {/* Browse Documentation */}
          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <Book size={24} color={colors.primary} style={styles.optionIcon} />
              <Text style={styles.optionTitle}>Browse Documentation</Text>
            </View>
            <Text style={styles.optionDescription}>
              Explore our comprehensive documentation to find answers and learn about features.
            </Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Book size={16} color={colors.mutedForeground} style={styles.featureIcon} />
                <Text style={styles.featureText}>Detailed guides and tutorials</Text>
              </View>
              <View style={styles.featureItem}>
                <Search size={16} color={colors.mutedForeground} style={styles.featureIcon} />
                <Text style={styles.featureText}>Searchable knowledge base</Text>
              </View>
              <View style={styles.featureItem}>
                <Clock size={16} color={colors.mutedForeground} style={styles.featureIcon} />
                <Text style={styles.featureText}>Always up-to-date</Text>
              </View>
            </View>

            <Pressable style={styles.secondaryActionButton} onPress={handleViewDocumentation}>
              <Text style={styles.secondaryActionButtonText}>View Documentation</Text>
              <ExternalLink size={16} color={colors.secondaryForeground} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Sidebar Menu */}
      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
      />
    </SafeAreaView>
  );
}