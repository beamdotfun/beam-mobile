import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, ExternalLink, DollarSign, Zap} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {FeedStackScreenProps} from '../../types/navigation';

type Props = FeedStackScreenProps<'BuySOL'>;

export default function BuySOLScreen({navigation}: Props) {
  const {colors} = useThemeStore();

  const handleOpenExchange = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    iconContainer: {
      alignSelf: 'center',
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.warning + '20' || '#F59E0B20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.foreground,
      textAlign: 'center',
      marginBottom: 16,
      fontFamily: 'Inter-SemiBold',
    },
    subtitle: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
      fontFamily: 'Inter-Regular',
    },
    reasonsContainer: {
      marginBottom: 32,
    },
    reasonsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 16,
      fontFamily: 'Inter-SemiBold',
    },
    reasonItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    reasonIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    reasonText: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
      lineHeight: 22,
      fontFamily: 'Inter-Regular',
    },
    exchangesContainer: {
      marginBottom: 32,
    },
    exchangesTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 16,
      fontFamily: 'Inter-SemiBold',
    },
    exchangeButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    exchangeInfo: {
      flex: 1,
    },
    exchangeName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
    },
    exchangeDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    noteContainer: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
    },
    noteText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Buy SOL</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <DollarSign size={40} color={colors.warning || '#F59E0B'} />
        </View>

        <Text style={styles.title}>You need SOL to post</Text>
        <Text style={styles.subtitle}>
          SOL is the native cryptocurrency of the Solana blockchain. You need a
          small amount to cover transaction fees when posting on Beam.
        </Text>

        <View style={styles.reasonsContainer}>
          <Text style={styles.reasonsTitle}>Why do I need SOL?</Text>

          <View style={styles.reasonItem}>
            <Zap size={20} color={colors.primary} style={styles.reasonIcon} />
            <Text style={styles.reasonText}>
              <Text style={{fontWeight: '600'}}>Transaction Fees:</Text> Every
              post on Beam is stored on the Solana blockchain, which requires a
              small fee (usually ~$0.01).
            </Text>
          </View>

          <View style={styles.reasonItem}>
            <Zap size={20} color={colors.primary} style={styles.reasonIcon} />
            <Text style={styles.reasonText}>
              <Text style={{fontWeight: '600'}}>Decentralization:</Text> These
              fees help secure the Solana network and ensure your posts are
              permanently stored.
            </Text>
          </View>

          <View style={styles.reasonItem}>
            <Zap size={20} color={colors.primary} style={styles.reasonIcon} />
            <Text style={styles.reasonText}>
              <Text style={{fontWeight: '600'}}>Ownership:</Text> Your posts are
              truly yours and can't be censored or deleted by any centralized
              authority.
            </Text>
          </View>
        </View>

        <View style={styles.exchangesContainer}>
          <Text style={styles.exchangesTitle}>Where to buy SOL</Text>

          <Pressable
            style={styles.exchangeButton}
            onPress={() =>
              handleOpenExchange('https://www.coinbase.com/price/solana')
            }>
            <View style={styles.exchangeInfo}>
              <Text style={styles.exchangeName}>Coinbase</Text>
              <Text style={styles.exchangeDescription}>
                Popular and beginner-friendly exchange
              </Text>
            </View>
            <ExternalLink size={20} color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            style={styles.exchangeButton}
            onPress={() =>
              handleOpenExchange('https://www.kraken.com/prices/solana')
            }>
            <View style={styles.exchangeInfo}>
              <Text style={styles.exchangeName}>Kraken</Text>
              <Text style={styles.exchangeDescription}>
                Advanced trading features and security
              </Text>
            </View>
            <ExternalLink size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            After purchasing SOL, send it to your connected Solana wallet. You
            only need a small amount (0.01 SOL or more) to get started with
            posting.
          </Text>
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}
