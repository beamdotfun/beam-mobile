import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import {Heart, DollarSign, Send, X, Zap} from 'lucide-react-native';
import {useTipStore} from '../../store/tipStore';
import {useThemeStore} from '../../store/themeStore';
import {TipButtonProps} from '../../types/tips';
import {Button} from '../ui/button';
import {Card} from '../ui/card';
import {Switch} from '../ui/switch';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export function TipButton({
  targetWallet,
  targetType,
  targetId,
  disabled = false,
  variant = 'default',
  showAmount = false,
  onTipSent,
}: TipButtonProps) {
  const {colors} = useThemeStore();
  const {
    modalState,
    config,
    solPrice,
    openTipModal,
    closeTipModal,
    updateModalState,
    sendTip,
    convertSOLToUSD,
    formatTipAmount,
    formatTipAmountUSD,
    validateTipAmount,
  } = useTipStore();

  const [customAmountInput, setCustomAmountInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (modalState.isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [modalState.isVisible]);

  const handleButtonPress = () => {
    if (disabled) {
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    openTipModal(targetWallet, targetType, targetId);
  };

  const handlePresetSelect = (amount: number) => {
    updateModalState({
      selectedAmount: amount,
      step: 'message',
    });
    setIsCustomMode(false);
  };

  const handleCustomAmountConfirm = () => {
    const amount = parseFloat(customAmountInput);
    const validation = validateTipAmount(amount);

    if (!validation.valid) {
      Alert.alert('Invalid Amount', validation.error);
      return;
    }

    updateModalState({
      selectedAmount: amount,
      step: 'message',
    });
    setIsCustomMode(false);
  };

  const handleSendTip = async () => {
    if (!modalState.selectedAmount) {
      return;
    }

    try {
      const tip = await sendTip(
        targetWallet,
        targetType,
        targetId,
        modalState.selectedAmount,
        modalState.message,
        modalState.isAnonymous,
      );

      onTipSent?.(tip);

      setTimeout(() => {
        closeTipModal();
      }, 2000);
    } catch (error) {
      console.error('Failed to send tip:', error);
    }
  };

  const renderButton = () => {
    const baseClasses = 'flex-row items-center justify-center rounded-full';

    if (variant === 'compact') {
      return (
        <Animated.View style={{transform: [{scale: buttonScaleAnim}]}}>
          <TouchableOpacity
            onPress={handleButtonPress}
            disabled={disabled}
            className={`${baseClasses} px-3 py-2`}
            style={{
              backgroundColor: disabled ? colors.muted : colors.primary,
              opacity: disabled ? 0.5 : 1,
            }}>
            <Heart size={16} color={colors.primaryForeground} />
            {showAmount && (
              <Text
                className="ml-1 text-xs font-medium"
                style={{color: colors.primaryForeground}}>
                Tip
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (variant === 'floating') {
      return (
        <Animated.View
          style={{
            transform: [{scale: buttonScaleAnim}],
            position: 'absolute',
            right: 16,
            bottom: 16,
            shadowColor: colors.foreground,
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
          <TouchableOpacity
            onPress={handleButtonPress}
            disabled={disabled}
            className={`${baseClasses} w-14 h-14`}
            style={{
              backgroundColor: disabled ? colors.muted : colors.primary,
              opacity: disabled ? 0.5 : 1,
            }}>
            <Zap size={24} color={colors.primaryForeground} />
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // Default variant
    return (
      <Animated.View style={{transform: [{scale: buttonScaleAnim}]}}>
        <TouchableOpacity
          onPress={handleButtonPress}
          disabled={disabled}
          className={`${baseClasses} px-4 py-3`}
          style={{
            backgroundColor: disabled ? colors.muted : colors.primary,
            opacity: disabled ? 0.5 : 1,
          }}>
          <Heart size={20} color={colors.primaryForeground} />
          <Text
            className="ml-2 text-sm font-medium"
            style={{color: colors.primaryForeground}}>
            Send Tip
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderAmountStep = () => (
    <View className="p-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text
          className="text-lg font-semibold"
          style={{color: colors.foreground}}>
          Choose Amount
        </Text>
        <TouchableOpacity onPress={closeTipModal}>
          <X size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {solPrice && (
        <View
          className="mb-4 p-3 rounded-lg"
          style={{backgroundColor: colors.muted}}>
          <Text
            className="text-sm text-center"
            style={{color: colors.mutedForeground}}>
            SOL: ${solPrice.price.toFixed(2)} (
            {solPrice.change24h > 0 ? '+' : ''}
            {solPrice.change24h.toFixed(2)}%)
          </Text>
        </View>
      )}

      <ScrollView className="mb-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between">
          {config.presets.map(preset => (
            <TouchableOpacity
              key={preset.amount}
              onPress={() => handlePresetSelect(preset.amount)}
              className="w-[48%] mb-3 p-4 rounded-lg border"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}>
              <Text className="text-2xl text-center mb-2">{preset.emoji}</Text>
              <Text
                className="text-sm font-medium text-center"
                style={{color: colors.foreground}}>
                {preset.label}
              </Text>
              <Text
                className="text-xs text-center"
                style={{color: colors.mutedForeground}}>
                {formatTipAmount(preset.amount)}
              </Text>
              {config.showUSDValues && (
                <Text
                  className="text-xs text-center"
                  style={{color: colors.mutedForeground}}>
                  {formatTipAmountUSD(convertSOLToUSD(preset.amount))}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => setIsCustomMode(true)}
        className="mb-4 p-4 rounded-lg border border-dashed"
        style={{borderColor: colors.border}}>
        <Text className="text-center" style={{color: colors.foreground}}>
          Custom Amount
        </Text>
      </TouchableOpacity>

      {isCustomMode && (
        <View
          className="mb-4 p-4 rounded-lg"
          style={{backgroundColor: colors.card}}>
          <Text className="mb-2 font-medium" style={{color: colors.foreground}}>
            Enter Custom Amount (SOL)
          </Text>
          <TextInput
            value={customAmountInput}
            onChangeText={setCustomAmountInput}
            placeholder="0.001"
            keyboardType="decimal-pad"
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
            }}
          />
          <View className="flex-row mt-3 space-x-2">
            <Button
              variant="outline"
              onPress={() => setIsCustomMode(false)}
              className="flex-1">
              Cancel
            </Button>
            <Button
              onPress={handleCustomAmountConfirm}
              disabled={!customAmountInput}
              className="flex-1">
              Confirm
            </Button>
          </View>
        </View>
      )}
    </View>
  );

  const renderMessageStep = () => (
    <View className="p-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text
          className="text-lg font-semibold"
          style={{color: colors.foreground}}>
          Add Message
        </Text>
        <TouchableOpacity onPress={closeTipModal}>
          <X size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View
        className="mb-4 p-4 rounded-lg"
        style={{backgroundColor: colors.muted}}>
        <Text
          className="text-center text-lg font-medium"
          style={{color: colors.foreground}}>
          {formatTipAmount(modalState.selectedAmount)}
        </Text>
        {config.showUSDValues && (
          <Text
            className="text-center text-sm"
            style={{color: colors.mutedForeground}}>
            {formatTipAmountUSD(convertSOLToUSD(modalState.selectedAmount))}
          </Text>
        )}
      </View>

      <TextInput
        value={modalState.message}
        onChangeText={text => updateModalState({message: text})}
        placeholder="Add a nice message (optional)"
        multiline
        maxLength={280}
        className="p-3 rounded-lg border mb-4 min-h-[100px]"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
          color: colors.foreground,
          textAlignVertical: 'top',
        }}
      />

      <View className="flex-row items-center justify-between mb-6">
        <Text style={{color: colors.foreground}}>Send anonymously</Text>
        <Switch
          value={modalState.isAnonymous}
          onValueChange={value => updateModalState({isAnonymous: value})}
        />
      </View>

      <View className="flex-row space-x-3">
        <Button
          variant="outline"
          onPress={() => updateModalState({step: 'amount'})}
          className="flex-1">
          Back
        </Button>
        <Button
          onPress={() => updateModalState({step: 'confirm'})}
          className="flex-1">
          Continue
        </Button>
      </View>
    </View>
  );

  const renderConfirmStep = () => (
    <View className="p-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text
          className="text-lg font-semibold"
          style={{color: colors.foreground}}>
          Confirm Tip
        </Text>
        <TouchableOpacity onPress={closeTipModal}>
          <X size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <Card className="p-4 mb-6">
        <View className="items-center">
          <Text
            className="text-2xl font-bold mb-2"
            style={{color: colors.foreground}}>
            {formatTipAmount(modalState.selectedAmount)}
          </Text>
          {config.showUSDValues && (
            <Text className="text-lg" style={{color: colors.mutedForeground}}>
              {formatTipAmountUSD(convertSOLToUSD(modalState.selectedAmount))}
            </Text>
          )}
        </View>

        {modalState.message && (
          <View
            className="mt-4 p-3 rounded-lg"
            style={{backgroundColor: colors.muted}}>
            <Text style={{color: colors.foreground}}>
              "{modalState.message}"
            </Text>
          </View>
        )}

        <View className="mt-4 flex-row justify-between">
          <Text style={{color: colors.mutedForeground}}>Network Fee:</Text>
          <Text style={{color: colors.foreground}}>
            {formatTipAmount(config.networkFeeEstimate)}
          </Text>
        </View>

        <View className="mt-2 flex-row justify-between">
          <Text style={{color: colors.mutedForeground}}>Anonymous:</Text>
          <Text style={{color: colors.foreground}}>
            {modalState.isAnonymous ? 'Yes' : 'No'}
          </Text>
        </View>
      </Card>

      <View className="flex-row space-x-3">
        <Button
          variant="outline"
          onPress={() => updateModalState({step: 'message'})}
          className="flex-1">
          Back
        </Button>
        <Button
          onPress={handleSendTip}
          disabled={modalState.isLoading}
          className="flex-1">
          <Send size={16} color={colors.primaryForeground} />
          <Text className="ml-2" style={{color: colors.primaryForeground}}>
            {modalState.isLoading ? 'Sending...' : 'Send Tip'}
          </Text>
        </Button>
      </View>
    </View>
  );

  const renderProcessingStep = () => (
    <View className="p-6 items-center">
      <View className="mb-6">
        <Animated.View
          style={{
            transform: [
              {
                rotate: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          }}>
          <Zap size={48} color={colors.primary} />
        </Animated.View>
      </View>

      <Text
        className="text-lg font-semibold mb-2"
        style={{color: colors.foreground}}>
        Sending Tip...
      </Text>
      <Text className="text-center" style={{color: colors.mutedForeground}}>
        Please wait while we process your transaction
      </Text>
    </View>
  );

  const renderSuccessStep = () => (
    <View className="p-6 items-center">
      <View className="mb-6">
        <Heart size={48} color={colors.primary} />
      </View>

      <Text
        className="text-lg font-semibold mb-2"
        style={{color: colors.foreground}}>
        Tip Sent Successfully!
      </Text>
      <Text
        className="text-center mb-4"
        style={{color: colors.mutedForeground}}>
        Your tip of {formatTipAmount(modalState.selectedAmount)} has been sent
      </Text>

      <Button onPress={closeTipModal}>Done</Button>
    </View>
  );

  const renderErrorStep = () => (
    <View className="p-6 items-center">
      <View className="mb-6">
        <X size={48} color={colors.destructive} />
      </View>

      <Text
        className="text-lg font-semibold mb-2"
        style={{color: colors.foreground}}>
        Failed to Send Tip
      </Text>
      <Text
        className="text-center mb-4"
        style={{color: colors.mutedForeground}}>
        {modalState.error || 'Something went wrong. Please try again.'}
      </Text>

      <View className="flex-row space-x-3">
        <Button variant="outline" onPress={closeTipModal} className="flex-1">
          Cancel
        </Button>
        <Button
          onPress={() => updateModalState({step: 'confirm', error: undefined})}
          className="flex-1">
          Try Again
        </Button>
      </View>
    </View>
  );

  const renderModalContent = () => {
    switch (modalState.step) {
      case 'amount':
        return renderAmountStep();
      case 'message':
        return renderMessageStep();
      case 'confirm':
        return renderConfirmStep();
      case 'processing':
        return renderProcessingStep();
      case 'success':
        return renderSuccessStep();
      case 'error':
        return renderErrorStep();
      default:
        return renderAmountStep();
    }
  };

  return (
    <>
      {renderButton()}

      <Modal
        visible={modalState.isVisible}
        transparent
        statusBarTranslucent
        animationType="none">
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: fadeAnim,
          }}>
          <View className="flex-1 justify-end">
            <Animated.View
              style={{
                transform: [{translateY: slideAnim}],
                backgroundColor: colors.background,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: screenHeight * 0.9,
              }}>
              {renderModalContent()}
            </Animated.View>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}
