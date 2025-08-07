import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {Toast} from '../../components/ui/Toast';

interface SolanaSettingsScreenProps {
  navigation: any;
}

type ConnectionMethod = 'beam' | 'direct';
type BlockchainExplorer = 'solscan' | 'solanafm' | 'solanacom';

interface RadioTileOption {
  id: string;
  title: string;
  subtitle: string;
  domain?: string;
}

const connectionMethods: Record<ConnectionMethod, RadioTileOption> = {
  beam: {
    id: 'beam',
    title: 'Beam',
    subtitle: 'Recommended',
  },
  direct: {
    id: 'direct',
    title: 'Direct Connection',
    subtitle: 'Use your own Solana RPC endpoint',
  },
};

const blockchainExplorers: Record<BlockchainExplorer, RadioTileOption> = {
  solscan: {
    id: 'solscan',
    title: 'SolScan',
    subtitle: 'Most popular Solana explorer',
    domain: 'SOLSCAN.IO',
  },
  solanafm: {
    id: 'solanafm',
    title: 'Solana FM',
    subtitle: 'Advanced analytics and tracking',
    domain: 'SOLANA.FM',
  },
  solanacom: {
    id: 'solanacom',
    title: 'Solana Explorer',
    subtitle: 'Official Solana Foundation explorer',
    domain: 'SOLANA.COM',
  },
};

// Helper function to map API explorer values to UI values
const mapApiExplorerToUI = (apiExplorer: string): BlockchainExplorer => {
  switch (apiExplorer) {
    case 'solana-fm':
      return 'solanafm';
    case 'solana.com':
    case 'solanacom':
      return 'solanacom';
    case 'solscan':
    default:
      return 'solscan';
  }
};

// Helper function to map UI explorer values back to API values
const mapUIExplorerToAPI = (uiExplorer: BlockchainExplorer): string => {
  switch (uiExplorer) {
    case 'solanafm':
      return 'solana-fm';
    case 'solanacom':
      return 'solana.com';
    case 'solscan':
    default:
      return 'solscan';
  }
};

export default function SolanaSettingsScreen({navigation}: SolanaSettingsScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {currentProfile, updateProfile, loadProfile} = useProfileStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  // Get the most complete profile data available
  const profileData = currentProfile || user;
  
  // DETAILED LOGGING: Log all available user data for Solana settings
  console.log('🔍 SolanaSettingsScreen: Data available:');
  console.log('  - user from auth store:', JSON.stringify(user, null, 2));
  console.log('  - currentProfile from profile store:', JSON.stringify(currentProfile, null, 2));
  console.log('  - final profileData:', JSON.stringify(profileData, null, 2));
  
  // Local state for settings with proper API value mapping
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>(
    (currentProfile?.connectionMethod || user?.connectionMethod || 'beam') as ConnectionMethod
  );
  const [selectedExplorer, setSelectedExplorer] = useState<BlockchainExplorer>(
    mapApiExplorerToUI(currentProfile?.explorer || user?.explorer || 'solscan')
  );

  // Update form fields when profile data loads/changes OR when user data is available
  useEffect(() => {
    console.log('🔍 SolanaSettingsScreen: useEffect triggered');
    console.log('  - currentProfile exists:', !!currentProfile);
    console.log('  - currentProfile.explorer:', currentProfile?.explorer);
    console.log('  - user exists:', !!user);
    console.log('  - user.explorer:', user?.explorer);
    
    // Get data from currentProfile or user with proper API-to-UI mapping
    const dataSource = currentProfile || user || {};
    const rawExplorer = dataSource.explorer || 'solscan';
    const rawConnectionMethod = dataSource.connectionMethod || 'beam';
    
    // Map API values to UI values
    const newSelectedExplorer = mapApiExplorerToUI(rawExplorer);
    const newConnectionMethod = rawConnectionMethod as ConnectionMethod;
    
    console.log('🔍 SolanaSettingsScreen: Setting form values with API-to-UI mapping');
    console.log('  - data source:', currentProfile ? 'currentProfile' : user ? 'user data' : 'defaults');
    console.log('  - raw explorer from API:', rawExplorer);
    console.log('  - mapped explorer for UI:', newSelectedExplorer);
    console.log('  - connectionMethod:', newConnectionMethod);
    
    setSelectedExplorer(newSelectedExplorer);
    setConnectionMethod(newConnectionMethod);
  }, [currentProfile?.explorer, currentProfile?.connectionMethod, user?.connectionMethod, user?.explorer]);

  const handleConnectionMethodChange = useCallback((method: ConnectionMethod) => {
    setConnectionMethod(method);
    console.log('Connection method changed:', method);
  }, []);

  const handleExplorerChange = useCallback((explorer: BlockchainExplorer) => {
    setSelectedExplorer(explorer);
    console.log('Explorer changed:', explorer);
  }, []);

  const handleSaveChanges = useCallback(async () => {
    // Map UI values back to API values for saving
    const apiExplorer = mapUIExplorerToAPI(selectedExplorer);
    
    console.log('Save Solana settings:', {
      connectionMethod,
      selectedExplorer: selectedExplorer, // UI value
      apiExplorer: apiExplorer, // API value to send
    });
    
    setIsSaving(true);
    
    try {
      // Call the profile update API with Solana settings
      await updateProfile({
        explorer: apiExplorer,
        connectionMethod: connectionMethod,
      });
      
      setToastMessage('Solana settings saved successfully');
      setToastType('success');
      setShowToast(true);
      
      // Reload the profile to get the updated data from server
      await loadProfile();
      
      // Navigate back after a longer delay so user can read the message
      setTimeout(() => {
        navigation.goBack();
      }, 2500);
    } catch (error) {
      console.error('Failed to save Solana settings:', error);
      setToastMessage('Failed to save settings. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  }, [connectionMethod, selectedExplorer, updateProfile, navigation]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginHorizontal: 16,
      marginTop: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      marginBottom: 24,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 4,
    },
    section: {
      marginBottom: 32,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
    },
    sectionCaption: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginBottom: 16,
    },
    radioGroup: {
      gap: 12,
    },
    radioTile: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      height: 56,
    },
    radioTileSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    radioTileDisabled: {
      opacity: 0.5,
      backgroundColor: colors.muted,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    radioButtonSelected: {
      borderColor: colors.primary,
    },
    radioButtonDisabled: {
      borderColor: colors.mutedForeground,
      opacity: 0.5,
    },
    radioButtonInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    radioButtonInnerDisabled: {
      backgroundColor: colors.mutedForeground,
      opacity: 0.5,
    },
    radioContent: {
      flex: 1,
    },
    radioTitle: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      marginBottom: 2,
    },
    radioTitleDisabled: {
      color: colors.mutedForeground,
    },
    radioSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    radioSubtitleDisabled: {
      color: colors.mutedForeground,
      opacity: 0.7,
    },
    radioDomain: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.mutedForeground,
      fontFamily: 'Inter-SemiBold',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    radioDomainDisabled: {
      opacity: 0.7,
    },
    saveButtonContainer: {
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    bottomContainer: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      height: 48,
      justifyContent: 'center',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
      lineHeight: 20,
      textAlignVertical: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
  });

  const renderRadioTile = (
    option: RadioTileOption,
    isSelected: boolean,
    onPress: () => void,
    disabled = false,
  ) => (
    <Pressable
      key={option.id}
      style={[
        styles.radioTile,
        isSelected && styles.radioTileSelected,
        disabled && styles.radioTileDisabled,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}>
      <View style={[
        styles.radioButton,
        isSelected && styles.radioButtonSelected,
        disabled && styles.radioButtonDisabled,
      ]}>
        {isSelected && <View style={[styles.radioButtonInner, disabled && styles.radioButtonInnerDisabled]} />}
      </View>
      <View style={styles.radioContent}>
        <Text style={[
          styles.radioTitle,
          disabled && styles.radioTitleDisabled,
        ]}>{option.title}</Text>
        <Text style={[
          styles.radioSubtitle,
          disabled && styles.radioSubtitleDisabled,
        ]}>{option.subtitle}</Text>
      </View>
      {option.domain && (
        <Text style={[
          styles.radioDomain,
          disabled && styles.radioDomainDisabled,
        ]}>{option.domain}</Text>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title="Solana Settings"
        showBackButton={true}
        onBackPress={() => navigation.navigate('Settings')}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 120}}>
          <View style={styles.formCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Solana Configuration</Text>
              <Text style={styles.cardSubtitle}>
                Configure how you connect to the Solana blockchain
              </Text>
            </View>

            {/* Connection Method */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Connection Method</Text>
              <Text style={styles.sectionCaption}>
                Choose how to connect to the Solana network
              </Text>
              
              <View style={styles.radioGroup}>
                {Object.values(connectionMethods).map((method) =>
                  renderRadioTile(
                    method,
                    connectionMethod === method.id,
                    () => handleConnectionMethodChange(method.id as ConnectionMethod),
                    method.id === 'direct', // Disable the direct connection option
                  )
                )}
              </View>
            </View>

            {/* Blockchain Explorer */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Preferred Blockchain Explorer</Text>
              <Text style={styles.sectionCaption}>
                Select your preferred explorer for viewing transactions and accounts
              </Text>
              
              <View style={styles.radioGroup}>
                {Object.values(blockchainExplorers).map((explorer) =>
                  renderRadioTile(
                    explorer,
                    selectedExplorer === explorer.id,
                    () => handleExplorerChange(explorer.id as BlockchainExplorer),
                  )
                )}
              </View>
            </View>

            {/* Save Button Section */}
            <View style={styles.saveButtonContainer}>
              <Pressable 
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
                onPress={handleSaveChanges}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Toast for feedback - show at top to avoid bottom nav */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={showToast}
        onHide={() => setShowToast(false)}
        position="top"
      />
    </SafeAreaView>
  );
}