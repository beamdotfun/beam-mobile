import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Check} from 'lucide-react-native';
import {ConsistentHeader} from '../../components/navigation/ConsistentHeader';
import {useThemeStore} from '../../store/themeStore';
import {useWalletStore} from '../../store/wallet';
import {useProfileStore} from '../../store/profileStore';
import {socialAPI} from '../../services/api/social';
import {Toast} from '../../components/ui/Toast';

const {width: screenWidth} = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_SPACING = 12;
const ITEM_SIZE = (screenWidth - (ITEM_SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

interface NFT {
  mint: string;
  tokenAccount: string;
  name: string;
  description?: string;
  image: string;
  externalUrl?: string;
  collection?: {
    name: string;
    family?: string;
  };
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface NFTSelectionScreenProps {
  navigation: any;
}

export default function NFTSelectionScreen({navigation}: NFTSelectionScreenProps) {
  const {colors} = useThemeStore();
  const {publicKey} = useWalletStore();
  const {uploadProfilePicture} = useProfileStore();
  
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast(prev => ({...prev, visible: false}));
  };

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    if (!publicKey) {
      setError('No wallet connected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const walletAddress = publicKey.toString();
      const response = await socialAPI.getUserNFTs(walletAddress);
      
      if (response?.nfts) {
        // Filter NFTs that have valid images
        const validNFTs = response.nfts.filter((nft: NFT) => 
          nft.image && 
          (nft.image.startsWith('http') || 
           nft.image.startsWith('ipfs://') || 
           nft.image.startsWith('arweave://'))
        );
        
        // Convert IPFS and Arweave URLs to HTTP gateways
        const processedNFTs = validNFTs.map((nft: NFT) => ({
          ...nft,
          image: convertToHttpUrl(nft.image),
        }));
        
        setNfts(processedNFTs);
      } else {
        setNfts([]);
      }
    } catch (err: any) {
      console.error('Failed to load NFTs:', err);
      setError(err.message || 'Failed to load NFTs');
    } finally {
      setLoading(false);
    }
  };

  const convertToHttpUrl = (url: string): string => {
    if (url.startsWith('ipfs://')) {
      // Use a public IPFS gateway
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    if (url.startsWith('arweave://')) {
      // Use Arweave gateway
      return url.replace('arweave://', 'https://arweave.net/');
    }
    return url;
  };

  const handleSelectNFT = (nft: NFT) => {
    setSelectedNFT(nft);
  };

  const handleSaveSelection = async () => {
    if (!selectedNFT) {
      showToast('Please select an NFT', 'warning');
      return;
    }

    setSaving(true);
    
    try {
      // Create a pseudo-file object with the NFT image URL
      const nftImageFile = {
        uri: selectedNFT.image,
        type: 'image/jpeg', // Default type, will be overridden by actual image type
        fileName: `nft_${selectedNFT.mint}.jpg`,
        name: `nft_${selectedNFT.mint}.jpg`,
      };
      
      // Use the same upload method to save the NFT image as profile picture
      await uploadProfilePicture(nftImageFile);
      
      showToast('NFT set as profile picture!', 'success');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (err: any) {
      console.error('Failed to set NFT as profile picture:', err);
      showToast(
        err.message || 'Failed to set NFT as profile picture',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const renderNFTItem = ({item}: {item: NFT}) => {
    const isSelected = selectedNFT?.mint === item.mint;
    
    return (
      <TouchableOpacity
        style={[
          styles.nftItem,
          isSelected && [styles.nftItemSelected, {borderColor: colors.primary}],
        ]}
        onPress={() => handleSelectNFT(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{uri: item.image}}
          style={styles.nftImage}
          resizeMode="cover"
        />
        
        {isSelected && (
          <View style={[styles.selectedBadge, {backgroundColor: colors.primary}]}>
            <Check size={16} color={colors.background} />
          </View>
        )}
        
        <View style={[styles.nftInfo, {backgroundColor: colors.card}]}>
          <Text style={[styles.nftName, {color: colors.foreground}]} numberOfLines={1}>
            {item.name || 'Unnamed NFT'}
          </Text>
          {item.collection?.name && (
            <Text style={[styles.nftCollection, {color: colors.mutedForeground}]} numberOfLines={1}>
              {item.collection.name}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, {color: colors.foreground}]}>
        No NFTs Found
      </Text>
      <Text style={[styles.emptyStateText, {color: colors.mutedForeground}]}>
        You don't have any NFTs in your wallet yet.
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <Text style={[styles.errorTitle, {color: colors.destructive}]}>
        Failed to Load NFTs
      </Text>
      <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, {backgroundColor: colors.primary}]}
        onPress={loadNFTs}
      >
        <Text style={[styles.retryButtonText, {color: colors.primaryForeground}]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    nftList: {
      padding: ITEM_SPACING,
    },
    nftItem: {
      width: ITEM_SIZE,
      marginBottom: ITEM_SPACING,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    nftItemSelected: {
      borderWidth: 2,
    },
    nftImage: {
      width: '100%',
      height: ITEM_SIZE,
      backgroundColor: colors.muted,
    },
    selectedBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nftInfo: {
      padding: 12,
    },
    nftName: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      marginBottom: 2,
    },
    nftCollection: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 20,
    },
    errorState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    bottomBar: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    saveButton: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ConsistentHeader 
        title="Select NFT" 
        onBack={() => navigation.goBack()} 
      />
      
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        position="top"
      />
      
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your NFTs...</Text>
          </View>
        ) : error ? (
          renderError()
        ) : nfts.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={nfts}
            renderItem={renderNFTItem}
            keyExtractor={(item) => item.mint}
            numColumns={COLUMN_COUNT}
            columnWrapperStyle={{justifyContent: 'space-between'}}
            contentContainerStyle={styles.nftList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      {!loading && !error && nfts.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              {backgroundColor: selectedNFT ? colors.primary : colors.muted},
              (!selectedNFT || saving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveSelection}
            disabled={!selectedNFT || saving}
          >
            <Text style={[
              styles.saveButtonText,
              {color: selectedNFT ? colors.primaryForeground : colors.mutedForeground},
            ]}>
              {saving ? 'Setting NFT...' : 'Set as Profile Picture'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}