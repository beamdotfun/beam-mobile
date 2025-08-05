import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Switch,
  TextInput,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Wallet,
  Zap,
  DollarSign,
  Server,
  Settings,
  TrendingUp,
  Clock,
} from 'lucide-react-native';
import {Header} from '../../components/layout/Header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {Button} from '../../components/ui/button';
import {useSettingsStore} from '../../store/settingsStore';
import {useThemeStore} from '../../store/themeStore';
import {ProfileStackScreenProps} from '../../types/navigation';
import {cn} from '../../utils/cn';

type Props = ProfileStackScreenProps<'WalletSettings'>;

const RPC_ENDPOINTS = [
  {
    name: 'Solana Mainnet',
    url: 'https://api.mainnet-beta.solana.com',
    description: 'Official Solana RPC',
  },
  {
    name: 'QuickNode',
    url: 'https://solana-mainnet.quicknode.pro',
    description: 'Fast & reliable',
  },
  {
    name: 'Helius',
    url: 'https://rpc.helius.xyz',
    description: 'Enhanced RPC features',
  },
  {
    name: 'Custom',
    url: 'custom',
    description: 'Use your own endpoint',
  },
];

const PRIORITY_FEE_OPTIONS = [
  {
    value: 'slow',
    label: 'Slow',
    description: 'Lower fees, slower confirmation',
  },
  {value: 'medium', label: 'Medium', description: 'Balanced fees and speed'},
  {
    value: 'fast',
    label: 'Fast',
    description: 'Higher fees, faster confirmation',
  },
  {value: 'custom', label: 'Custom', description: 'Set your own fee'},
];

export default function WalletSettingsScreen({navigation}: Props) {
  const {colors} = useThemeStore();
  const {settings, updateSettings} = useSettingsStore();
  const [saving, setSaving] = useState(false);
  const [customRpcUrl, setCustomRpcUrl] = useState(
    settings?.wallet.customRpcUrl || '',
  );
  const [customPriorityFee, setCustomPriorityFee] = useState(
    settings?.wallet.customPriorityFee?.toString() || '',
  );
  const [autoApproveLimit, setAutoApproveLimit] = useState(
    settings?.wallet.autoApproveLimit?.toString() || '',
  );
  const [slippage, setSlippage] = useState(
    settings?.wallet.defaultSlippage?.toString() || '0.5',
  );

  const walletSettings = settings?.wallet || {
    defaultRpc: 'https://api.mainnet-beta.solana.com',
    priorityFees: 'medium',
    showBalanceInUsd: true,
    defaultSlippage: 0.5,
    autoApproveLimit: 0.1,
    customRpcUrl: '',
    customPriorityFee: 0.001,
  };

  const handleRpcChange = async (rpcUrl: string) => {
    setSaving(true);
    try {
      await updateSettings('wallet', {defaultRpc: rpcUrl});
    } catch (error) {
      Alert.alert('Error', 'Failed to update RPC endpoint');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomRpcSave = async () => {
    if (!customRpcUrl || !customRpcUrl.startsWith('http')) {
      Alert.alert('Error', 'Please enter a valid RPC URL');
      return;
    }

    setSaving(true);
    try {
      await updateSettings('wallet', {
        defaultRpc: customRpcUrl,
        customRpcUrl,
      });
      Alert.alert('Success', 'Custom RPC endpoint saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save custom RPC endpoint');
    } finally {
      setSaving(false);
    }
  };

  const handlePriorityFeeChange = async (priorityFee: string) => {
    setSaving(true);
    try {
      await updateSettings('wallet', {priorityFees: priorityFee});
    } catch (error) {
      Alert.alert('Error', 'Failed to update priority fee setting');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomPriorityFeeSave = async () => {
    const fee = parseFloat(customPriorityFee);
    if (isNaN(fee) || fee < 0) {
      Alert.alert('Error', 'Please enter a valid priority fee');
      return;
    }

    setSaving(true);
    try {
      await updateSettings('wallet', {
        priorityFees: 'custom',
        customPriorityFee: fee,
      });
      Alert.alert('Success', 'Custom priority fee saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save custom priority fee');
    } finally {
      setSaving(false);
    }
  };

  const handleSlippageSave = async () => {
    const slippageValue = parseFloat(slippage);
    if (isNaN(slippageValue) || slippageValue < 0 || slippageValue > 100) {
      Alert.alert('Error', 'Please enter a valid slippage percentage (0-100)');
      return;
    }

    setSaving(true);
    try {
      await updateSettings('wallet', {defaultSlippage: slippageValue});
      Alert.alert('Success', 'Slippage tolerance saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save slippage tolerance');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoApproveLimitSave = async () => {
    const limit = parseFloat(autoApproveLimit);
    if (isNaN(limit) || limit < 0) {
      Alert.alert('Error', 'Please enter a valid SOL amount');
      return;
    }

    setSaving(true);
    try {
      await updateSettings('wallet', {autoApproveLimit: limit});
      Alert.alert('Success', 'Auto-approve limit saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save auto-approve limit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header
        title="Wallet Settings"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* RPC Settings */}
        <Card className="mx-4 mb-4">
          <CardHeader>
            <CardTitle>
              <View className="flex-row items-center">
                <Server size={20} color={colors.foreground} />
                <Text className="text-lg font-semibold text-foreground ml-2">
                  RPC Endpoint
                </Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-muted-foreground text-sm mb-4">
              Choose your preferred Solana RPC endpoint for blockchain
              interactions
            </Text>

            {RPC_ENDPOINTS.map(endpoint => (
              <Pressable
                key={endpoint.url}
                onPress={() =>
                  endpoint.url !== 'custom' && handleRpcChange(endpoint.url)
                }
                className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0">
                <View className="flex-1">
                  <Text className="text-foreground font-medium">
                    {endpoint.name}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {endpoint.description}
                  </Text>
                  {endpoint.url !== 'custom' && (
                    <Text className="text-muted-foreground text-xs mt-1">
                      {endpoint.url}
                    </Text>
                  )}
                </View>

                <View
                  className={cn(
                    'w-5 h-5 rounded-full border-2',
                    walletSettings.defaultRpc === endpoint.url ||
                      (endpoint.url === 'custom' && walletSettings.customRpcUrl)
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground',
                  )}>
                  {(walletSettings.defaultRpc === endpoint.url ||
                    (endpoint.url === 'custom' &&
                      walletSettings.customRpcUrl)) && (
                    <View className="w-2 h-2 bg-white rounded-full m-auto" />
                  )}
                </View>
              </Pressable>
            ))}

            {/* Custom RPC Input */}
            {(walletSettings.customRpcUrl ||
              walletSettings.defaultRpc === 'custom') && (
              <View className="mt-4 pt-4 border-t border-border">
                <Text className="text-foreground font-medium mb-2">
                  Custom RPC URL
                </Text>
                <View className="flex-row space-x-2">
                  <TextInput
                    value={customRpcUrl}
                    onChangeText={setCustomRpcUrl}
                    placeholder="https://your-rpc-endpoint.com"
                    placeholderTextColor={colors.mutedForeground}
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                    }}
                  />
                  <Button
                    size="sm"
                    onPress={handleCustomRpcSave}
                    disabled={saving}>
                    Save
                  </Button>
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Transaction Settings */}
        <Card className="mx-4 mb-4">
          <CardHeader>
            <CardTitle>
              <View className="flex-row items-center">
                <Zap size={20} color={colors.foreground} />
                <Text className="text-lg font-semibold text-foreground ml-2">
                  Transaction Settings
                </Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Priority Fees */}
            <View className="mb-6">
              <Text className="text-foreground font-medium mb-2">
                Priority Fees
              </Text>
              <Text className="text-muted-foreground text-sm mb-4">
                Control transaction confirmation speed
              </Text>

              {PRIORITY_FEE_OPTIONS.map(option => (
                <Pressable
                  key={option.value}
                  onPress={() =>
                    option.value !== 'custom' &&
                    handlePriorityFeeChange(option.value)
                  }
                  className="flex-row items-center justify-between py-2">
                  <View className="flex-1">
                    <Text className="text-foreground">{option.label}</Text>
                    <Text className="text-muted-foreground text-sm">
                      {option.description}
                    </Text>
                  </View>

                  <View
                    className={cn(
                      'w-5 h-5 rounded-full border-2',
                      walletSettings.priorityFees === option.value
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground',
                    )}>
                    {walletSettings.priorityFees === option.value && (
                      <View className="w-2 h-2 bg-white rounded-full m-auto" />
                    )}
                  </View>
                </Pressable>
              ))}

              {/* Custom Priority Fee Input */}
              {walletSettings.priorityFees === 'custom' && (
                <View className="mt-4 pt-4 border-t border-border">
                  <Text className="text-foreground font-medium mb-2">
                    Custom Priority Fee (SOL)
                  </Text>
                  <View className="flex-row space-x-2">
                    <TextInput
                      value={customPriorityFee}
                      onChangeText={setCustomPriorityFee}
                      placeholder="0.001"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="decimal-pad"
                      className="flex-1 px-3 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: colors.muted,
                        color: colors.foreground,
                      }}
                    />
                    <Button
                      size="sm"
                      onPress={handleCustomPriorityFeeSave}
                      disabled={saving}>
                      Save
                    </Button>
                  </View>
                </View>
              )}
            </View>

            {/* Slippage Tolerance */}
            <View className="mb-6 pt-6 border-t border-border">
              <Text className="text-foreground font-medium mb-2">
                Slippage Tolerance
              </Text>
              <Text className="text-muted-foreground text-sm mb-4">
                Maximum price movement you'll accept
              </Text>
              <View className="flex-row space-x-2">
                <TextInput
                  value={slippage}
                  onChangeText={setSlippage}
                  placeholder="0.5"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="decimal-pad"
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                  }}
                />
                <View
                  className="px-3 py-2 rounded-lg"
                  style={{backgroundColor: colors.muted}}>
                  <Text className="text-foreground">%</Text>
                </View>
                <Button
                  size="sm"
                  onPress={handleSlippageSave}
                  disabled={saving}>
                  Save
                </Button>
              </View>
            </View>

            {/* Auto-Approve Limit */}
            <View className="pt-6 border-t border-border">
              <Text className="text-foreground font-medium mb-2">
                Auto-Approve Limit
              </Text>
              <Text className="text-muted-foreground text-sm mb-4">
                Automatically approve transactions under this amount
              </Text>
              <View className="flex-row space-x-2">
                <TextInput
                  value={autoApproveLimit}
                  onChangeText={setAutoApproveLimit}
                  placeholder="0.1"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="decimal-pad"
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                  }}
                />
                <View
                  className="px-3 py-2 rounded-lg"
                  style={{backgroundColor: colors.muted}}>
                  <Text className="text-foreground">SOL</Text>
                </View>
                <Button
                  size="sm"
                  onPress={handleAutoApproveLimitSave}
                  disabled={saving}>
                  Save
                </Button>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="mx-4 mb-8">
          <CardHeader>
            <CardTitle>
              <View className="flex-row items-center">
                <DollarSign size={20} color={colors.foreground} />
                <Text className="text-lg font-semibold text-foreground ml-2">
                  Display Settings
                </Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-foreground font-medium">
                  Show Balance in USD
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Display balance value in USD alongside SOL
                </Text>
              </View>
              <Switch
                value={walletSettings.showBalanceInUsd}
                onValueChange={async value => {
                  setSaving(true);
                  try {
                    await updateSettings('wallet', {showBalanceInUsd: value});
                  } catch (error) {
                    Alert.alert('Error', 'Failed to update display setting');
                  } finally {
                    setSaving(false);
                  }
                }}
                trackColor={{true: colors.primary, false: colors.muted}}
                thumbColor={colors.foreground}
                disabled={saving}
              />
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
