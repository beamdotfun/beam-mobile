import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
  TextInput,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Camera, Shield, Globe} from 'lucide-react-native';
import {Header} from '../../components/layout/Header';
import {Button} from '../../components/ui/button';
import {Input} from '../../components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {Avatar} from '../../components/ui/avatar';
import {Badge} from '../../components/ui/badge';
import {launchImageLibrary} from 'react-native-image-picker';
import {useAuthStore} from '../../store/auth';
import {useThemeStore} from '../../store/themeStore';
import {AuthStackScreenProps} from '../../types/navigation';
import {ProfileSetupData} from '../../types/auth';

type Props = AuthStackScreenProps<'CreateProfile'>;

export default function CreateProfileScreen({navigation, route}: Props) {
  const {walletAddress, displayName, email} = route.params;
  const {colors} = useThemeStore();
  const {completeProfileSetup, verifyNFT, verifySNS, isLoading} =
    useAuthStore();

  const [profileData, setProfileData] = useState<ProfileSetupData>({
    displayName: displayName || '',
    bio: '',
    profilePicture: undefined,
    email: email || '',
    isPrivate: false,
    allowDirectMessages: true,
    showActivity: true,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [nftMint, setNftMint] = useState('');
  const [snsDomain, setSnsDomain] = useState('');

  const steps = [
    {id: 'basic', title: 'Basic Info', description: 'Tell us about yourself'},
    {
      id: 'verification',
      title: 'Verification',
      description: 'Verify your identity (optional)',
    },
    {
      id: 'privacy',
      title: 'Privacy',
      description: 'Configure your privacy settings',
    },
  ];

  const updateProfileData = (updates: Partial<ProfileSetupData>) => {
    setProfileData(prev => ({...prev, ...updates}));
  };

  const handleSelectProfilePicture = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
      },
      response => {
        if (response.assets && response.assets[0]) {
          updateProfileData({profilePicture: response.assets[0].uri});
        }
      },
    );
  };

  const handleVerifyNFT = async () => {
    if (!nftMint.trim()) {
      Alert.alert('Error', 'Please enter an NFT mint address.');
      return;
    }

    try {
      const verified = await verifyNFT(nftMint.trim());
      if (verified) {
        Alert.alert('Success!', 'NFT verification completed.');
        updateProfileData({nftMintAddress: nftMint.trim()});
      } else {
        Alert.alert('Verification Failed', 'Could not verify NFT ownership.');
      }
    } catch (error) {
      Alert.alert('Error', 'NFT verification failed. Please try again.');
    }
  };

  const handleVerifySNS = async () => {
    if (!snsDomain.trim()) {
      Alert.alert('Error', 'Please enter an SNS domain.');
      return;
    }

    try {
      const verified = await verifySNS(snsDomain.trim());
      if (verified) {
        Alert.alert('Success!', 'SNS domain verification completed.');
        updateProfileData({snsDomain: snsDomain.trim()});
      } else {
        Alert.alert(
          'Verification Failed',
          'Could not verify SNS domain ownership.',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'SNS verification failed. Please try again.');
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!profileData.displayName.trim()) {
      Alert.alert('Error', 'Display name is required.');
      return;
    }

    try {
      await completeProfileSetup(profileData);
      Alert.alert(
        'Welcome to Beam!',
        'Your profile has been created successfully.',
        [
          {
            text: 'Get Started',
            onPress: () => {
              // Navigation will be handled by AppNavigator
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    }
  };

  const renderBasicInfoStep = () => (
    <View className="space-y-6">
      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Text className="text-lg font-semibold text-foreground">
              Profile Picture
            </Text>
          </CardTitle>
        </CardHeader>
        <CardContent className="items-center space-y-4">
          <Avatar
            src={profileData.profilePicture}
            fallback={profileData.displayName.charAt(0) || '?'}
            size="xl"
          />

          <Pressable
            onPress={handleSelectProfilePicture}
            className="flex-row items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
            <Camera size={16} color={colors.primary} />
            <Text className="text-primary font-medium">
              {profileData.profilePicture ? 'Change Photo' : 'Add Photo'}
            </Text>
          </Pressable>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Text className="text-lg font-semibold text-foreground">
              Basic Information
            </Text>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Display Name *"
            value={profileData.displayName}
            onChangeText={text => updateProfileData({displayName: text})}
            placeholder="Your display name"
            maxLength={50}
          />

          <View>
            <Text className="text-foreground text-sm font-medium mb-2">
              Bio
            </Text>
            <TextInput
              className="bg-input text-foreground p-3 rounded-lg min-h-[80px]"
              style={{color: colors.foreground}}
              value={profileData.bio}
              onChangeText={text => updateProfileData({bio: text})}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              maxLength={160}
              textAlignVertical="top"
            />
            <Text className="text-muted-foreground text-xs mt-1 text-right">
              {profileData.bio?.length || 0}/160
            </Text>
          </View>

          <Input
            label="Email (Optional)"
            value={profileData.email}
            onChangeText={text => updateProfileData({email: text})}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </CardContent>
      </Card>
    </View>
  );

  const renderVerificationStep = () => (
    <View className="space-y-6">
      <Text className="text-muted-foreground text-center">
        Verification is optional but helps build trust in the community.
      </Text>

      {/* NFT Verification */}
      <Card>
        <CardHeader>
          <CardTitle>
            <View className="flex-row items-center">
              <Shield size={20} color={colors.primary} />
              <Text className="text-lg font-semibold text-foreground ml-2">
                NFT Verification
              </Text>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Text className="text-muted-foreground text-sm">
            Verify ownership of an NFT to display it on your profile.
          </Text>

          <Input
            label="NFT Mint Address"
            value={nftMint}
            onChangeText={setNftMint}
            placeholder="Enter NFT mint address..."
          />

          <Button
            onPress={handleVerifyNFT}
            variant="outline"
            disabled={!nftMint.trim()}>
            Verify NFT
          </Button>
        </CardContent>
      </Card>

      {/* SNS Verification */}
      <Card>
        <CardHeader>
          <CardTitle>
            <View className="flex-row items-center">
              <Globe size={20} color={colors.primary} />
              <Text className="text-lg font-semibold text-foreground ml-2">
                SNS Domain
              </Text>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Text className="text-muted-foreground text-sm">
            Connect your Solana Name Service domain.
          </Text>

          <Input
            label="SNS Domain"
            value={snsDomain}
            onChangeText={setSnsDomain}
            placeholder="yourname.sol"
          />

          <Button
            onPress={handleVerifySNS}
            variant="outline"
            disabled={!snsDomain.trim()}>
            Verify Domain
          </Button>
        </CardContent>
      </Card>
    </View>
  );

  const renderPrivacyStep = () => (
    <View className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Text className="text-lg font-semibold text-foreground">
              Privacy Settings
            </Text>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-foreground font-medium">
                Private Account
              </Text>
              <Text className="text-muted-foreground text-sm">
                Only followers can see your posts and activity
              </Text>
            </View>
            <Switch
              value={profileData.isPrivate}
              onValueChange={value => updateProfileData({isPrivate: value})}
              trackColor={{
                false: colors.muted,
                true: colors.primary,
              }}
              thumbColor={colors.background}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-foreground font-medium">
                Allow Messages
              </Text>
              <Text className="text-muted-foreground text-sm">
                Let others send you direct messages
              </Text>
            </View>
            <Switch
              value={profileData.allowDirectMessages}
              onValueChange={value =>
                updateProfileData({allowDirectMessages: value})
              }
              trackColor={{
                false: colors.muted,
                true: colors.primary,
              }}
              thumbColor={colors.background}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-foreground font-medium">Show Activity</Text>
              <Text className="text-muted-foreground text-sm">
                Display your activity in your profile
              </Text>
            </View>
            <Switch
              value={profileData.showActivity}
              onValueChange={value => updateProfileData({showActivity: value})}
              trackColor={{
                false: colors.muted,
                true: colors.primary,
              }}
              thumbColor={colors.background}
            />
          </View>
        </CardContent>
      </Card>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header
        title="Create Profile"
        subtitle={`Step ${currentStep + 1} of ${steps.length}`}
        showBackButton={currentStep > 0}
        onBackPress={handleBack}
      />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View className="flex-row mb-6">
          {steps.map((step, index) => (
            <View key={step.id} className="flex-1 flex-row items-center">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}>
                <Text
                  className={`text-sm font-bold ${
                    index <= currentStep
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground'
                  }`}>
                  {index + 1}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View
                  className={`flex-1 h-0.5 ml-2 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </View>
          ))}
        </View>

        {/* Step Content */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            {steps[currentStep].title}
          </Text>
          <Text className="text-muted-foreground mb-6">
            {steps[currentStep].description}
          </Text>

          {currentStep === 0 && renderBasicInfoStep()}
          {currentStep === 1 && renderVerificationStep()}
          {currentStep === 2 && renderPrivacyStep()}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="p-4 border-t border-border">
        <View className="flex-row space-x-3">
          {currentStep > 0 && (
            <Button onPress={handleBack} variant="outline" className="flex-1">
              Back
            </Button>
          )}

          <Button
            onPress={handleNext}
            disabled={
              isLoading ||
              (currentStep === 0 && !profileData.displayName.trim())
            }
            className="flex-1">
            {isLoading
              ? 'Setting up...'
              : currentStep === steps.length - 1
              ? 'Complete Setup'
              : 'Next'}
          </Button>
        </View>

        {currentStep === steps.length - 1 && (
          <Button
            onPress={() => {
              /* Skip verification */
            }}
            variant="ghost"
            className="w-full mt-2">
            Skip for now
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
