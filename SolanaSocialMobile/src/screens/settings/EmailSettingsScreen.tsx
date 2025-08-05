import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {AppNavBar} from '../../components/navigation/AppNavBar';

interface EmailSettingsScreenProps {
  navigation: any;
}

export default function EmailSettingsScreen({navigation}: EmailSettingsScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  
  // Check if user has email (not a wallet-only account)
  // Also check if email is not just the wallet address
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const hasEmail = user?.email && 
                   user.email.trim() !== '' && 
                   isValidEmail(user.email);
  
  // Local state for form fields - prepopulate with current email only if valid
  const [newEmail, setNewEmail] = useState(hasEmail ? user.email : '');

  // Update email field when user data changes
  useEffect(() => {
    if (user?.email && isValidEmail(user.email)) {
      setNewEmail(user.email);
    }
  }, [user?.email]);

  const handleUpdateEmail = useCallback(() => {
    if (hasEmail) {
      console.log('Update email:', {
        currentEmail: user?.email,
        newEmail,
      });
    } else {
      console.log('Add email:', {
        newEmail,
      });
    }
  }, [hasEmail, user?.email, newEmail]);

  const handleNewEmailChange = useCallback((text: string) => {
    setNewEmail(text);
    console.log('New email changed:', text);
  }, []);

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
    formSection: {
      gap: 12,
    },
    fieldContainer: {
      marginBottom: 12,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
    },
    disabledInput: {
      backgroundColor: colors.muted,
      color: colors.mutedForeground,
    },
    buttonContainer: {
      marginTop: 24,
    },
    updateButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    updateButtonDisabled: {
      backgroundColor: colors.muted,
    },
    updateButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
    },
    updateButtonTextDisabled: {
      color: colors.mutedForeground,
    },
    bottomContainer: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
  });

  const isUpdateDisabled = !newEmail.trim() || (hasEmail && newEmail === user?.email);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title={hasEmail ? "Email Settings" : "Add Email"}
        showBackButton={true}
        onBackPress={() => navigation.navigate('Settings')}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {hasEmail ? 'Email Settings' : 'Add Email'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {hasEmail 
                  ? 'Update your email address and notification preferences'
                  : 'Add an email address to your account for security and notifications'
                }
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              {hasEmail && (
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Current Email</Text>
                  <TextInput
                    style={[styles.textInput, styles.disabledInput]}
                    value={hasEmail ? user.email : 'No email set'}
                    editable={false}
                    selectTextOnFocus={false}
                  />
                </View>
              )}

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {hasEmail ? 'New Email' : 'Email Address'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={hasEmail ? "Enter your new email address" : "Enter your email address"}
                  placeholderTextColor={colors.mutedForeground}
                  value={newEmail}
                  onChangeText={handleNewEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Update Button */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[
                  styles.updateButton,
                  isUpdateDisabled && styles.updateButtonDisabled,
                ]}
                onPress={handleUpdateEmail}
                disabled={isUpdateDisabled}>
                <Text
                  style={[
                    styles.updateButtonText,
                    isUpdateDisabled && styles.updateButtonTextDisabled,
                  ]}>
                  {hasEmail ? 'Update Email' : 'Add Email'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Add some bottom spacing */}
          <View style={{height: 100}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}