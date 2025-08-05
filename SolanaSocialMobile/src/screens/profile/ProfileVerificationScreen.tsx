import React, {useState} from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Shield,
  CheckCircle,
  XCircle,
  Upload,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useEnhancedProfileStore} from '../../store/profile-enhanced';
import {useThemeStore} from '../../store/themeStore';
import {VerificationStep} from '../../types/profile-enhanced';
import {Card, CardContent} from '../../components/ui/card';
import {Button} from '../../components/ui/button';
import {Badge} from '../../components/ui/badge';
import {Header} from '../../components/layout/Header';
import {cn} from '../../utils/cn';
import DocumentPicker from 'react-native-document-picker';

export function ProfileVerificationScreen() {
  const {colors} = useThemeStore();
  const {
    verification,
    startVerification,
    submitVerificationStep,
    checkVerificationStatus,
  } = useEnhancedProfileStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');

  const handleStartVerification = async (type: string) => {
    try {
      await startVerification(type);
      setSelectedType(type);
    } catch (error) {
      console.error('Failed to start verification:', error);
      Alert.alert('Error', 'Failed to start verification process');
    }
  };

  const handleDocumentPick = async (stepId: string) => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
      });

      if (result[0]) {
        await handleSubmitStep(stepId, {document: result[0]});
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled the picker
      } else {
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  const handleSubmitStep = async (stepId: string, data: any) => {
    setIsSubmitting(true);
    try {
      await submitVerificationStep(stepId, data);
      Alert.alert('Success', 'Step completed successfully');
    } catch (error) {
      console.error('Failed to submit step:', error);
      Alert.alert('Error', 'Failed to submit verification step');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderVerificationTypes = () => {
    const types = [
      {
        id: 'identity',
        title: 'Identity Verification',
        description: 'Verify your real identity',
        icon: '👤',
        benefits: ['Blue checkmark', 'Priority support', 'Trusted badge'],
      },
      {
        id: 'business',
        title: 'Business Verification',
        description: 'Verify your business account',
        icon: '🏢',
        benefits: ['Business badge', 'Advanced analytics', 'Brand features'],
      },
      {
        id: 'creator',
        title: 'Creator Verification',
        description: 'For content creators and influencers',
        icon: '🎨',
        benefits: ['Creator badge', 'Monetization tools', 'Early access'],
      },
      {
        id: 'developer',
        title: 'Developer Verification',
        description: 'For dApp developers',
        icon: '💻',
        benefits: ['Developer badge', 'API access', 'Technical support'],
      },
    ];

    return (
      <View>
        <Text className="text-2xl font-bold text-foreground mb-2">
          Get Verified
        </Text>
        <Text className="text-muted-foreground mb-6">
          Choose the verification type that best fits your profile
        </Text>

        {types.map(type => (
          <Card key={type.id} className="mb-4">
            <Pressable
              onPress={() => handleStartVerification(type.id)}
              className="p-4">
              <View className="flex-row items-start">
                <Text className="text-4xl mr-4">{type.icon}</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-lg text-foreground mb-1">
                    {type.title}
                  </Text>
                  <Text className="text-sm text-muted-foreground mb-3">
                    {type.description}
                  </Text>
                  <View className="flex-row flex-wrap">
                    {type.benefits.map((benefit, index) => (
                      <View
                        key={index}
                        className="flex-row items-center mr-4 mb-2">
                        <CheckCircle size={14} color={colors.success} />
                        <Text className="text-xs text-foreground ml-1">
                          {benefit}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <ChevronRight size={20} color={colors.muted} />
              </View>
            </Pressable>
          </Card>
        ))}
      </View>
    );
  };

  const renderVerificationSteps = () => {
    const getStepIcon = (step: VerificationStep) => {
      if (step.status === 'completed') {
        return <CheckCircle size={24} color={colors.success} />;
      } else if (step.status === 'pending') {
        return (
          <AlertCircle size={24} color={colors.warning || colors.primary} />
        );
      } else {
        return <View className="w-6 h-6 rounded-full border-2 border-muted" />;
      }
    };

    return (
      <View>
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">
            Verification Steps
          </Text>
          <Shield size={24} color={colors.primary} />
        </View>

        {/* Progress */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-muted-foreground">
              Step {verification.currentStep + 1} of {verification.steps.length}
            </Text>
            <Text className="text-sm font-semibold text-foreground">
              {verification.steps.length > 0
                ? Math.round(
                    (verification.currentStep / verification.steps.length) *
                      100,
                  )
                : 0}
              %
            </Text>
          </View>
          <View className="h-2 bg-muted rounded-full overflow-hidden">
            <View
              className="h-full bg-primary"
              style={{
                width:
                  verification.steps.length > 0
                    ? `${
                        (verification.currentStep / verification.steps.length) *
                        100
                      }%`
                    : '0%',
              }}
            />
          </View>
        </View>

        {/* Steps */}
        {verification.steps.map((step, index) => (
          <Card key={step.id} className="mb-4">
            <Pressable
              onPress={() => {
                if (
                  step.status === 'incomplete' &&
                  index <= verification.currentStep
                ) {
                  // Handle step interaction based on type
                  if (step.type === 'document') {
                    handleDocumentPick(step.id);
                  }
                }
              }}
              disabled={
                step.status === 'completed' || index > verification.currentStep
              }
              className="p-4">
              <View className="flex-row items-start">
                <View className="mr-4">{getStepIcon(step)}</View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text
                      className={cn(
                        'font-semibold text-foreground',
                        step.status === 'completed' && 'text-muted-foreground',
                      )}>
                      {step.title}
                    </Text>
                    {step.required && (
                      <Badge variant="secondary">
                        <Text className="text-xs">Required</Text>
                      </Badge>
                    )}
                  </View>
                  <Text className="text-sm text-muted-foreground mb-2">
                    {step.description}
                  </Text>

                  {step.status === 'incomplete' &&
                    index === verification.currentStep && (
                      <View className="mt-2">
                        {step.type === 'document' && (
                          <Button
                            onPress={() => handleDocumentPick(step.id)}
                            disabled={isSubmitting}>
                            <View className="flex-row items-center">
                              <Upload
                                size={16}
                                color={colors.primaryForeground}
                              />
                              <Text className="text-primary-foreground ml-2">
                                Upload Document
                              </Text>
                            </View>
                          </Button>
                        )}
                        {step.type === 'social' && (
                          <Button
                            onPress={() =>
                              handleSubmitStep(step.id, {verified: true})
                            }
                            disabled={isSubmitting}>
                            <Text className="text-primary-foreground">
                              Connect Social Account
                            </Text>
                          </Button>
                        )}
                        {step.type === 'payment' && (
                          <Button
                            onPress={() =>
                              handleSubmitStep(step.id, {paid: true})
                            }
                            disabled={isSubmitting}>
                            <Text className="text-primary-foreground">
                              Complete Payment
                            </Text>
                          </Button>
                        )}
                      </View>
                    )}
                </View>
              </View>
            </Pressable>
          </Card>
        ))}

        {/* Benefits */}
        {verification.benefits && verification.benefits.length > 0 && (
          <Card className="mt-6 p-4">
            <Text className="font-semibold text-foreground mb-3">
              Verification Benefits
            </Text>
            {verification.benefits.map((benefit, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <CheckCircle size={16} color={colors.success} />
                <Text className="text-sm text-foreground ml-2">{benefit}</Text>
              </View>
            ))}
          </Card>
        )}
      </View>
    );
  };

  const renderVerificationStatus = () => {
    const statusConfig = {
      unverified: {
        icon: <Shield size={48} color={colors.muted} />,
        title: 'Not Verified',
        description: 'Start the verification process to unlock benefits',
        action: 'Get Started',
      },
      pending: {
        icon: (
          <AlertCircle size={48} color={colors.warning || colors.primary} />
        ),
        title: 'Verification Pending',
        description: 'Your verification is being reviewed',
        action: 'Check Status',
      },
      verified: {
        icon: <CheckCircle size={48} color={colors.success} />,
        title: 'Verified',
        description: verification.expiresAt
          ? `Verified until ${new Date(
              verification.expiresAt,
            ).toLocaleDateString()}`
          : 'Your account is verified',
        action: 'View Benefits',
      },
      rejected: {
        icon: <XCircle size={48} color={colors.destructive} />,
        title: 'Verification Rejected',
        description: 'Your verification was not approved',
        action: 'Try Again',
      },
    };

    const config = statusConfig[verification.status];

    return (
      <View className="flex-1 items-center justify-center py-20">
        {config.icon}
        <Text className="text-2xl font-bold text-foreground mt-4 mb-2">
          {config.title}
        </Text>
        <Text className="text-muted-foreground text-center px-8 mb-6">
          {config.description}
        </Text>
        <Button
          onPress={() => {
            if (
              verification.status === 'unverified' ||
              verification.status === 'rejected'
            ) {
              // Reset to show verification types
              setSelectedType('');
            } else if (verification.status === 'pending') {
              checkVerificationStatus();
            }
          }}>
          <Text className="text-primary-foreground">{config.action}</Text>
        </Button>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Verification" showBackButton />

      <ScrollView className="flex-1">
        <View className="p-4">
          {verification.status === 'unverified' &&
            !selectedType &&
            renderVerificationTypes()}
          {verification.status === 'pending' &&
            verification.steps.length > 0 &&
            renderVerificationSteps()}
          {(verification.status === 'verified' ||
            verification.status === 'rejected') &&
            renderVerificationStatus()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
