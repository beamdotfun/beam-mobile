import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform as RNPlatform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  Camera,
  Image as ImageIcon,
  Link,
  FileText,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react-native';
import {useAdvancedModerationStore} from '../stores/advancedModerationStore';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {Badge} from '../components/ui/badge';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {Input} from '../components/ui/input';
import {Textarea} from '../components/ui/textarea';
import {Select} from '../components/ui/select';
import {EvidenceCollector} from '../components/moderation/EvidenceCollector';
import {ReportCategorySelector} from '../components/moderation/ReportCategorySelector';
import {
  ReportTemplate,
  ReportEvidence,
  SubmitReportRequest,
} from '../types/advanced-moderation';
import {useWalletStore} from '../stores/walletStore';
import {cn} from '../lib/utils';
import * as ImagePicker from 'react-native-image-picker';

interface RouteParams {
  groupId?: string;
  advertiserWallet?: string;
  reportTemplate?: ReportTemplate;
}

export const AdvancedReportingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;

  const {publicKey} = useWalletStore();
  const {
    submitAdvancedReport,
    uploadEvidence,
    validateEvidence,
    isSubmitting,
    isUploadingEvidence,
    error,
    clearError,
  } = useAdvancedModerationStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [reportReason, setReportReason] = useState('');
  const [evidence, setEvidence] = useState<ReportEvidence[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Pre-fill if template provided
  useEffect(() => {
    if (params.reportTemplate) {
      setSelectedCategoryId(params.reportTemplate.categoryId);
      setReportReason(params.reportTemplate.suggestedReason);
    }
  }, [params.reportTemplate]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleAddEvidence = (
    newEvidence: Omit<ReportEvidence, 'id' | 'verified'>,
  ) => {
    const evidenceItem: ReportEvidence = {
      ...newEvidence,
      id: `evidence-${Date.now()}`,
      verified: false,
    };
    setEvidence([...evidence, evidenceItem]);
  };

  const handleRemoveEvidence = (id: string) => {
    setEvidence(evidence.filter(e => e.id !== id));
  };

  const handleImagePicker = () => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.8,
    };

    ImagePicker.launchImageLibrary(options, async response => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.base64) {
          handleAddEvidence({
            type: 'screenshot',
            data: `data:${asset.type};base64,${asset.base64}`,
            description: 'Screenshot evidence',
            timestamp: new Date().toISOString(),
          });
        }
      }
    });
  };

  const handleCamera = () => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.8,
    };

    ImagePicker.launchCamera(options, async response => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.base64) {
          handleAddEvidence({
            type: 'screenshot',
            data: `data:${asset.type};base64,${asset.base64}`,
            description: 'Photo evidence',
            timestamp: new Date().toISOString(),
          });
        }
      }
    });
  };

  const handleNextStep = async () => {
    if (currentStep === 1 && !selectedCategoryId) {
      Alert.alert('Missing Information', 'Please select a report category');
      return;
    }

    if (currentStep === 2 && reportReason.length < 20) {
      Alert.alert('Missing Information', 'Please provide a detailed reason (at least 20 characters)');
      return;
    }

    if (currentStep === 3) {
      // Validate evidence before submission
      setIsValidating(true);
      const isValid = await validateEvidence(evidence);
      setIsValidating(false);

      if (!isValid) {
        Alert.alert('Invalid Evidence', 'Please ensure all evidence is complete and valid');
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!publicKey || !params.groupId || !params.advertiserWallet) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    const reportRequest: SubmitReportRequest = {
      reporterWallet: publicKey,
      groupId: params.groupId,
      advertiserWallet: params.advertiserWallet,
      categoryId: selectedCategoryId,
      reason: reportReason,
      evidence: evidence.map(({id, verified, ...rest}) => rest),
    };

    try {
      const report = await submitAdvancedReport(reportRequest);

      Alert.alert(
        'Report Submitted',
        'Your report has been submitted successfully and will be reviewed soon.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error('Failed to submit report:', error);
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-between mb-6 px-4">
      {[1, 2, 3, 4].map(step => (
        <View key={step} className="flex-1 flex-row items-center">
          <View
            className={cn(
              'w-8 h-8 rounded-full items-center justify-center',
              currentStep >= step ? 'bg-blue-500' : 'bg-gray-300'
            )}>
            {currentStep > step ? (
              <Check size={16} color="#FFFFFF" />
            ) : (
              <Text
                className={cn(
                  'text-sm font-medium',
                  currentStep >= step ? 'text-white' : 'text-gray-600',
                )}>
                {step}
              </Text>
            )}
          </View>
          {step < 4 && (
            <View
              className={cn(
                'flex-1 h-1 ml-2',
                currentStep > step ? 'bg-blue-500' : 'bg-gray-300'
              )}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Select Report Category
            </Text>
            <ReportCategorySelector
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          </View>
        );

      case 2:
        return (
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Describe the Issue
            </Text>
            <Card className="p-4 bg-blue-50 border-blue-200">
              <Text className="text-sm text-blue-700">
                Provide specific details about why you're reporting this
                content. Include dates, frequencies, and any patterns you've
                noticed.
              </Text>
            </Card>
            <Textarea
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="Explain in detail why this content violates community guidelines..."
              className="min-h-[150px]"
              maxLength={500}
            />
            <Text className="text-sm text-gray-500 text-right">
              {reportReason.length}/500 characters
            </Text>
          </View>
        );

      case 3:
        return (
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Add Evidence
            </Text>
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <Text className="text-sm text-yellow-700">
                Strong evidence increases the likelihood of successful
                moderation. Include screenshots, URLs, or blockchain
                transactions.
              </Text>
            </Card>

            <View className="space-y-3">
              {/* Evidence Collection Buttons */}
              <View className="flex-row space-x-2">
                <Button
                  variant="outline"
                  onPress={handleImagePicker}
                  disabled={isUploadingEvidence}
                  className="flex-1">
                  <ImageIcon size={16} />
                  <Text className="ml-2">Gallery</Text>
                </Button>

                <Button
                  variant="outline"
                  onPress={handleCamera}
                  disabled={isUploadingEvidence}
                  className="flex-1">
                  <Camera size={16} />
                  <Text className="ml-2">Camera</Text>
                </Button>
              </View>

              {/* Manual Evidence Input */}
              <View className="space-y-2">
                <Input
                  placeholder="Add URL evidence"
                  onSubmitEditing={e => {
                    const url = e.nativeEvent.text;
                    if (url) {
                      handleAddEvidence({
                        type: 'url',
                        data: url,
                        description: 'Related URL',
                        timestamp: new Date().toISOString(),
                      });
                      e.currentTarget.clear();
                    }
                  }}
                />
              </View>

              {/* Evidence List */}
              {evidence.length > 0 && (
                <View className="space-y-2">
                  <Text className="font-medium text-gray-700">
                    Added Evidence ({evidence.length})
                  </Text>
                  {evidence.map(item => (
                    <EvidenceItem
                      key={item.id}
                      evidence={item}
                      onRemove={() => handleRemoveEvidence(item.id)}
                    />
                  ))}
                </View>
              )}

              {isUploadingEvidence && (
                <View className="items-center py-4">
                  <LoadingSpinner size="small" />
                  <Text className="text-sm text-gray-600 mt-2">
                    Uploading evidence...
                  </Text>
                </View>
              )}
            </View>
          </View>
        );

      case 4:
        return (
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Review Your Report
            </Text>

            <Card className="p-4 space-y-3">
              <View>
                <Text className="text-sm text-gray-600">Category</Text>
                <Badge variant="secondary" className="mt-1 w-fit">
                  <Text className="text-xs">{selectedCategoryId}</Text>
                </Badge>
              </View>

              <View>
                <Text className="text-sm text-gray-600">Reason</Text>
                <Text className="text-gray-900 mt-1">{reportReason}</Text>
              </View>

              <View>
                <Text className="text-sm text-gray-600">Evidence Provided</Text>
                <Text className="text-gray-900 mt-1">
                  {evidence.length} items
                </Text>

              <View>
                <Text className="text-sm text-gray-600">Reported Content</Text>
                <Text className="text-gray-900 mt-1">
                  Group: {params.groupId}
                </Text>
                <Text className="text-gray-500 text-sm">
                  Advertiser: {params.advertiserWallet?.slice(0, 8)}...
                </Text>
              </View>
            </Card>

            <Card className="p-4 bg-green-50 border-green-200">
              <View className="flex-row items-start space-x-2">
                <Check size={16} color="#059669" />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-green-800">
                    Ready to Submit
                  </Text>
                  <Text className="text-xs text-green-700 mt-1">
                    Your report will be reviewed by our moderation team and
                    processed within 24-48 hours.
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-semibold text-gray-900">
              Report Content
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => navigation.goBack()}>
              <X size={20} color="#6B7280" />
            </Button>
          </View>
        </View>

        {/* Step Indicator */}
        <View className="bg-white pb-4 pt-6">{renderStepIndicator()}</View>

        {/* Content */}
        <ScrollView className="flex-1 px-4 py-4">
          {renderStepContent()}
        </ScrollView>

        {/* Footer */}
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <View className="flex-row space-x-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onPress={handlePreviousStep}
                className="flex-1">
                <Text>Back</Text>
              </Button>
            )}

            {currentStep < 4 ? (
              <Button
                onPress={handleNextStep}
                disabled={isValidating}
                className="flex-1">
                {isValidating ? (
                  <LoadingSpinner size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white">Next</Text>
                )}
              </Button>
            ) : (
              <Button
                onPress={handleSubmit}
                disabled={isSubmitting}
                className="flex-1">
                {isSubmitting ? (
                  <LoadingSpinner size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white">Submit Report</Text>
                )}
              </Button>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Evidence Item Component
const EvidenceItem: React.FC<{
  evidence: ReportEvidence;
  onRemove: () => void;
}> = ({evidence, onRemove}) => {
  const getIcon = () => {
    switch (evidence.type) {
      case 'screenshot':
        return ImageIcon;
      case 'url':
        return Link;
      case 'blockchain_tx':
        return FileText;
      default:
        return FileText;
    }
  };

  const Icon = getIcon();

  return (
    <Card className="p-3 bg-gray-50">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-3 flex-1">
          <Icon size={20} color="#6B7280" />
          <View className="flex-1">
            <Text
              className="text-sm font-medium text-gray-900"
              numberOfLines={1}>
              {evidence.description || evidence.type}
            </Text>
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              {evidence.type === 'url' ? evidence.data : 'Evidence attached'}
            </Text>
          </View>
        </View>
        <Button variant="ghost" size="sm" onPress={onRemove}>
          <X size={16} color="#EF4444" />
        </Button>
      </View>
    </Card>
  );
};
