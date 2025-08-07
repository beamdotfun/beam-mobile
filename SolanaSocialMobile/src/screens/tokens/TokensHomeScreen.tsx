import React, {useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ChevronRight,
  Send,
  Wallet,
  CreditCard,
  ArrowUpDown,
  DollarSign,
  PiggyBank,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import {ConsistentHeader} from '../../components/navigation/ConsistentHeader';
import {useThemeStore} from '../../store/themeStore';

interface TokensHomeScreenProps {
  navigation: any;
}

interface TokensCategory {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  screen: string;
  color: string;
  description?: string;
  comingSoon?: boolean;
}

const tokensCategories: TokensCategory[] = [
  {
    id: 'wallet',
    icon: Wallet,
    label: 'Wallet Overview',
    screen: 'WalletOverview',
    color: '#8B5CF6',
    description: 'View your token balances',
    comingSoon: true,
  },
  {
    id: 'send-receive',
    icon: ArrowUpDown,
    label: 'Send & Receive',
    screen: 'SendReceive',
    color: '#3B82F6',
    description: 'Transfer tokens',
    comingSoon: true,
  },
  {
    id: 'buy-crypto',
    icon: CreditCard,
    label: 'Buy Crypto',
    screen: 'BuyCrypto',
    color: '#10B981',
    description: 'Purchase SOL and tokens',
    comingSoon: true,
  },
  {
    id: 'swap',
    icon: Zap,
    label: 'Swap',
    screen: 'SwapTokens',
    color: '#F59E0B',
    description: 'Exchange tokens',
    comingSoon: true,
  },
  {
    id: 'staking',
    icon: PiggyBank,
    label: 'Staking',
    screen: 'Staking',
    color: '#EC4899',
    description: 'Earn rewards',
    comingSoon: true,
  },
  {
    id: 'defi',
    icon: TrendingUp,
    label: 'DeFi',
    screen: 'DeFi',
    color: '#14B8A6',
    description: 'Lending & Borrowing',
    comingSoon: true,
  },
  {
    id: 'rewards',
    icon: DollarSign,
    label: 'Rewards',
    screen: 'Rewards',
    color: '#84CC16',
    description: 'Claim your rewards',
    comingSoon: true,
  },
  {
    id: 'transfer',
    icon: Send,
    label: 'Transfer',
    screen: 'TransferDemo',
    color: '#3B82F6',
    description: 'Send SOL to any wallet',
  },
];

function TokensHomeScreen({navigation}: TokensHomeScreenProps) {
  const {colors} = useThemeStore();

  const handleCategoryPress = useCallback((category: TokensCategory) => {
    if (category.comingSoon) {
      console.log(`${category.label} coming soon`);
      return;
    }
    
    console.log('Navigate to:', category.screen);
    switch (category.screen) {
      case 'TransferDemo':
        navigation.navigate('TransferDemo');
        break;
      default:
        // For other screens, just log for now
        console.log(`${category.label} not implemented yet`);
    }
  }, [navigation]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    categoriesList: {
      flex: 1,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 56,
      backgroundColor: colors.background,
    },
    categoryRowPressed: {
      backgroundColor: colors.muted,
    },
    categoryRowDisabled: {
      opacity: 0.5,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      backgroundColor: colors.muted,
      borderRadius: 20,
    },
    categoryContent: {
      flex: 1,
      justifyContent: 'center',
    },
    categoryLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 2,
    },
    categoryDescription: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    chevronIcon: {
      marginLeft: 8,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 68, // Align with text (40px icon + 12px margin + 16px padding)
    },
    comingSoonBadge: {
      backgroundColor: colors.muted,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      marginLeft: 8,
    },
    comingSoonText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.mutedForeground,
      fontFamily: 'Inter-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.mutedForeground,
      fontFamily: 'Inter-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ConsistentHeader title="Tokens" onBack={() => navigation.navigate('FeedHome')} />

      <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
        {tokensCategories.map((category, index) => (
          <View key={category.id}>
            <Pressable
              style={({pressed}) => [
                styles.categoryRow,
                pressed && !category.comingSoon && styles.categoryRowPressed,
                category.comingSoon && styles.categoryRowDisabled,
              ]}
              onPress={() => handleCategoryPress(category)}
              accessibilityRole="button"
              accessibilityLabel={`${category.label}`}
              disabled={category.comingSoon}>
              <View style={[styles.categoryIcon, {backgroundColor: category.color + '20'}]}>
                <category.icon
                  size={22}
                  color={category.color}
                  strokeWidth={2}
                />
              </View>
              <View style={styles.categoryContent}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  {category.comingSoon && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Soon</Text>
                    </View>
                  )}
                </View>
                {category.description && (
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                )}
              </View>
              {!category.comingSoon && (
                <ChevronRight
                  size={16}
                  color={colors.mutedForeground}
                  style={styles.chevronIcon}
                />
              )}
            </Pressable>
            {index < tokensCategories.length - 1 && (
              <View style={styles.divider} />
            )}
          </View>
        ))}
      </ScrollView>

    </SafeAreaView>
  );
}

export default TokensHomeScreen;