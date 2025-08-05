import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {Briefcase} from 'lucide-react-native';
import {SidebarMenu} from '../../components/navigation/SidebarMenu';

interface BusinessScreenProps {
  navigation: any;
}

export default function BusinessScreen({navigation}: BusinessScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const [sidebarVisible, setSidebarVisible] = useState(false);

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
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    message: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 24,
      fontFamily: 'Inter-Regular',
      paddingHorizontal: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <AppNavBar
        title="Business"
        onProfilePress={() => setSidebarVisible(true)}
        onNewPostPress={() => navigation.navigate('CreatePost')}
      />
      
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Briefcase size={32} color={colors.foreground} />
          <Text style={styles.title}>Business</Text>
        </View>
        <Text style={styles.message}>
          Please login to your account on the desktop site to access business features.
        </Text>
      </View>

      {/* Sidebar Menu */}
      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
      />
    </SafeAreaView>
  );
}