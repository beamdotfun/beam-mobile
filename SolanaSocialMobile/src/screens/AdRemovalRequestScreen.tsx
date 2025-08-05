import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  Shield,
  DollarSign,
  AlertTriangle,
  Info,
  X,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import {useAdvancedModerationStore} from '../stores/advancedModerationStore';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {Badge} from '../components/ui/badge';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {Textarea} from '../components/ui/textarea';
import {EvidenceCollector} from '../components/moderation/EvidenceCollector';
import {
  RequestRemovalRequest,
  ReportEvidence,
  FlaggedAd,
} from '../types/advanced-moderation';
import {useWalletStore} from '../stores/walletStore';
import {cn} from '../lib/utils';

interface RouteParams {
  flaggedAdId: string;
}

export const AdRemovalRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;

  const {publicKey, balance} = useWalletStore();
  const {
    requestAdRemoval,
    fetchAvailableForRemoval,
    selectedFlaggedAd,
    setSelectedFlaggedAd,
    userDashboard,
    isSubmitting,
    error,
    clearError,
  } = useAdvancedModerationStore();

  const [justification, setJustification] = useState('');
  const [evidence, setEvidence] = useState<ReportEvidence[]>([]);
  const [confirmDeposit, setConfirmDeposit] = useState(false);

  const depositAmount =
    userDashboard?.rewardInformation.currentDepositAmount || 10000000; // 0.01 SOL
  const rewardAmount =
    userDashboard?.rewardInformation.currentRewardAmount || 5000000; // 0.005 SOL

  useEffect(() => {
    if (params.flaggedAdId) {
      // Find the flagged ad from available list
      const flaggedAd = userDashboard?.availableForRemoval.find(
        ad => ad.id === params.flaggedAdId,
      );
      if (flaggedAd) {
        setSelectedFlaggedAd(flaggedAd);
      } else {
        // Fetch if not in cache
        fetchAvailableForRemoval();
      }
    }
  }, [params.flaggedAdId]);

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

  const validateRequest = (): boolean => {
    if (!justification || justification.length < 50) {
      Alert.alert(
        'Invalid Justification',
        'Please provide a detailed justification (at least 50 characters)',
      );
      return false;
    }

    if (balance < depositAmount) {
      Alert.alert(
        'Insufficient Balance',
        `You need at least ${(depositAmount / 1000000000).toFixed(
          3,
        )} SOL to place a deposit`,
      );
      return false;
    }

    if (!confirmDeposit) {
      Alert.alert(
        'Confirm Deposit',
        'Please confirm you understand the deposit requirements',
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateRequest()) {return;}

    if (!selectedFlaggedAd) {
      Alert.alert('Error', 'No flagged ad selected');
      return;
    }

    const request: RequestRemovalRequest = {
      flaggedAdId: selectedFlaggedAd.id,
      justification,
      depositAmount,
      evidence: evidence.map(({id, verified, ...rest}) => rest),
    };

    try {
      const removalRequest = await requestAdRemoval(request);

      Alert.alert(
        'Request Submitted',
        'Your ad removal request has been submitted. The deposit will be held until the request is processed.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error('Failed to submit removal request:', error);
    }
  };

  if (!selectedFlaggedAd) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <LoadingSpinner size="large" />
        <Text className="mt-4 text-gray-600">Loading ad details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-semibold text-gray-900">
              Request Ad Removal
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => navigation.goBack()}>
              <X size={20} color="#6B7280" />
            </Button>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {/* Ad Information */}
          <Card className="p-4 bg-white mb-4">
            <Text className="font-semibold text-lg text-gray-900 mb-3">
              Flagged Advertisement
            </Text>

            <View className="space-y-3">
              <View>
                <Text className="text-sm text-gray-600">Group</Text>
                <Text className="font-medium text-gray-900">
                  {selectedFlaggedAd.groupInfo.groupName}
                </Text>
                <Text className="text-xs text-gray-500">
                  {selectedFlaggedAd.groupInfo.memberCount} members •{' '}
                  {selectedFlaggedAd.groupInfo.activityLevel} activity
                </Text>
              </View>

              <View>
                <Text className="text-sm text-gray-600">Advertiser</Text>
                <Text className="font-medium text-gray-900">
                  {selectedFlaggedAd.advertiserInfo.brandName || 'Unknown'}
                </Text>
                <Text className="text-xs text-gray-500">
                  Reputation:{' '}
                  {selectedFlaggedAd.advertiserInfo.reputation.toFixed(1)} •
                  {selectedFlaggedAd.advertiserInfo.previousViolations}{' '}
                  violations
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-gray-600">Report Count</Text>
                  <Text className="font-medium text-gray-900">
                    {selectedFlaggedAd.reportCount} reports
                  </Text>
                </View>
                <Badge
                  variant={
                    selectedFlaggedAd.priorityLevel === 'urgent' ? 'destructive' :
                    selectedFlaggedAd.priorityLevel === 'high' ? 'warning' :
                    'secondary'
                      : 'secondary'
                  }>
                  <Text className="text-xs capitalize">
                    {selectedFlaggedAd.priorityLevel} Priority
                  </Text>
                </Badge>
              </View>
            </View>
          </Card>

          {/* Deposit Information */}
          <Card className="p-4 bg-blue-50 border-blue-200 mb-4">
            <View className="flex-row items-start space-x-3">
              <Info size={20} color="#2563EB" />
              <View className="flex-1">
                <Text className="font-medium text-blue-900 mb-1">
                  Deposit Required
                </Text>
                <Text className="text-sm text-blue-700 mb-2">
                  A deposit of {(depositAmount / 1000000000).toFixed(3)} SOL is
                  required to request ad removal.
                </Text>
                <View className="space-y-1">
                  <Text className="text-xs text-blue-600">
                    • Deposit returned +{' '}
                    {(rewardAmount / 1000000000).toFixed(3)} SOL reward if
                    approved
                  </Text>
                  <Text className="text-xs text-blue-600">
                    • Deposit forfeited if request is rejected as invalid
                  </Text>
                  <Text className="text-xs text-blue-600">
                    • Processing time: 24-48 hours
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Justification */}
          <Card className="p-4 bg-white mb-4">
            <Text className="font-semibold text-lg text-gray-900 mb-3">
              Removal Justification
            </Text>
            <Text className="text-sm text-gray-600 mb-3">
              Explain why this ad should be removed. Reference specific
              violations and their impact.
            </Text>
            <Textarea
              value={justification}
              onChangeText={setJustification}
              placeholder="This ad should be removed because..."
              className="min-h-[120px]"
              maxLength={500}
            />
            <Text className="text-xs text-gray-500 text-right mt-1">
              {justification.length}/500 characters (min 50)
            </Text>
          </Card>

          {/* Evidence Collection */}
          <Card className="p-4 bg-white mb-4">
            <Text className="font-semibold text-lg text-gray-900 mb-3">
              Supporting Evidence (Optional)
            </Text>
            <Text className="text-sm text-gray-600 mb-3">
              Adding evidence increases the likelihood of approval
            </Text>
            <EvidenceCollector
              onEvidenceAdded={handleAddEvidence}
              currentCount={evidence.length}
              maxItems={3}
            />
          </Card>

          {/* Deposit Confirmation */}
          <Card className="p-4 bg-white mb-4">
            <Button
              variant={confirmDeposit ? 'default' : 'outline'}
              onPress={() => setConfirmDeposit(!confirmDeposit)}
              className="w-full">
              <View className="flex-row items-center space-x-2">
                {confirmDeposit ? (
                  <Check size={16} color="#FFFFFF" />
                ) : (
                  <View className="w-4 h-4 border border-gray-400 rounded" />
                )}
                <Text className={cn('ml-2', confirmDeposit && 'text-white')}>
                  I understand the deposit of{' '}
                  {(depositAmount / 1000000000).toFixed(3)} SOL will be held
                </Text>
              </View>
            </Button>
          </Card>

          {/* Risk Assessment Preview */}
          {selectedFlaggedAd.priorityLevel === 'high' || selectedFlaggedAd.priorityLevel === 'urgent' ? (
            <Card className="p-4 bg-green-50 border-green-200 mb-4">
              <View className="flex-row items-start space-x-3">
                <Shield size={20} color="#059669" />
                <View className="flex-1">
                  <Text className="font-medium text-green-900 mb-1">
                    High Success Probability
                  </Text>
                  <Text className="text-sm text-green-700">
                    This ad has {selectedFlaggedAd.reportCount} reports and is
                    marked as {selectedFlaggedAd.priorityLevel} priority,
                    indicating a strong case for removal.
                  </Text>
                </View>
              </View>
            </Card>
          ) : null}

          {/* Balance Check */}
          <Card className="p-4 bg-gray-50 mb-6">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-600">Your Balance</Text>
              <Text className="font-medium text-gray-900">
                {(balance / 1000000000).toFixed(4)} SOL
              </Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-sm text-gray-600">Required Deposit</Text>
              <Text className="font-medium text-gray-900">
                {(depositAmount / 1000000000).toFixed(3)} SOL
              </Text>
            </View>
            <View className="w-full h-px bg-gray-300 my-2" />
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-600">
                Remaining After Deposit
              </Text>
              <Text
                className={cn(
                  'font-medium',
                  balance - depositAmount >= 0
                    ? 'text-green-600'
                    : 'text-red-600',
                )}>
                {((balance - depositAmount) / 1000000000).toFixed(4)} SOL
              </Text>
            </View>
          </Card>
        </ScrollView>

        {/* Footer */}
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <Button
            onPress={handleSubmit}
            disabled={
              isSubmitting ||
              !justification ||
              justification.length < 50 ||
              !confirmDeposit ||
              balance < depositAmount
            }
            className="w-full">
            {isSubmitting ? (
              <LoadingSpinner size="small" color="#FFFFFF" />
            ) : (
              <>
                <DollarSign size={16} color="#FFFFFF" />
                <Text className="text-white ml-2">
                  Submit Request ({(depositAmount / 1000000000).toFixed(3)} SOL
                  Deposit)
                </Text>
              </>
            )}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
