import React, {useState} from 'react';
import {View, Text, TextInput, Alert, Linking} from 'react-native';
import {
  Shield,
  ExternalLink,
  Upload,
  FileText,
  Globe,
} from 'lucide-react-native';
import {Card, CardContent} from '../ui/card';
import {Button} from '../ui/button';
import {Badge} from '../ui/badge';
import {Input} from '../ui/input';
import {useThemeStore} from '../../store/themeStore';
import {useBrandManagementStore} from '../../store/brandManagement';
import {BrandVerificationRequest} from '../../types/brand';
import {launchImageLibrary} from 'react-native-image-picker';

interface BrandVerificationProps {
  brandId: string;
  isVerified: boolean;
  onChainVerified: boolean;
}

type VerificationType = BrandVerificationRequest['verificationType'];

export function BrandVerification({
  brandId,
  isVerified,
  onChainVerified,
}: BrandVerificationProps) {
  const {colors} = useThemeStore();
  const {requestVerification, isLoading} = useBrandManagementStore();

  const [selectedType, setSelectedType] = useState<VerificationType>('manual');
  const [verificationData, setVerificationData] = useState<{
    socialMediaUrls: string[];
    websiteUrl: string;
    businessLicense: string;
    additionalInfo: string;
  }>({
    socialMediaUrls: [],
    websiteUrl: '',
    businessLicense: '',
    additionalInfo: '',
  });

  const [socialUrlInput, setSocialUrlInput] = useState('');

  const verificationTypes = [
    {
      type: 'manual' as const,
      title: 'Manual Review',
      description: 'Submit for manual verification by our team',
      icon: Shield,
      requirements: [
        'Valid business information',
        'Active social media presence',
      ],
    },
    {
      type: 'social_media' as const,
      title: 'Social Media',
      description: 'Verify through social media accounts',
      icon: ExternalLink,
      requirements: ['Verified social accounts', 'Consistent branding'],
    },
    {
      type: 'website' as const,
      title: 'Website',
      description: 'Verify through official website',
      icon: Globe,
      requirements: ['Official website', 'Matching brand information'],
    },
    {
      type: 'business_license' as const,
      title: 'Business License',
      description: 'Verify with business registration documents',
      icon: FileText,
      requirements: ['Valid business license', 'Matching business name'],
    },
  ];

  const addSocialUrl = () => {
    if (
      socialUrlInput.trim() &&
      !verificationData.socialMediaUrls.includes(socialUrlInput.trim())
    ) {
      setVerificationData(prev => ({
        ...prev,
        socialMediaUrls: [...prev.socialMediaUrls, socialUrlInput.trim()],
      }));
      setSocialUrlInput('');
    }
  };

  const removeSocialUrl = (urlToRemove: string) => {
    setVerificationData(prev => ({
      ...prev,
      socialMediaUrls: prev.socialMediaUrls.filter(url => url !== urlToRemove),
    }));
  };

  const handleDocumentUpload = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      response => {
        if (response.assets && response.assets[0]) {
          setVerificationData(prev => ({
            ...prev,
            businessLicense: response.assets![0].uri!,
          }));
        }
      },
    );
  };

  const handleSubmitVerification = async () => {
    try {
      // Validate based on verification type
      if (
        selectedType === 'social_media' &&
        verificationData.socialMediaUrls.length === 0
      ) {
        Alert.alert('Error', 'Please add at least one social media URL');
        return;
      }

      if (selectedType === 'website' && !verificationData.websiteUrl.trim()) {
        Alert.alert('Error', 'Please enter your website URL');
        return;
      }

      if (
        selectedType === 'business_license' &&
        !verificationData.businessLicense
      ) {
        Alert.alert('Error', 'Please upload your business license');
        return;
      }

      await requestVerification(brandId, {
        ...verificationData,
        socialMediaUrls:
          verificationData.socialMediaUrls.length > 0
            ? verificationData.socialMediaUrls
            : undefined,
        websiteUrl: verificationData.websiteUrl || undefined,
        businessLicense: verificationData.businessLicense || undefined,
        additionalInfo: verificationData.additionalInfo || undefined,
      });

      Alert.alert(
        'Verification Submitted',
        'Your verification request has been submitted. You will be notified once it has been reviewed.',
        [{text: 'OK'}],
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to submit verification request. Please try again.',
      );
    }
  };

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Unable to open URL');
    }
  };

  if (isVerified) {
    return (
      <Card>
        <CardContent className="p-4">
          <View className="items-center py-6">
            <View className="w-16 h-16 bg-success/10 rounded-full items-center justify-center mb-4">
              <Shield size={32} color={colors.success} />
            </View>
            <Text className="text-lg font-semibold text-foreground mb-2">
              Brand Verified
            </Text>
            <Text className="text-muted-foreground text-center mb-4">
              Your brand has been successfully verified and is eligible for
              enhanced features.
            </Text>
            <View className="flex-row space-x-2">
              <Badge variant="success">
                <Text className="text-xs">Platform Verified</Text>
              </Badge>
              {onChainVerified && (
                <Badge variant="brand">
                  <Text className="text-xs">On-Chain Verified</Text>
                </Badge>
              )}
            </View>
          </View>
        </CardContent>
      </Card>
    );
  }

  return (
    <View className="space-y-4">
      {/* Verification Types */}
      <Card>
        <CardContent className="p-4">
          <Text className="text-lg font-semibold mb-4 text-foreground">
            Choose Verification Method
          </Text>
          <View className="space-y-3">
            {verificationTypes.map(type => {
              const Icon = type.icon;
              return (
                <View
                  key={type.type}
                  className={`p-3 rounded-lg border ${
                    selectedType === type.type
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}>
                  <View className="flex-row items-start">
                    <Icon
                      size={20}
                      color={
                        selectedType === type.type
                          ? colors.primary
                          : colors.mutedForeground
                      }
                      className="mt-1"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="font-semibold text-foreground">
                        {type.title}
                      </Text>
                      <Text className="text-sm text-muted-foreground mb-2">
                        {type.description}
                      </Text>
                      <View className="space-y-1">
                        {type.requirements.map((req, index) => (
                          <Text
                            key={index}
                            className="text-xs text-muted-foreground">
                            • {req}
                          </Text>
                        ))}
                      </View>
                    </View>
                    <Button
                      variant={selectedType === type.type ? 'default' : 'ghost'}
                      size="sm"
                      onPress={() => setSelectedType(type.type)}>
                      <Text
                        className={
                          selectedType === type.type
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground'
                        }>
                        {selectedType === type.type ? 'Selected' : 'Select'}
                      </Text>
                    </Button>
                  </View>
                </View>
              );
            })}
          </View>
        </CardContent>
      </Card>

      {/* Verification Form */}
      <Card>
        <CardContent className="p-4">
          <Text className="text-lg font-semibold mb-4 text-foreground">
            Verification Details
          </Text>

          {/* Social Media URLs */}
          {(selectedType === 'social_media' || selectedType === 'manual') && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Social Media Accounts
              </Text>
              <View className="flex-row items-center space-x-2 mb-2">
                <TextInput
                  className="flex-1 border border-border rounded-lg px-3 py-2 bg-input text-foreground"
                  style={{color: colors.foreground}}
                  placeholder="https://twitter.com/yourbrand"
                  placeholderTextColor={colors.mutedForeground}
                  value={socialUrlInput}
                  onChangeText={setSocialUrlInput}
                  onSubmitEditing={addSocialUrl}
                />
                <Button size="sm" onPress={addSocialUrl}>
                  <Text className="text-primary-foreground">Add</Text>
                </Button>
              </View>
              <View className="space-y-2">
                {verificationData.socialMediaUrls.map((url, index) => (
                  <View
                    key={index}
                    className="flex-row items-center justify-between p-2 bg-muted rounded-lg">
                    <Text
                      className="text-foreground text-sm flex-1"
                      numberOfLines={1}>
                      {url}
                    </Text>
                    <View className="flex-row items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={() => openUrl(url)}>
                        <ExternalLink size={14} color={colors.primary} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={() => removeSocialUrl(url)}>
                        <Text className="text-destructive">×</Text>
                      </Button>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Website URL */}
          {(selectedType === 'website' || selectedType === 'manual') && (
            <View className="mb-4">
              <Input
                label="Official Website"
                value={verificationData.websiteUrl}
                onChangeText={text =>
                  setVerificationData(prev => ({...prev, websiteUrl: text}))
                }
                placeholder="https://yourbrand.com"
              />
            </View>
          )}

          {/* Business License Upload */}
          {(selectedType === 'business_license' ||
            selectedType === 'manual') && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Business License
              </Text>
              <Button
                variant="outline"
                onPress={handleDocumentUpload}
                className="w-full">
                <Upload size={16} color={colors.mutedForeground} />
                <Text className="text-muted-foreground ml-2">
                  {verificationData.businessLicense
                    ? 'Document Uploaded'
                    : 'Upload Document'}
                </Text>
              </Button>
            </View>
          )}

          {/* Additional Information */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-2">
              Additional Information
            </Text>
            <TextInput
              className="border border-border rounded-lg px-3 py-2 bg-input text-foreground min-h-[80px]"
              style={{color: colors.foreground, textAlignVertical: 'top'}}
              placeholder="Provide any additional information that supports your verification request..."
              placeholderTextColor={colors.mutedForeground}
              value={verificationData.additionalInfo}
              onChangeText={text =>
                setVerificationData(prev => ({...prev, additionalInfo: text}))
              }
              multiline
              maxLength={500}
            />
            <Text className="text-xs text-muted-foreground mt-1">
              {verificationData.additionalInfo.length}/500 characters
            </Text>
          </View>

          {/* Submit Button */}
          <Button
            onPress={handleSubmitVerification}
            disabled={isLoading}
            className="w-full">
            <Text className="text-primary-foreground">
              {isLoading ? 'Submitting...' : 'Submit Verification Request'}
            </Text>
          </Button>
        </CardContent>
      </Card>

      {/* Verification Benefits */}
      <Card>
        <CardContent className="p-4">
          <Text className="text-lg font-semibold mb-4 text-foreground">
            Verification Benefits
          </Text>
          <View className="space-y-2">
            {[
              'Verified badge on your brand profile',
              'Enhanced discoverability in search',
              'Access to premium analytics',
              'Priority customer support',
              'Eligibility for brand partnerships',
              'Advanced monetization features',
            ].map((benefit, index) => (
              <View key={index} className="flex-row items-center">
                <View className="w-2 h-2 bg-primary rounded-full mr-3" />
                <Text className="text-foreground text-sm">{benefit}</Text>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
