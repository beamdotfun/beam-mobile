import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {X} from 'lucide-react-native';
// Note: Using a simple View as slider placeholder since @react-native-community/slider may not be installed
// import Slider from '@react-native-community/slider';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
import {AppNavBar} from '../../components/navigation/AppNavBar';

const SLIDER_WIDTH = Dimensions.get('window').width - 64; // Account for padding
const THUMB_SIZE = 20;
const MIN_REP = -420; // Minimum reputation value
const MAX_REP = 10000; // Maximum reputation value

// Define reputation breakpoints with smaller increments on the left, larger on the right
const REPUTATION_BREAKPOINTS = [
  { value: -420, position: 0.0 },    // Start: -420
  { value: -200, position: 0.15 },   // Small increments: -420 to -200 (220 range over 15%)
  { value: -50, position: 0.25 },    // Small increments: -200 to -50 (150 range over 10%)
  { value: 0, position: 0.35 },      // Small increments: -50 to 0 (50 range over 10%)
  { value: 100, position: 0.45 },    // Medium increments: 0 to 100 (100 range over 10%)
  { value: 500, position: 0.55 },    // Medium increments: 100 to 500 (400 range over 10%)
  { value: 1000, position: 0.65 },   // Medium increments: 500 to 1000 (500 range over 10%)
  { value: 2500, position: 0.75 },   // Large increments: 1000 to 2500 (1500 range over 10%)
  { value: 5000, position: 0.85 },   // Large increments: 2500 to 5000 (2500 range over 10%)
  { value: 10000, position: 1.0 },   // End: 5000 to 10000 (5000 range over 15%)
];

interface FeedSettingsScreenProps {
  navigation: any;
}

export default function FeedSettingsScreen({navigation}: FeedSettingsScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {currentProfile} = useProfileStore();
  
  // Get the most complete profile data available
  const profileData = currentProfile || user;
  
  // DETAILED LOGGING: Log all available user data for feed settings
  console.log('🔍 FeedSettingsScreen: Data available:');
  console.log('  - user from auth store:', JSON.stringify(user, null, 2));
  console.log('  - currentProfile from profile store:', JSON.stringify(currentProfile, null, 2));
  console.log('  - final profileData:', JSON.stringify(profileData, null, 2));
  
  // Local state for form fields with proper prepopulation
  const [minRep, setMinRep] = useState(
    currentProfile?.repFilter || user?.repFilter || 0
  );
  const [mutedUserInput, setMutedUserInput] = useState('');
  const [mutedUsers, setMutedUsers] = useState<string[]>(
    currentProfile?.mutedUsers || user?.mutedUsers || []
  );
  const [mutedWordInput, setMutedWordInput] = useState('');
  const [mutedWords, setMutedWords] = useState<string[]>(
    currentProfile?.mutedWords || user?.mutedWords || []
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Convert reputation value to slider position using breakpoints
  const repToPosition = useCallback((rep: number) => {
    const clampedRep = Math.max(MIN_REP, Math.min(rep, MAX_REP));
    
    // Find the appropriate breakpoint range
    for (let i = 0; i < REPUTATION_BREAKPOINTS.length - 1; i++) {
      const current = REPUTATION_BREAKPOINTS[i];
      const next = REPUTATION_BREAKPOINTS[i + 1];
      
      if (clampedRep >= current.value && clampedRep <= next.value) {
        // Linear interpolation within this segment
        const segmentProgress = (clampedRep - current.value) / (next.value - current.value);
        const position = current.position + segmentProgress * (next.position - current.position);
        return position * SLIDER_WIDTH;
      }
    }
    
    // Fallback to last position if somehow we didn't find a range
    return REPUTATION_BREAKPOINTS[REPUTATION_BREAKPOINTS.length - 1].position * SLIDER_WIDTH;
  }, []);

  // Convert slider position to reputation value using breakpoints
  const positionToRep = useCallback((position: number) => {
    const clampedPosition = Math.max(0, Math.min(position, SLIDER_WIDTH));
    const percentage = clampedPosition / SLIDER_WIDTH;
    
    // Find the appropriate breakpoint range
    for (let i = 0; i < REPUTATION_BREAKPOINTS.length - 1; i++) {
      const current = REPUTATION_BREAKPOINTS[i];
      const next = REPUTATION_BREAKPOINTS[i + 1];
      
      if (percentage >= current.position && percentage <= next.position) {
        // Linear interpolation within this segment
        const segmentProgress = (percentage - current.position) / (next.position - current.position);
        const value = current.value + segmentProgress * (next.value - current.value);
        return Math.round(value);
      }
    }
    
    // Fallback
    return percentage <= 0.5 ? MIN_REP : MAX_REP;
  }, []);

  // Slider animation and gesture handling
  const thumbPosition = useRef(new Animated.Value(repToPosition(minRep))).current;
  const sliderRef = useRef<View>(null);

  // Update thumb position when minRep changes
  useEffect(() => {
    const position = repToPosition(minRep);
    Animated.timing(thumbPosition, {
      toValue: position,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [minRep, thumbPosition, repToPosition]);

  // Create PanResponder for slider interaction
  const startPosition = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        // Store starting position for drag calculations
        startPosition.current = repToPosition(minRep);
        
        // Handle tap to position
        const locationX = evt.nativeEvent.locationX;
        const newRep = positionToRep(locationX);
        setMinRep(newRep);
      },
      
      onPanResponderMove: (evt, gestureState) => {
        // Handle drag - add gesture distance to start position
        const newPosition = Math.max(0, Math.min(startPosition.current + gestureState.dx, SLIDER_WIDTH));
        const newRep = positionToRep(newPosition);
        
        // Update immediately for smooth feedback
        thumbPosition.setValue(newPosition);
        setMinRep(newRep);
      },
      
      onPanResponderRelease: () => {
        // Optional: Add haptic feedback here if react-native-haptic-feedback is available
        console.log('🔍 FeedSettingsScreen: Slider value set to:', minRep);
      },
    })
  ).current;

  // Update form fields when profile data loads/changes OR when user data is available
  useEffect(() => {
    console.log('🔍 FeedSettingsScreen: useEffect triggered');
    console.log('  - currentProfile exists:', !!currentProfile);
    console.log('  - user exists:', !!user);
    
    // Use currentProfile data if available, otherwise fall back to user data
    const newMinRep = currentProfile?.repFilter || user?.repFilter || 0;
    const newMutedUsers = currentProfile?.mutedUsers || user?.mutedUsers || [];
    const newMutedWords = currentProfile?.mutedWords || user?.mutedWords || [];
    
    console.log('🔍 FeedSettingsScreen: Setting form values from', currentProfile ? 'currentProfile' : 'user data');
    console.log('  - minRep:', newMinRep);
    console.log('  - mutedUsers:', newMutedUsers);
    console.log('  - mutedWords:', newMutedWords);
    
    setMinRep(newMinRep);
    setMutedUsers(newMutedUsers);
    setMutedWords(newMutedWords);
  }, [currentProfile, user?.repFilter, user?.mutedUsers, user?.mutedWords]);

  const handleSaveChanges = useCallback(async () => {
    setSaving(true);
    setSaveMessage('');
    
    try {
      console.log('Saving feed settings:', {
        minRep,
        mutedUsers,
        mutedWords,
      });
      
      // Update the profile with new feed settings
      const updateProfile = useProfileStore.getState().updateProfile;
      const success = await updateProfile({
        repFilter: minRep,
        mutedUsers: mutedUsers,
        mutedWords: mutedWords,
      });
      
      if (success) {
        setSaveMessage('Feed settings saved successfully');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save feed settings');
      }
    } catch (error) {
      console.error('Error saving feed settings:', error);
      setSaveMessage('Failed to save feed settings');
    } finally {
      setSaving(false);
    }
  }, [minRep, mutedUsers, mutedWords]);

  const handleAddMutedUser = useCallback(() => {
    const trimmed = mutedUserInput.trim();
    if (trimmed && !mutedUsers.includes(trimmed)) {
      setMutedUsers([...mutedUsers, trimmed]);
      setMutedUserInput('');
      console.log('Added muted user:', trimmed);
    }
  }, [mutedUserInput, mutedUsers]);

  const handleRemoveMutedUser = useCallback((user: string) => {
    setMutedUsers(mutedUsers.filter(u => u !== user));
    console.log('Removed muted user:', user);
  }, [mutedUsers]);

  const handleAddMutedWord = useCallback(() => {
    const trimmed = mutedWordInput.trim();
    if (trimmed && !mutedWords.includes(trimmed)) {
      setMutedWords([...mutedWords, trimmed]);
      setMutedWordInput('');
      console.log('Added muted word:', trimmed);
    }
  }, [mutedWordInput, mutedWords]);

  const handleRemoveMutedWord = useCallback((word: string) => {
    setMutedWords(mutedWords.filter(w => w !== word));
    console.log('Removed muted word:', word);
  }, [mutedWords]);

  const formatReputation = (value: number) => {
    if (value === 0) return 'None';
    if (value < 0) return value.toString(); // Show negative values as-is
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

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
      marginBottom: 24,
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
    sliderContainer: {
      marginBottom: 16,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    sliderLabelLeft: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
    },
    sliderLabelRight: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    sliderTrack: {
      height: 4,
      borderRadius: 2,
      position: 'relative',
      marginVertical: 16, // Add more space for touch target
    },
    sliderProgress: {
      height: '100%',
      borderRadius: 2,
      position: 'absolute',
      left: 0,
      top: 0,
    },
    sliderThumb: {
      position: 'absolute',
      top: -8,
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      marginLeft: -THUMB_SIZE / 2,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    sliderHint: {
      fontSize: 12,
      marginTop: 8,
      textAlign: 'center',
    },
    infoBar: {
      backgroundColor: colors.primary + '15',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginTop: 8,
    },
    infoBarText: {
      fontSize: 14,
      color: colors.primary,
      fontFamily: 'Inter-Regular',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 24,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
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
      flex: 1,
    },
    addButton: {
      width: 80,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderRadius: 16,
      paddingVertical: 6,
      paddingLeft: 12,
      paddingRight: 8,
    },
    chipText: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      marginRight: 6,
    },
    chipRemoveButton: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      fontStyle: 'italic',
    },
    saveButtonContainer: {
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
      backgroundColor: colors.muted,
    },
    saveMessage: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginBottom: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveMessageSuccess: {
      backgroundColor: colors.success + '20',
    },
    saveMessageError: {
      backgroundColor: colors.destructive + '20',
    },
    saveMessageText: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
    },
    saveMessageTextSuccess: {
      color: colors.success,
    },
    saveMessageTextError: {
      color: colors.destructive,
    },
  });

  const renderChip = (item: string, onRemove: (item: string) => void) => (
    <View key={item} style={styles.chip}>
      <Text style={styles.chipText}>{item}</Text>
      <Pressable
        style={styles.chipRemoveButton}
        onPress={() => onRemove(item)}>
        <X size={14} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title="Feed Settings"
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
              <Text style={styles.cardTitle}>Feed Preferences</Text>
              <Text style={styles.cardSubtitle}>
                Customize what appears in your feed
              </Text>
            </View>

            {/* Reputation Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Reputation Filter</Text>
              <Text style={styles.sectionCaption}>
                Set minimum reputation to filter posts by user credibility
              </Text>
              
              <View style={styles.sliderContainer}>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelLeft}>
                    Minimum Reputation: {formatReputation(minRep)}
                  </Text>
                  <Text style={styles.sliderLabelRight}>
                    Showing all users
                  </Text>
                </View>
                
                {/* Interactive Reputation Slider */}
                <View style={styles.sliderContainer}>
                  <View 
                    ref={sliderRef}
                    style={[styles.sliderTrack, {backgroundColor: colors.muted, width: SLIDER_WIDTH}]}
                    {...panResponder.panHandlers}
                  >
                    <View 
                      style={[
                        styles.sliderProgress, 
                        {
                          backgroundColor: colors.primary,
                          width: `${(repToPosition(minRep) / SLIDER_WIDTH) * 100}%`
                        }
                      ]} 
                    />
                    <Animated.View
                      style={[
                        styles.sliderThumb,
                        {
                          backgroundColor: colors.primary,
                          transform: [{ translateX: thumbPosition }],
                          shadowColor: colors.foreground,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          elevation: 4,
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.sliderHint, {color: colors.mutedForeground}]}>
                    Tap or drag to adjust minimum reputation
                  </Text>
                </View>
              </View>

              <View style={styles.infoBar}>
                <Text style={styles.infoBarText}>
                  {minRep === 0
                    ? 'Showing posts from all users regardless of reputation'
                    : minRep < 0
                    ? `Showing posts from users with ${formatReputation(minRep)}+ reputation (including negative reputation users)`
                    : `Showing posts from users with ${formatReputation(minRep)}+ reputation`}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Muted Users */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Muted Users</Text>
              <Text style={styles.sectionCaption}>
                Hide posts from specific users in your feed
              </Text>
              
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter username or .sol domain"
                  placeholderTextColor={colors.mutedForeground}
                  value={mutedUserInput}
                  onChangeText={setMutedUserInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={handleAddMutedUser}
                />
                <Pressable
                  style={styles.addButton}
                  onPress={handleAddMutedUser}
                  disabled={!mutedUserInput.trim()}>
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              </View>

              {mutedUsers.length > 0 ? (
                <View style={styles.chipContainer}>
                  {mutedUsers.map(user => renderChip(user, handleRemoveMutedUser))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No muted users.</Text>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Muted Words */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Muted Words</Text>
              <Text style={styles.sectionCaption}>
                Hide posts containing specific words or phrases
              </Text>
              
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter word or phrase to mute"
                  placeholderTextColor={colors.mutedForeground}
                  value={mutedWordInput}
                  onChangeText={setMutedWordInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={handleAddMutedWord}
                />
                <Pressable
                  style={styles.addButton}
                  onPress={handleAddMutedWord}
                  disabled={!mutedWordInput.trim()}>
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              </View>

              {mutedWords.length > 0 ? (
                <View style={styles.chipContainer}>
                  {mutedWords.map(word => renderChip(word, handleRemoveMutedWord))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No muted words.</Text>
              )}
            </View>

            {/* Save Button Section */}
            <View style={styles.saveButtonContainer}>
              {/* Save Message */}
              {saveMessage && (
                <View style={[
                  styles.saveMessage,
                  saveMessage.includes('successfully') ? styles.saveMessageSuccess : styles.saveMessageError
                ]}>
                  <Text style={[
                    styles.saveMessageText,
                    saveMessage.includes('successfully') ? styles.saveMessageTextSuccess : styles.saveMessageTextError
                  ]}>
                    {saveMessage}
                  </Text>
                </View>
              )}
              
              <Pressable 
                style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                onPress={handleSaveChanges}
                disabled={saving}>
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
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