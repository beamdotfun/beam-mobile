import React, {useState, useCallback} from 'react';
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
import {Check, Mail, AlertCircle} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {AppNavBar} from '../../components/navigation/AppNavBar';

interface PasswordSettingsScreenProps {
  navigation: any;
}

interface PasswordRequirement {
  id: string;
  text: string;
  met: boolean;
}

export default function PasswordSettingsScreen({navigation}: PasswordSettingsScreenProps) {
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
  
  // Local state for form fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');


  const handleUpdatePassword = useCallback(() => {
    console.log('Update password:', {
      currentPassword: currentPassword ? '[REDACTED]' : '',
      newPassword: newPassword ? '[REDACTED]' : '',
      confirmPassword: confirmPassword ? '[REDACTED]' : '',
    });
  }, [currentPassword, newPassword, confirmPassword]);

  const handleCurrentPasswordChange = useCallback((text: string) => {
    setCurrentPassword(text);
    console.log('Current password changed');
  }, []);

  const handleNewPasswordChange = useCallback((text: string) => {
    setNewPassword(text);
    console.log('New password changed');
  }, []);

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text);
    console.log('Confirm password changed');
  }, []);

  // Password requirements validation (static for now)
  const passwordRequirements: PasswordRequirement[] = [
    {
      id: 'length',
      text: 'At least 8 characters',
      met: newPassword.length >= 8,
    },
    {
      id: 'uppercase',
      text: 'At least 1 uppercase letter',
      met: /[A-Z]/.test(newPassword),
    },
    {
      id: 'lowercase',
      text: 'At least 1 lowercase letter',
      met: /[a-z]/.test(newPassword),
    },
    {
      id: 'number',
      text: 'At least 1 number',
      met: /\d/.test(newPassword),
    },
    {
      id: 'special',
      text: 'At least 1 special character',
      met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    },
  ];

  const isUpdateDisabled = 
    !currentPassword.trim() ||
    !newPassword.trim() ||
    !confirmPassword.trim() ||
    newPassword !== confirmPassword ||
    !passwordRequirements.every(req => req.met);

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
    requirementsContainer: {
      marginTop: 8,
      marginBottom: 12,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    requirementBullet: {
      width: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    requirementBulletMet: {
      backgroundColor: '#10B981',
    },
    requirementBulletUnmet: {
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    requirementText: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      flex: 1,
    },
    requirementTextMet: {
      color: '#10B981',
    },
    requirementTextUnmet: {
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
    emailRequiredContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginHorizontal: 16,
      marginTop: 24,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    emailRequiredIcon: {
      marginBottom: 16,
    },
    emailRequiredTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 8,
      textAlign: 'center',
    },
    emailRequiredDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    addEmailButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    addEmailButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title="Password Settings"
        showBackButton={true}
        onBackPress={() => navigation.navigate('Settings')}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {hasEmail ? (
            // Password Change Form for users with email
            <View style={styles.formCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Password</Text>
                <Text style={styles.cardSubtitle}>
                  Update your password to keep your account secure
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.formSection}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Current Password</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your current password"
                    placeholderTextColor={colors.mutedForeground}
                    value={currentPassword}
                    onChangeText={handleCurrentPasswordChange}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>New Password</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your new password"
                    placeholderTextColor={colors.mutedForeground}
                    value={newPassword}
                    onChangeText={handleNewPasswordChange}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  
                  {/* Password Requirements */}
                  <View style={styles.requirementsContainer}>
                    {passwordRequirements.map((requirement) => (
                      <View key={requirement.id} style={styles.requirementItem}>
                        <View
                          style={[
                            styles.requirementBullet,
                            requirement.met
                              ? styles.requirementBulletMet
                              : styles.requirementBulletUnmet,
                          ]}>
                          {requirement.met && (
                            <Check size={10} color="#FFFFFF" strokeWidth={3} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.requirementText,
                            requirement.met
                              ? styles.requirementTextMet
                              : styles.requirementTextUnmet,
                          ]}>
                          {requirement.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm your new password"
                    placeholderTextColor={colors.mutedForeground}
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    secureTextEntry
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
                  onPress={handleUpdatePassword}
                  disabled={isUpdateDisabled}>
                  <Text
                    style={[
                      styles.updateButtonText,
                      isUpdateDisabled && styles.updateButtonTextDisabled,
                    ]}>
                    Update Password
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            // Email Required State for wallet-only accounts
            <View style={styles.emailRequiredContainer}>
              <View style={styles.emailRequiredIcon}>
                <AlertCircle size={48} color={colors.warning || colors.primary} />
              </View>
              
              <Text style={styles.emailRequiredTitle}>
                Email Required
              </Text>
              
              <Text style={styles.emailRequiredDescription}>
                To change your password, you need to add an email address to your account. This helps us verify your identity and keep your account secure.
              </Text>
              
              <Pressable
                style={styles.addEmailButton}
                onPress={() => navigation.navigate('EmailSettings')}>
                <Mail size={16} color={colors.primaryForeground} />
                <Text style={styles.addEmailButtonText}>
                  Add Email Address
                </Text>
              </Pressable>
            </View>
          )}

          {/* Add some bottom spacing */}
          <View style={{height: 100}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}