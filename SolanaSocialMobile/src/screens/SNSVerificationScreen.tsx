import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Globe,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Search,
  Wallet,
} from 'lucide-react-native';
import {useEnhancedVerificationStore} from '../stores/enhancedVerificationStore';
import {useWalletStore} from '../stores/walletStore';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {Input} from '../components/ui/input';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {Badge} from '../components/ui/badge';
import {cn} from '../lib/utils';

interface MockDomain {
  domain: string;
  fullDomain: string;
  owner: string;
  registered: string;
  expires: string;
  available: boolean;
}

// Mock domains for demonstration
const MOCK_DOMAINS: MockDomain[] = [
  {
    domain: 'alice',
    fullDomain: 'alice.sol',
    owner: 'UserWallet111111111111111111111111111111',
    registered: '2023-01-15',
    expires: '2025-01-15',
    available: true,
  },
  {
    domain: 'cryptoking',
    fullDomain: 'cryptoking.sol',
    owner: 'UserWallet111111111111111111111111111111',
    registered: '2023-06-20',
    expires: '2024-06-20',
    available: true,
  },
];

export const SNSVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const {publicKey, isConnected} = useWalletStore();
  const {
    userVerification,
    isVerifying,
    error,
    startSNSVerification,
    clearError,
  } = useEnhancedVerificationStore();

  const [selectedDomain, setSelectedDomain] = useState<MockDomain | null>(null);
  const [userDomains, setUserDomains] = useState<MockDomain[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isConnected) {
      fetchUserDomains();
    }
  }, [isConnected]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const fetchUserDomains = async () => {
    setIsLoading(true);
    try {
      // Simulate fetching user's domains
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUserDomains(MOCK_DOMAINS);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch domains');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchDomain = async () => {
    if (!searchQuery.trim()) {return;}

    setIsSearching(true);
    try {
      // Simulate domain search
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockSearchResult: MockDomain = {
        domain: searchQuery.toLowerCase(),
        fullDomain: `${searchQuery.toLowerCase()}.sol`,
        owner: publicKey || 'Unknown',
        registered: new Date().toISOString().split('T')[0],
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        available: true,
      };

      // Check if domain exists in user's list
      const exists = userDomains.some(
        d => d.domain === mockSearchResult.domain,
      );
      if (!exists) {
        setUserDomains([...userDomains, mockSearchResult]);
      }

      setSelectedDomain(mockSearchResult);
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Error', 'Domain search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDomain = (domain: MockDomain) => {
    setSelectedDomain(domain);
  };

  const handleVerify = async () => {
    if (!selectedDomain) {
      Alert.alert('No Domain Selected', 'Please select a domain to verify');
      return;
    }

    try {
      await startSNSVerification(selectedDomain.domain);

      Alert.alert(
        'Verification Complete!',
        `Your domain ${selectedDomain.fullDomain} has been successfully verified.`,
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate('VerificationDashboard' as never),
          },
        ],
      );
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  if (!isConnected) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <Wallet size={64} color="#9CA3AF" />
          <Text className="text-lg font-medium text-gray-600 mt-4">
            Wallet Not Connected
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Please connect your wallet to verify domain ownership
          </Text>
          <Button
            className="mt-6"
            onPress={() => navigation.navigate('WalletConnect' as never)}>
            <Text className="text-white">Connect Wallet</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <View className="flex-1">
          {/* Header */}
          <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-semibold text-gray-900">
                SNS Domain Verification
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => navigation.goBack()}>
                <X size={20} color="#6B7280" />
              </Button>
            </View>
          </View>

          {/* Already Verified Banner */}
          {userVerification?.isVerifiedSNS && (
            <View className="bg-green-50 border-b border-green-200 px-4 py-3">
              <View className="flex-row items-center space-x-2">
                <Check size={16} color="#059669" />
                <Text className="text-sm text-green-700 flex-1">
                  You're already verified with{' '}
                  {userVerification.snsVerification?.fullDomain}
                </Text>
              </View>
            </View>
          )}

          <ScrollView className="flex-1 px-4 py-4">
            {/* Instructions */}
            <Card className="p-4 bg-blue-50 border-blue-200 mb-4">
              <View className="flex-row items-start space-x-3">
                <Globe size={20} color="#2563EB" />
                <View className="flex-1">
                  <Text className="font-medium text-blue-900">
                    How it works
                  </Text>
                  <Text className="text-sm text-blue-700 mt-1">
                    Verify ownership of your .sol domain to build trust and
                    unlock features. Your domain will be displayed on your
                    profile.
                  </Text>
                </View>
              </View>
            </Card>

            {/* Domain Search */}
            <Card className="p-4 bg-white mb-4">
              <Text className="font-medium text-lg mb-3 text-gray-900">
                Search for Your Domain
              </Text>
              <View className="flex-row space-x-2">
                <Input
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Enter your domain (without .sol)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1"
                />
                <Button
                  onPress={handleSearchDomain}
                  disabled={!searchQuery.trim() || isSearching}>
                  {isSearching ? (
                    <LoadingSpinner size="small" color="#FFFFFF" />
                  ) : (
                    <Search size={16} color="#FFFFFF" />
                  )}
                </Button>
              </View>
            </Card>

            {/* Domain Selection */}
            <Card className="p-4 bg-white mb-4">
              <Text className="font-medium text-lg mb-3 text-gray-900">
                Your Domains
              </Text>

              {isLoading ? (
                <View className="items-center py-8">
                  <LoadingSpinner size="large" />
                  <Text className="mt-4 text-gray-600">
                    Loading your domains...
                  </Text>
                </View>
              ) : userDomains.length > 0 ? (
                <View className="space-y-3">
                  {userDomains.map(domain => (
                    <DomainCard
                      key={domain.domain}
                      domain={domain}
                      selected={selectedDomain?.domain === domain.domain}
                      onSelect={() => handleSelectDomain(domain)}
                    />
                  ))}
                </View>
              ) : (
                <View className="items-center py-8">
                  <Globe size={48} color="#9CA3AF" />
                  <Text className="text-gray-600 mt-2">No Domains Found</Text>
                  <Text className="text-sm text-gray-500 text-center mt-1">
                    Search for your .sol domain above
                  </Text>
                </View>
              )}
            </Card>

            {/* Selected Domain Details */}
            {selectedDomain && (
              <Card className="p-4 bg-white mb-4">
                <Text className="font-medium text-lg mb-3 text-gray-900">
                  Selected Domain Details
                </Text>

                <View className="space-y-3">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">Domain</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {selectedDomain.fullDomain}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">Owner</Text>
                    <Text className="text-sm font-mono text-gray-900">
                      {selectedDomain.owner.slice(0, 8)}...
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">Expires</Text>
                    <Text className="text-sm text-gray-900">
                      {new Date(selectedDomain.expires).toLocaleDateString()}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">Status</Text>
                    <Badge variant="secondary">
                      <Text className="text-xs">Ready to Verify</Text>
                    </Badge>
                  </View>
                </View>
              </Card>
            )}

            {/* Verification Benefits */}
            <Card className="p-4 bg-gray-50 mb-4">
              <Text className="font-medium text-gray-900 mb-3">
                SNS Domain Verification Benefits
              </Text>
              <View className="space-y-2">
                <BenefitItem text="Custom profile URL with your .sol domain" />
                <BenefitItem text="Verified domain badge on your profile" />
                <BenefitItem text="Increased trust score (+25 points)" />
                <BenefitItem text="Domain-based messaging and notifications" />
              </View>
            </Card>

            {/* Warning */}
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <View className="flex-row items-start space-x-3">
                <AlertCircle size={20} color="#D97706" />
                <View className="flex-1">
                  <Text className="font-medium text-yellow-900">Important</Text>
                  <Text className="text-sm text-yellow-700 mt-1">
                    Domain verification requires you to sign a message with your
                    wallet. No transaction fees are required for SNS
                    verification.
                  </Text>
                </View>
              </View>
            </Card>
          </ScrollView>

          {/* Footer */}
          <View className="bg-white border-t border-gray-200 px-4 py-3">
            <Button
              onPress={handleVerify}
              disabled={!selectedDomain || isVerifying}
              className="w-full">
              {isVerifying ? (
                <LoadingSpinner size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Globe size={16} color="#FFFFFF" />
                  <Text className="text-white ml-2">
                    Verify Domain Ownership
                  </Text>
                </>
              )}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Domain Card Component
const DomainCard: React.FC<{
  domain: MockDomain;
  selected: boolean;
  onSelect: () => void;
}> = ({domain, selected, onSelect}) => {
  const isExpiringSoon =
    new Date(domain.expires).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  return (
    <Button
      variant={selected ? 'default' : 'outline'}
      className="h-auto p-3"
      onPress={onSelect}>
      <View className="flex-row items-center justify-between w-full">
        <View className="flex-row items-center space-x-3 flex-1">
          <View
            className={cn(
              'w-10 h-10 rounded-full items-center justify-center',
              selected ? 'bg-white/20' : 'bg-blue-100',
            )}>
            <Globe size={20} color={selected ? '#FFFFFF' : '#3B82F6'} />
          </View>

          <View className="flex-1">
            <Text
              className={cn(
                'font-medium text-lg',
                selected ? 'text-white' : 'text-gray-900',
              )}>
              {domain.fullDomain}
            </Text>
            <View className="flex-row items-center space-x-2">
              <Text
                className={cn(
                  'text-sm',
                  selected ? 'text-white/80' : 'text-gray-600',
                )}>
                Registered {new Date(domain.registered).toLocaleDateString()}
              </Text>
              {isExpiringSoon && (
                <Badge
                  variant="warning"
                  className={selected ? 'bg-white/20' : ''}
                >
                  <Text className="text-xs">Expiring Soon</Text>
                </Badge>
              )}
            </View>
          </View>
        </View>

          className={cn(
            'w-5 h-5 rounded-full border-2',
            selected ? 'bg-white border-white' : 'border-gray-300',
          )}>
          {selected && (
            <View className="w-full h-full items-center justify-center">
              <View className="w-2 h-2 bg-blue-600 rounded-full" />
            </View>
          )}
        </View>
      </View>
    </Button>
  );
};

// Benefit Item Component
const BenefitItem: React.FC<{
  text: string;
}> = ({text}) => (
  <View className="flex-row items-center space-x-2">
    <Check size={16} color="#059669" />
    <Text className="text-sm text-gray-700">{text}</Text>
  </View>
);
