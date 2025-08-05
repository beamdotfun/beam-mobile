import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';
import { TokenInfo } from '../../services/api/tips';

interface TokenPickerModalProps {
  visible: boolean;
  tokens: TokenInfo[];
  selectedToken?: TokenInfo | null;
  onSelectToken: (token: TokenInfo) => void;
  onClose: () => void;
}

export function TokenPickerModal({
  visible,
  tokens,
  selectedToken,
  onSelectToken,
  onClose,
}: TokenPickerModalProps) {
  const { colors } = useThemeStore();

  const renderTokenItem = ({ item }: { item: TokenInfo }) => {
    const isSelected = selectedToken?.mint === item.mint;
    
    return (
      <Pressable
        style={[
          styles.tokenItem,
          { 
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
          isSelected && styles.selectedTokenItem,
        ]}
        onPress={() => {
          onSelectToken(item);
          onClose();
        }}
      >
        <View style={styles.tokenLeft}>
          <View style={[styles.tokenIcon, { backgroundColor: colors.muted }]} />
          <View style={styles.tokenInfo}>
            <Text style={[styles.tokenSymbol, { color: colors.foreground }]}>
              {item.symbol}
            </Text>
            <Text style={[styles.tokenName, { color: colors.mutedForeground }]}>
              {item.name}
            </Text>
          </View>
        </View>
        <View style={styles.tokenRight}>
          <Text style={[styles.tokenBalance, { color: colors.foreground }]}>
            {(item.amount / Math.pow(10, item.decimals)).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: item.decimals > 6 ? 6 : item.decimals,
            })}
          </Text>
          <Text style={[styles.tokenUsdValue, { color: colors.mutedForeground }]}>
            ${item.usdValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </Pressable>
    );
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
      margin: 20,
      maxHeight: '80%',
      width: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
    },
    closeButton: {
      padding: 8,
    },
    tokenItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 8,
    },
    selectedTokenItem: {
      borderWidth: 2,
    },
    tokenLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    tokenIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    tokenInfo: {
      flex: 1,
    },
    tokenSymbol: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      marginBottom: 2,
    },
    tokenName: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
    },
    tokenRight: {
      alignItems: 'flex-end',
    },
    tokenBalance: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      marginBottom: 2,
    },
    tokenUsdValue: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Token</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.foreground} />
            </Pressable>
          </View>
          
          {tokens.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No tokens available.{'\n'}
                Make sure your wallet has some tokens to send tips.
              </Text>
            </View>
          ) : (
            <FlatList
              data={tokens}
              renderItem={renderTokenItem}
              keyExtractor={(item) => item.mint}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 400 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}