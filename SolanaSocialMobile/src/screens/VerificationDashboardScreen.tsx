import React, {useEffect, useState} from 'react';
import {View, ScrollView, Alert, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Shield,
  Star,
  Award,
  Clock,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react-native';
import {useEnhancedVerificationStore} from '../stores/enhancedVerificationStore';
import {
  VerificationLevel,
  UserVerificationStatus,
  VerificationDashboard as VerificationDashboardType,
} from '../types/enhanced-verification';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {Progress} from '../components/ui/progress';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {Badge} from '../components/ui/badge';
import {cn} from '../lib/utils';

export const VerificationDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    userVerification,
    verificationDashboard,
    isLoading,
    error,
    checkVerificationStatus,
    fetchVerificationDashboard,
    startOnboarding,
    claimVerificationBenefit,
    clearError,
  } = useEnhancedVerificationStore();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'benefits' | 'history'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      checkVerificationStatus(),
      fetchVerificationDashboard(),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleStartVerification = () => {
    startOnboarding();
    navigation.navigate('VerificationOnboarding' as never);
  };

  const handleVerifyNFT = () => {
    navigation.navigate('NFTVerification' as never);
  };

  const handleVerifySNS = () => {
    navigation.navigate('SNSVerification' as never);
  };

  if (isLoading && !userVerification) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <LoadingSpinner size="large" />
        <Text className="mt-4 text-gray-600">
          Loading verification status...
        </Text>
      </SafeAreaView>
    );
  }

  const getVerificationLevelColor = (level: VerificationLevel) => {
    switch (level) {
      case 'fully_verified': return 'text-green-600';
      case 'premium_verified': return 'text-purple-600';
      case 'nft_verified': return 'text-blue-600';
      case 'sns_verified': return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getVerificationLevelIcon = (level: VerificationLevel) => {
    switch (level) {
      case 'fully_verified': return Shield;
      case 'premium_verified': return Award;
      case 'nft_verified':
      case 'sns_verified': return CheckCircle2;
      default:
        return Shield;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <Text className="text-xl font-semibold text-gray-900">
            Profile Verification
          </Text>
          <Text className="text-sm text-gray-600">
            Build trust and unlock exclusive features
          </Text>
        </View>

        {/* Verification Status Banner */}
        {userVerification && (
          <View className="bg-white border-b border-gray-200 px-4 py-4">
            <View className="flex-row items-center space-x-3">
              {(() => {
                const LevelIcon = getVerificationLevelIcon(
                  userVerification.verificationLevel,
                );
                return <LevelIcon size={24} color="#3B82F6" />;
              })()}
              <View className="flex-1">
                <Text
                  className={cn(
                    'font-medium text-lg capitalize',
                    getVerificationLevelColor(
                      userVerification.verificationLevel,
                    ),
                  )}>
                  {userVerification.verificationLevel.replace(/_/g, ' ')}
                </Text>
                <View className="flex-row items-center space-x-2 mt-1">
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-600">NFT: </Text>
                    {userVerification.isVerifiedNFT ? (
                      <CheckCircle2 size={14} color="#10B981" />
                    ) : (
                      <Text className="text-sm text-gray-500">
                        Not verified
                      </Text>
                    )}
                  </View>
                  <Text className="text-gray-400">•</Text>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-600">SNS: </Text>
                    {userVerification.isVerifiedSNS ? (
                      <CheckCircle2 size={14} color="#10B981" />
                    ) : (
                      <Text className="text-sm text-gray-500">
                        Not verified
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-blue-600">
                  {userVerification.verificationScore}/100
                </Text>
                <Text className="text-xs text-gray-500">Score</Text>
              </View>
            </View>

            {/* Progress Bar */}
            {verificationDashboard?.verificationSummary && (
              <View className="mt-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-600">
                    Verification Progress
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {
                      verificationDashboard.verificationSummary
                        .completionPercentage
                    }
                    %
                  </Text>
                </View>
                <Progress
                  value={
                    verificationDashboard.verificationSummary
                      .completionPercentage
                  }
                  className="h-2"
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Next:{' '}
                  {verificationDashboard.verificationSummary.nextMilestone}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tab Navigation */}
        <View className="bg-white border-b border-gray-200">
          <View className="flex-row">
            {[
              {id: 'overview', label: 'Overview', icon: Shield},
              {id: 'benefits', label: 'Benefits', icon: Award},
              {id: 'history', label: 'History', icon: Clock},
            ].map(tab => (
              <Button
                key={tab.id}
                variant={selectedTab === tab.id ? 'default' : 'ghost'}
                className={cn(
                  'flex-1 rounded-none',
                  selectedTab === tab.id && 'border-b-2 border-blue-500',
                )}
                onPress={() => setSelectedTab(tab.id as any)}>
                <tab.icon
                  size={16}
                  color={selectedTab === tab.id ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  className={cn(
                    'text-sm ml-2',
                    selectedTab === tab.id
                      ? 'text-white font-medium'
                      : 'text-gray-600',
                  )}>
                  {tab.label}
                </Text>
              </Button>
            ))}
          </View>
        </View>

        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          {selectedTab === 'overview' && (
            <OverviewTab
              userVerification={userVerification}
              dashboard={verificationDashboard}
              onStartVerification={handleStartVerification}
              onVerifyNFT={handleVerifyNFT}
              onVerifySNS={handleVerifySNS}
            />
          )}

          {selectedTab === 'benefits' && (
            <BenefitsTab
              userVerification={userVerification}
              dashboard={verificationDashboard}
              onClaimBenefit={claimVerificationBenefit}
            />
          )}

          {selectedTab === 'history' && (
            <HistoryTab userVerification={userVerification} />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  userVerification: UserVerificationStatus | null;
  dashboard: VerificationDashboardType | null;
  onStartVerification: () => void;
  onVerifyNFT: () => void;
  onVerifySNS: () => void;
}> = ({
  userVerification,
  dashboard,
  onStartVerification,
  onVerifyNFT,
  onVerifySNS,
}) => {
  return (
    <View className="p-4 space-y-4">
      {/* Quick Actions */}
      {dashboard?.quickActions && dashboard.quickActions.length > 0 && (
        <Card className="p-4 bg-white">
          <Text className="font-medium text-lg mb-3 text-gray-900">
            Quick Actions
          </Text>
          <View className="space-y-2">
            {dashboard.quickActions.slice(0, 3).map(action => (
              <Button
                key={action.id}
                variant="outline"
                className="justify-start h-auto py-3"
                onPress={() => {
                  if (action.id === 'verify-nft') {onVerifyNFT();}
                  else if (action.id === 'verify-sns') {onVerifySNS();}
                }}
                disabled={!action.available}>
                <View className="flex-row items-center space-x-3 w-full">
                  <View
                    className={cn(
                      'w-10 h-10 rounded-lg items-center justify-center',
                      action.priority === 'high'
                        ? 'bg-red-100'
                        : action.priority === 'medium'
                        ? 'bg-yellow-100'
                        : 'bg-gray-100',
                    )}>
                    <Text className="text-lg">{action.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">
                      {action.title}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {action.description}
                    </Text>
                  </View>
                </View>
              </Button>
            ))}
          </View>
        </Card>
      )}

      {/* Verification Methods */}
      <Card className="p-4 bg-white">
        <Text className="font-medium text-lg mb-3 text-gray-900">
          Verification Methods

        <View className="space-y-3">
          {/* NFT Verification */}
          <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
            <View className="flex-row items-center space-x-3 flex-1">
              <View
                className={cn(
                  'w-10 h-10 rounded-full items-center justify-center',
                  userVerification?.isVerifiedNFT
                    ? 'bg-green-100'
                    : 'bg-gray-200',
                )}>
                <Text className="text-lg">🖼️</Text>
              </View>
              <View className="flex-1 mr-3">
                <Text className="font-medium text-gray-900">
                  NFT Verification
                </Text>
                <Text className="text-sm text-gray-600">
                  {userVerification?.isVerifiedNFT
                    ? 'Verified with NFT collection' 
                    : 'Verify ownership of NFT'}
                </Text>
                {userVerification?.nftVerification && (
                  <Text className="text-xs text-gray-500 mt-1">
                    {userVerification.nftVerification.nftName ||
                      userVerification.nftVerification.nftMint.slice(0, 8) +
                        '...'}
                  </Text>
                )}
              </View>
            </View>
            {userVerification?.isVerifiedNFT ? (
              <CheckCircle2 size={20} color="#10B981" />
            ) : (
              <Button size="sm" onPress={onVerifyNFT}>
                <Text className="text-white text-sm">Verify</Text>
              </Button>
            )}
          </View>

          {/* SNS Verification */}
          <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
            <View className="flex-row items-center space-x-3 flex-1">
              <View
                className={cn(
                  'w-10 h-10 rounded-full items-center justify-center',
                  userVerification?.isVerifiedSNS
                    ? 'bg-green-100'
                    : 'bg-gray-200',
                )}>
                <Text className="text-lg">🌐</Text>
              </View>
              <View className="flex-1 mr-3">
                <Text className="font-medium text-gray-900">
                  SNS Domain Verification
                </Text>
                <Text className="text-sm text-gray-600">
                  {userVerification?.isVerifiedSNS
                    ? 'Verified with .sol domain' 
                    : 'Verify ownership of .sol domain'}
                </Text>
                {userVerification?.snsVerification && (
                  <Text className="text-xs text-gray-500 mt-1">
                    {userVerification.snsVerification.fullDomain}
                  </Text>
                )}
              </View>
            </View>
            {userVerification?.isVerifiedSNS ? (
              <CheckCircle2 size={20} color="#10B981" />
            ) : (
              <Button size="sm" onPress={onVerifySNS}>
                <Text className="text-white text-sm">Verify</Text>
              </Button>
            )}
          </View>
        </View>

        {!userVerification?.isVerifiedNFT &&
          !userVerification?.isVerifiedSNS && (
            <Button className="mt-4 w-full" onPress={onStartVerification}>
              <Shield size={16} color="#FFFFFF" />
              <Text className="text-white font-medium ml-2">
                Start Verification Process
              </Text>
            </Button>
          )}
      </Card>

      {/* Verification Stats */}
      {userVerification && (
        <Card className="p-4 bg-white">
          <Text className="font-medium text-lg mb-3 text-gray-900">
            Your Verification Stats

          <View className="grid grid-cols-2 gap-4">
            <View className="items-center p-3 bg-gray-50 rounded-lg">
              <Text className="text-2xl font-bold text-blue-600">
                {userVerification.verificationScore}
              </Text>
              <Text className="text-sm text-gray-600">Verification Score</Text>
            </View>

            <View className="items-center p-3 bg-gray-50 rounded-lg">
              <Text className="text-2xl font-bold text-green-600">
                {userVerification.unlockedFeatures?.length || 0}
              </Text>
              <Text className="text-sm text-gray-600">Features Unlocked</Text>
            </View>

            <View className="items-center p-3 bg-gray-50 rounded-lg">
              <Text className="text-2xl font-bold text-purple-600">
                {userVerification.verificationBadges?.length || 0}
              </Text>
              <Text className="text-sm text-gray-600">Badges Earned</Text>
            </View>

            <View className="items-center p-3 bg-gray-50 rounded-lg">
              <Text className="text-2xl font-bold text-orange-600">
                {userVerification.isFullyVerified ? 'Premium' : 'Standard'}
              </Text>
              <Text className="text-sm text-gray-600">Account Level</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Recommendations */}
      {dashboard?.recommendations && dashboard.recommendations.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <Text className="font-medium text-lg mb-3 text-blue-900">
            Recommendations
          </Text>
          {dashboard.recommendations.map(rec => (
            <View key={rec.id} className="mb-3 last:mb-0">
              <Text className="font-medium text-blue-900">{rec.title}</Text>
              <Text className="text-sm text-blue-700">{rec.description}</Text>
              <Text className="text-xs text-blue-600 mt-1">
                {rec.benefit} • {rec.estimatedTime}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
};

// Benefits Tab Component
const BenefitsTab: React.FC<{
  userVerification: UserVerificationStatus | null;
  dashboard: VerificationDashboardType | null;
  onClaimBenefit: (benefitId: string) => void;
}> = ({userVerification, dashboard, onClaimBenefit}) => {
  return (
    <View className="p-4 space-y-4">
      {/* Unlocked Benefits */}
      <Card className="p-4 bg-white">
        <Text className="font-medium text-lg mb-3 text-gray-900">
          Unlocked Benefits

        {userVerification?.unlockedFeatures &&
        userVerification.unlockedFeatures.length > 0 ? (
          <View className="space-y-2">
            {userVerification.unlockedFeatures.map(feature => (
              <View
                key={feature.featureId}
                className="flex-row items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle2 size={16} color="#10B981" />
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">
                    {feature.featureName}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {feature.description}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Unlocked:{' '}
                    {new Date(feature.unlockedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center py-8">
            <Award size={48} color="#9CA3AF" />
            <Text className="text-gray-600 mt-2">No benefits unlocked yet</Text>
            <Text className="text-sm text-gray-500 text-center mt-1">
              Complete verification to unlock exclusive features
            </Text>
          </View>
        )}
      </Card>

      {/* Available Benefits */}
      {dashboard?.recentlyUnlocked && dashboard.recentlyUnlocked.length > 0 && (
        <Card className="p-4 bg-white">
          <Text className="font-medium text-lg mb-3 text-gray-900">
            Available to Claim

          <View className="space-y-3">
            {dashboard.recentlyUnlocked.map(benefit => (
              <View
                key={benefit.id}
                className="flex-row items-center justify-between p-3 bg-blue-50 rounded-lg">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center space-x-2 mb-1">
                    <Text className="text-lg">{benefit.icon}</Text>
                    <Text className="font-medium text-gray-900">
                      {benefit.name}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-600">
                    {benefit.description}
                  </Text>
                  <Text className="text-xs text-blue-600 mt-1">
                    {benefit.value}
                  </Text>
                </View>
                <Button
                  size="sm"
                  onPress={() => onClaimBenefit(benefit.id)}
                  disabled={!benefit.available}>
                  <Text className="text-white text-sm">Claim</Text>
                </Button>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Verification Badges */}
      {userVerification?.verificationBadges &&
        userVerification.verificationBadges.length > 0 && (
          <Card className="p-4 bg-white">
            <Text className="font-medium text-lg mb-3 text-gray-900">
              Verification Badges


            <View className="flex-row flex-wrap gap-3">
              {userVerification.verificationBadges.map(badge => (
                <View
                  key={badge.badgeId}
                  className="items-center p-3 bg-gray-50 rounded-lg min-w-[80px]">
                  <Text className="text-2xl mb-1">{badge.icon}</Text>
                  <Text className="text-xs text-center font-medium text-gray-700">
                    {badge.badgeName}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

      {/* Benefits Information */}
      <Card className="p-4 bg-gray-50">
        <Text className="font-medium text-lg mb-3 text-gray-900">
          How Benefits Work
        </Text>
        <View className="space-y-2">
          <View className="flex-row items-start space-x-2">
            <Text className="text-gray-600">•</Text>
            <Text className="text-sm text-gray-600 flex-1">
              Complete verifications to unlock exclusive features and benefits
            </Text>
          </View>
          <View className="flex-row items-start space-x-2">
            <Text className="text-gray-600">•</Text>
            <Text className="text-sm text-gray-600 flex-1">
              Higher verification levels unlock more valuable benefits
            </Text>
          </View>
          <View className="flex-row items-start space-x-2">
            <Text className="text-gray-600">•</Text>
            <Text className="text-sm text-gray-600 flex-1">
              Some benefits are permanent, while others may require renewal
            </Text>
          </View>
          <View className="flex-row items-start space-x-2">
            <Text className="text-gray-600">•</Text>
            <Text className="text-sm text-gray-600 flex-1">
              Full verification (NFT + SNS) unlocks the maximum benefits
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

// History Tab Component
const HistoryTab: React.FC<{
  userVerification: UserVerificationStatus | null;
}> = ({userVerification}) => {
  return (
    <View className="p-4 space-y-4">
      <Card className="p-4 bg-white">
        <Text className="font-medium text-lg mb-3 text-gray-900">
          Verification Timeline

        <View className="space-y-4">
          {userVerification?.nftVerifiedAt && (
            <View className="flex-row items-start space-x-3">
              <View className="mt-1">
                <View className="w-3 h-3 bg-blue-500 rounded-full" />
                <View className="w-px h-12 bg-gray-300 ml-[5px]" />
              </View>
              <View className="flex-1 pb-4">
                <Text className="font-medium text-gray-900">
                  NFT Verification Completed
                </Text>
                <Text className="text-sm text-gray-600">
                  {new Date(
                    userVerification.nftVerifiedAt,
                  ).toLocaleDateString()}
                </Text>
                {userVerification.nftVerification && (
                  <View className="mt-2 p-2 bg-gray-50 rounded">
                    <Text className="text-xs text-gray-600">
                      NFT:{' '}
                      {userVerification.nftVerification.nftName || 'Unknown'}
                    </Text>
                    {userVerification.nftVerification.collectionName && (
                      <Text className="text-xs text-gray-500">
                        Collection:{' '}
                        {userVerification.nftVerification.collectionName}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          {userVerification?.snsVerifiedAt && (
            <View className="flex-row items-start space-x-3">
              <View className="mt-1">
                <View className="w-3 h-3 bg-orange-500 rounded-full" />
                {!userVerification.nftVerifiedAt && (
                  <View className="w-px h-12 bg-gray-300 ml-[5px]" />
                )}
              </View>
              <View className="flex-1 pb-4">
                <Text className="font-medium text-gray-900">
                  SNS Domain Verification Completed
                </Text>
                <Text className="text-sm text-gray-600">
                  {new Date(
                    userVerification.snsVerifiedAt,
                  ).toLocaleDateString()}
                </Text>
                {userVerification.snsVerification && (
                  <View className="mt-2 p-2 bg-gray-50 rounded">
                    <Text className="text-xs text-gray-600">
                      Domain: {userVerification.snsVerification.fullDomain}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {!userVerification?.nftVerifiedAt &&
            !userVerification?.snsVerifiedAt && (
              <View className="items-center py-8">
                <Clock size={48} color="#9CA3AF" />
                <Text className="text-gray-600 mt-2">
                  No verification history
                </Text>
                <Text className="text-sm text-gray-500 text-center mt-1">
                  Your verification activities will appear here
                </Text>
              </View>
            )}
        </View>
      </Card>

      {/* Verification Score History */}
      <Card className="p-4 bg-white">
        <Text className="font-medium text-lg mb-3 text-gray-900">
          Score Progress
        </Text>
        <View className="space-y-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">Current Score</Text>
            <Text className="font-medium text-gray-900">
              {userVerification?.verificationScore || 0}/100
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">Verification Level</Text>
            <Badge variant="secondary">
              <Text className="text-xs capitalize">
                {userVerification?.verificationLevel.replace(/_/g, ' ') || 'Unverified'}
              </Text>
            </Badge>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">Last Check</Text>
            <Text className="text-sm text-gray-500">
              {userVerification?.lastVerificationCheck
                ? new Date(
                    userVerification.lastVerificationCheck,
                  ).toLocaleDateString()
                : 'Never'}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};
