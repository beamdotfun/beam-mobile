import React, {useState, useEffect} from 'react';
import {View, ScrollView, Alert, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Shield,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Wallet,
} from 'lucide-react-native';
import {useEnhancedVerificationStore} from '../stores/enhancedVerificationStore';
import {useWalletStore} from '../stores/walletStore';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Text} from '../components/ui/text';
import {LoadingSpinner} from '../components/ui/loading-spinner';
import {Badge} from '../components/ui/badge';
import {cn} from '../lib/utils';

interface MockNFT {
  mint: string;
  name: string;
  symbol: string;
  image: string;
  collection: string;
  verified: boolean;
}

// Mock NFTs for demonstration
const MOCK_NFTS: MockNFT[] = [
  {
    mint: 'NFT1111111111111111111111111111111111111111',
    name: 'Degen Ape #1234',
    symbol: 'DAPE',
    image: 'https://via.placeholder.com/200',
    collection: 'Degen Ape Academy',
    verified: true,
  },
  {
    mint: 'NFT2222222222222222222222222222222222222222',
    name: 'SMB Gen2 #5678',
    symbol: 'SMB',
    image: 'https://via.placeholder.com/200',
    collection: 'Solana Monkey Business',
    verified: true,
  },
  {
    mint: 'NFT3333333333333333333333333333333333333333',
    name: 'Okay Bears #9012',
    symbol: 'OKAY',
    image: 'https://via.placeholder.com/200',
    collection: 'Okay Bears',
    verified: true,
  },
];

export const NFTVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const {publicKey, isConnected} = useWalletStore();
  const {
    userVerification,
    isVerifying,
    error,
    startNFTVerification,
    clearError,
  } = useEnhancedVerificationStore();

  const [selectedNFT, setSelectedNFT] = useState<MockNFT | null>(null);
  const [userNFTs, setUserNFTs] = useState<MockNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected) {
      fetchUserNFTs();
    }
  }, [isConnected]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const fetchUserNFTs = async () => {
    setIsLoading(true);
    try {
      // Simulate fetching user's NFTs
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUserNFTs(MOCK_NFTS);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectNFT = (nft: MockNFT) => {
    setSelectedNFT(nft);
  };

  const handleVerify = async () => {
    if (!selectedNFT) {
      Alert.alert('No NFT Selected', 'Please select an NFT to verify');
      return;
    }

    try {
      await startNFTVerification(selectedNFT.mint);

      Alert.alert(
        'Verification Complete!',
        'Your NFT has been successfully verified.',
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
            Please connect your wallet to verify NFT ownership
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
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-semibold text-gray-900">
              NFT Verification
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
        {userVerification?.isVerifiedNFT && (
          <View className="bg-green-50 border-b border-green-200 px-4 py-3">
            <View className="flex-row items-center space-x-2">
              <Check size={16} color="#059669" />
              <Text className="text-sm text-green-700 flex-1">
                You're already verified with{' '}
                {userVerification.nftVerification?.nftName || 'an NFT'}
              </Text>
            </View>
          </View>
        )}

        <ScrollView className="flex-1 px-4 py-4">
          {/* Instructions */}
          <Card className="p-4 bg-blue-50 border-blue-200 mb-4">
            <View className="flex-row items-start space-x-3">
              <Shield size={20} color="#2563EB" />
              <View className="flex-1">
                <Text className="font-medium text-blue-900">How it works</Text>
                <Text className="text-sm text-blue-700 mt-1">
                  Select an NFT from your collection to verify ownership.
                  Verified collections provide higher trust scores.
                </Text>
              </View>
            </View>
          </Card>

          {/* NFT Selection */}
          <Card className="p-4 bg-white mb-4">
            <Text className="font-medium text-lg mb-3 text-gray-900">
              Select an NFT to Verify
            </Text>

            {isLoading ? (
              <View className="items-center py-8">
                <LoadingSpinner size="large" />
                <Text className="mt-4 text-gray-600">Loading your NFTs...</Text>
              </View>
            ) : userNFTs.length > 0 ? (
              <View className="space-y-3">
                {userNFTs.map(nft => (
                  <NFTCard
                    key={nft.mint}
                    nft={nft}
                    selected={selectedNFT?.mint === nft.mint}
                    onSelect={() => handleSelectNFT(nft)}
                  />
                ))}
              </View>
            ) : (
              <View className="items-center py-8">
                <ImageIcon size={48} color="#9CA3AF" />
                <Text className="text-gray-600 mt-2">No NFTs Found</Text>
                <Text className="text-sm text-gray-500 text-center mt-1">
                  Make sure you have NFTs in your connected wallet
                </Text>
                <Button
                  variant="outline"
                  className="mt-4"
                  onPress={fetchUserNFTs}>
                  <Text>Refresh</Text>
                </Button>
              </View>
            )}
          </Card>

          {/* Selected NFT Details */}
          {selectedNFT && (
            <Card className="p-4 bg-white mb-4">
              <Text className="font-medium text-lg mb-3 text-gray-900">
                Selected NFT Details
              </Text>

              <View className="space-y-3">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">Collection</Text>
                  <View className="flex-row items-center space-x-1">
                    <Text className="text-sm font-medium text-gray-900">
                      {selectedNFT.collection}
                    </Text>
                    {selectedNFT.verified && (
                      <Check size={14} color="#3B82F6" />
                    )}
                  </View>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">Token Address</Text>
                  <Text className="text-sm font-mono text-gray-900">
                    {selectedNFT.mint.slice(0, 8)}...
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">
                    Verification Status
                  </Text>
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
              NFT Verification Benefits
            </Text>
            <View className="space-y-2">
              <BenefitItem text="Verified badge on your profile" />
              <BenefitItem text="Access to NFT-holder exclusive features" />
              <BenefitItem text="Increased trust score (+25 points)" />
              <BenefitItem text="Priority customer support" />
            </View>
          </Card>

          {/* Warning */}
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <View className="flex-row items-start space-x-3">
              <AlertCircle size={20} color="#D97706" />
              <View className="flex-1">
                <Text className="font-medium text-yellow-900">Important</Text>
                <Text className="text-sm text-yellow-700 mt-1">
                  NFT verification requires a small transaction fee (&lt; 0.01
                  SOL) and will be recorded on the blockchain.
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>

        {/* Footer */}
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <Button
            onPress={handleVerify}
            disabled={!selectedNFT || isVerifying}
            className="w-full">
            {isVerifying ? (
              <LoadingSpinner size="small" color="#FFFFFF" />
            ) : (
              <>
                <Shield size={16} color="#FFFFFF" />
                <Text className="text-white ml-2">Verify NFT Ownership</Text>
              </>
            )}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

// NFT Card Component
const NFTCard: React.FC<{
  nft: MockNFT;
  selected: boolean;
  onSelect: () => void;
}> = ({nft, selected, onSelect}) => {
  return (
    <Button
      variant={selected ? 'default' : 'outline'}
      className="h-auto p-3"
      onPress={onSelect}>
      <View className="flex-row items-center space-x-3 w-full">
        <View className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
          <Image
            source={{uri: nft.image}}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center space-x-2">
            <Text
              className={cn(
                'font-medium',
                selected ? 'text-white' : 'text-gray-900',
              )}>
              {nft.name}
            </Text>
            {nft.verified && (
              <Badge
                variant={selected ? 'secondary' : 'default'}
                className={selected ? 'bg-white/20' : ''}
              >
                <Check size={10} color={selected ? '#FFFFFF' : '#FFFFFF'} />
                <Text
                  className={cn(
                    'text-xs ml-1',
                    selected ? 'text-white' : 'text-white',
                  )}>
                  Verified
                </Text>
              </Badge>
            )}
          </View>
          <Text
            className={cn(
              'text-sm',
              selected ? 'text-white/80' : 'text-gray-600',
            )}>
            {nft.collection}
          </Text>
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
