import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet, Image, Linking} from 'react-native';
import {formatDistanceToNow} from 'date-fns';
import LinearGradient from 'react-native-linear-gradient';
import {
  ChevronRight,
  MoreHorizontal,
  Zap,
  Pin,
  ExternalLink,
  Users,
} from 'lucide-react-native';
import {Avatar} from '../ui/avatar';
import {useThemeStore} from '../../store/themeStore';
import {Toast} from '../ui/Toast';

export interface BillboardAdData {
  id: string;
  brandName: string;
  brandWallet: string;
  brandProfilePicture?: string;
  brandReputation: number;
  title: string;
  message: string;
  mediaUrls?: string[];
  createdAt: string;
  claimReward: number; // SOL amount
  claimType: 'token' | 'sol' | 'nft';
  isVerified?: boolean;
  isPinned?: boolean;
}

interface BillboardAdProps {
  ad: BillboardAdData | null;
  onClaim?: (adId: string) => void;
  onBrandPress?: (brandWallet: string) => void;
  onHashtagPress?: (hashtag: string) => void;
  onBusinessPress?: () => void;
}

// Mock data for development
export const mockBillboardAd: BillboardAdData = {
  id: 'ad_001',
  brandName: 'SolanaSpaces',
  brandWallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  brandProfilePicture: 'https://pbs.twimg.com/profile_images/1577991240892678144/BclSZNb5_400x400.jpg',
  brandReputation: 95,
  title: 'Limited NFT Drop',
  message: 'Join the Solana Spaces community and claim your exclusive Genesis NFT! 🚀\n\nFirst 1000 claimers get a rare variant with special utilities. Be part of the future of Web3 co-working spaces.\n\n#SolanaSpaces #NFTDrop #Web3',
  mediaUrls: [
    'https://pbs.twimg.com/media/FgU8V8PWAAEQqBJ?format=jpg&name=large'
  ],
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  claimReward: 0.05,
  claimType: 'nft',
  isVerified: true,
  isPinned: false,
};

export function BillboardAd({
  ad,
  onClaim,
  onBrandPress,
  onHashtagPress,
  onBusinessPress,
}: BillboardAdProps) {
  const {colors} = useThemeStore();
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Check if we should show house ad
  const isHouseAd = !ad;

  const formattedTime = ad ? formatDistanceToNow(new Date(ad.createdAt), {
    addSuffix: true,
  }) : '2 hours ago';

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginBottom: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
      overflow: 'hidden',
    },
    adBadge: {
      backgroundColor: colors.muted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    adBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary, // Beam blue text
      fontFamily: 'Inter-Bold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    adBadgeTouchArea: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardContent: {
      paddingTop: 20,
      paddingHorizontal: 16,
      paddingBottom: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      justifyContent: 'space-between',
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    userInfo: {
      flex: 1,
      marginLeft: 16,
    },
    brandNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    brandName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      lineHeight: 18,
    },
    verifiedText: {
      color: colors.success,
      fontSize: 15,
      fontWeight: '600',
      marginLeft: 4,
    },
    signedValidatedText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    middot: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginHorizontal: 4,
    },
    headerRight: {
      marginLeft: 12,
    },
    reputationChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.success,
      gap: 4,
    },
    reputationText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
      fontFamily: 'Inter-SemiBold',
    },
    content: {
      marginBottom: 16,
    },
    adTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.foreground,
      marginBottom: 6,
      fontFamily: 'Inter-Medium',
      lineHeight: 22,
    },
    adText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
    mentionText: {
      color: colors.primary,
    },
    hashtagText: {
      color: colors.primary,
    },
    mediaContainer: {
      marginTop: 16,
      marginBottom: 16,
    },
    mediaImage: {
      width: '100%',
      aspectRatio: 4/3,
      borderRadius: 16,
      backgroundColor: colors.muted,
    },
    subLinkTile: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginTop: 16,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
    },
    subLinkTilePressed: {
      backgroundColor: colors.accent,
    },
    subLinkContent: {
      flex: 1,
    },
    subLinkTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary,
      fontFamily: 'Inter-Medium',
    },
    subLinkSubtitle: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
      opacity: 0.8,
    },
    reputationRow: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    brandReputationText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 56,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    houseAdFooter: {
      height: 48,
      paddingVertical: 0,
      paddingHorizontal: 0,
      borderTopWidth: 0,
    },
    footerLeft: {
      flex: 1,
      marginRight: 12,
    },
    claimsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    claimsText: {
      fontSize: 14,
      color: `${colors.foreground}DD`, // Slightly darker than muted
      fontFamily: 'Inter-Regular',
    },
    solanaSymbol: {
      fontSize: 28, // 2x the base text size (14 * 2)
      marginTop: -4, // Adjust vertical alignment
    },
    footerRight: {
      flexShrink: 0,
    },
    claimButton: {
      height: 40,
      minWidth: 80,
      maxWidth: 100,
      backgroundColor: colors.primary,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    claimButtonGradient: {
      // Placeholder for gradient implementation
    },
    claimButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      fontFamily: 'Inter-SemiBold',
    },
    bodyText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
  });

  const handleClaim = () => {
    onClaim?.(ad.id);
    setToastMessage(`Claiming ${ad.claimType}...`);
    setShowToast(true);
  };

  const handleBrandPress = () => {
    onBrandPress?.(ad.brandWallet);
  };

  const renderAdContent = (content: string) => {
    const parts = content.split(/(@\w+|#\w+)/g);

    return (
      <Text style={styles.adText}>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            const username = part.slice(1);
            return (
              <Text
                key={index}
                style={styles.mentionText}
                onPress={() => onBrandPress?.(username)}>
                {part}
              </Text>
            );
          } else if (part.startsWith('#')) {
            const hashtag = part.slice(1);
            return (
              <Text
                key={index}
                style={styles.hashtagText}
                onPress={() => onHashtagPress?.(hashtag)}>
                {part}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  // Mock hard-coded stats
  const mockClaims = 1247;
  const mockPayout = ad?.claimReward || 0;

  // Format large numbers for small screens
  const formatClaimsCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1).replace('.0', '')}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return count.toString();
  };

  // Handle Twitter share for house ad
  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent('Join me on Beam - the future of social media, built on Solana. https://beam.fun');
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    Linking.openURL(twitterUrl);
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => isHouseAd ? null : console.log('Brand pressed:', ad?.brandName)}
              style={styles.userSection}>
              {isHouseAd ? (
                <LinearGradient
                  colors={['#2563eb', '#9333ea']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text style={{color: '#FFFFFF', fontSize: 18, fontWeight: '600'}}>B</Text>
                </LinearGradient>
              ) : (
                <Avatar
                  src={ad?.brandProfilePicture}
                  fallback={ad?.brandName?.charAt(0) || ad?.brandWallet.slice(0, 2)}
                  size="lg" // 40dp avatar
                />
              )}

              <View style={styles.userInfo}>
                <View style={styles.brandNameRow}>
                  <Text style={styles.brandName}>
                    {isHouseAd ? 'Beam' : ad?.brandName}
                  </Text>
                  {(isHouseAd || ad?.isVerified) && (
                    <Text style={styles.verifiedText}>✓</Text>
                  )}
                </View>
                <Text style={styles.signedValidatedText}>Signed & Validated</Text>
              </View>
            </Pressable>
            
            {/* Ad Badge */}
            <View style={styles.adBadgeTouchArea}>
              <View style={[styles.adBadge, !isHouseAd && {backgroundColor: colors.primary}]}>
                <Text style={[styles.adBadgeText, !isHouseAd && {color: '#FFFFFF', fontSize: 11}]}>
                  {isHouseAd ? 'Ad Space Available' : 'Sponsored'}
                </Text>
              </View>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {isHouseAd ? (
              <Text style={styles.adText}>
                This is where an ad would appear when an advertiser purchases this space. Brands can sign up to advertise and reach our engaged community.
              </Text>
            ) : (
              renderAdContent(ad.message)
            )}

            {/* Media */}
            {!isHouseAd && ad?.mediaUrls && ad.mediaUrls.length > 0 && (
              <View style={styles.mediaContainer}>
                <Image
                  source={{uri: ad.mediaUrls[0]}}
                  style={styles.mediaImage}
                  resizeMode="cover"
                  onError={() => console.log('Image failed to load')}
                />
              </View>
            )}

            {/* Link tile - Different for house ad */}
            {isHouseAd ? (
              <Pressable 
                onPress={onBusinessPress}>
                {({pressed}) => (
                  <View style={[styles.subLinkTile, pressed && styles.subLinkTilePressed]}>
                    <View style={styles.subLinkContent}>
                      <Text style={styles.subLinkTitle}>Brands: Advertise with Beam</Text>
                      <Text style={styles.subLinkSubtitle}>Join our business program to reach engaged users</Text>
                    </View>
                    <View style={{width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 16}}>
                      <ExternalLink size={16} color="#3b82f6" />
                    </View>
                  </View>
                )}
              </Pressable>
            ) : ad?.claimType === 'nft' ? (
              <Pressable 
                style={styles.subLinkTile}
                onPress={() => console.log('Sub-link pressed')}>
                <View style={styles.subLinkContent}>
                  <Text style={styles.subLinkTitle}>Learn about this NFT collection</Text>
                  <Text style={styles.subLinkSubtitle}>View collection details and utility</Text>
                </View>
                <ExternalLink size={16} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Brand Reputation Row - Only for advertiser ads */}
        {!isHouseAd && (
          <View style={styles.reputationRow}>
            <Text style={styles.brandReputationText}>
              Brand Reputation: {ad?.brandReputation}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={[styles.footer, isHouseAd && styles.houseAdFooter]}>
          {isHouseAd ? (
            // House ad footer - full width button with gradient
            <Pressable 
              style={{flex: 1}}
              onPress={handleTwitterShare}>
              {({pressed}) => (
                <LinearGradient
                  colors={pressed ? ['#1d4ed8', '#7c3aed'] : ['#2563eb', '#9333ea']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{
                    height: 48,
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}>
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: '600',
                    fontFamily: 'Inter-SemiBold',
                  }}>
                    Bring your friends to Beam
                  </Text>
                  <ExternalLink size={17} color="#FFFFFF" />
                </LinearGradient>
              )}
            </Pressable>
          ) : (
            <>
              {/* Left: Claims Stats */}
              <View style={styles.footerLeft}>
                <View style={styles.claimsContainer}>
                  <Users size={14} color={colors.mutedForeground} />
                  <Text style={styles.claimsText} numberOfLines={1}>
                    {formatClaimsCount(mockClaims)} claims
                  </Text>
                  <Text style={[styles.claimsText, {marginHorizontal: 8}]} numberOfLines={1}>·</Text>
                  <Text style={styles.solanaSymbol}>◎</Text>
                  <Text style={styles.claimsText} numberOfLines={1}> {mockPayout}</Text>
                </View>
              </View>

              {/* Right: Buttons */}
              <View style={styles.footerRight}>
                <Pressable
                  style={styles.claimButton}
                  onPress={() => console.log('Claim button pressed:', ad?.id)}>
                  <Text style={styles.claimButtonText}>Claim</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Toast */}
      <Toast
        message={toastMessage}
        type="info"
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
    </>
  );
}