import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import {X, Flag, AlertTriangle} from 'lucide-react-native';
import {useReportingStore} from '../../store/reportingStore';
import {ReportReason, ReportOption} from '../../types/reporting';
import {useThemeStore} from '../../store/themeStore';
import {useWalletStore} from '../../store/wallet';
import {Button} from '../ui/button';
import {Card, CardContent} from '../ui/card';
import {cn} from '../../utils/cn';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  contentId: string;
  contentType: 'post' | 'profile';
  reportedUserWallet: string;
}

export function ReportModal({
  visible,
  onClose,
  contentId,
  contentType,
  reportedUserWallet,
}: ReportModalProps) {
  const {colors} = useThemeStore();
  const {publicKey} = useWalletStore();
  const {submitReport, isSubmitting, error, clearError} = useReportingStore();

  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
    null,
  );
  const [description, setDescription] = useState('');

  const reportOptions: ReportOption[] = [
    {
      value: 'spam',
      label: 'Spam',
      description: 'Repetitive or unwanted content',
    },
    {
      value: 'harassment',
      label: 'Harassment',
      description: 'Bullying or targeted harassment',
    },
    {
      value: 'hate_speech',
      label: 'Hate Speech',
      description: 'Content that attacks people based on identity',
    },
    {
      value: 'violence',
      label: 'Violence',
      description: 'Threats or incitement to violence',
    },
    {
      value: 'inappropriate_content',
      label: 'Inappropriate Content',
      description: 'Adult or inappropriate material',
    },
    {
      value: 'misinformation',
      label: 'Misinformation',
      description: 'False or misleading information',
    },
    {
      value: 'copyright',
      label: 'Copyright',
      description: 'Unauthorized use of copyrighted material',
    },
    {
      value: 'fraud',
      label: 'Fraud',
      description: 'Scams or fraudulent activity',
    },
    {
      value: 'impersonation',
      label: 'Impersonation',
      description: 'Pretending to be someone else',
    },
    {
      value: 'other',
      label: 'Other',
      description: 'Other policy violations',
    },
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for the report');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    if (!publicKey) {
      Alert.alert('Error', 'Please connect your wallet to submit a report');
      return;
    }

    try {
      await submitReport({
        contentId,
        contentType,
        reportedUserWallet,
        reason: selectedReason,
        description: description.trim(),
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. Your report has been submitted and will be reviewed.',
        [{text: 'OK', onPress: handleClose}],
      );
    } catch (error) {
      Alert.alert(
        'Submission Failed',
        'There was an issue submitting your report. It has been saved and will be retried automatically.',
      );
    }
  };

  const handleClose = () => {
    onClose();
    clearError();
    setSelectedReason(null);
    setDescription('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <View className="flex-1" style={{backgroundColor: colors.background}}>
        {/* Header */}
        <View className="border-b border-border px-4 py-3">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center space-x-2">
              <Flag size={20} color={colors.destructive} />
              <Text className="text-lg font-semibold text-foreground">
                Report {contentType === 'post' ? 'Post' : 'Profile'}
              </Text>
            </View>

            <Pressable onPress={handleClose} className="p-2">
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {/* Reason Selection */}
          <View className="mb-6">
            <Text className="text-base font-medium text-foreground mb-3">
              Why are you reporting this {contentType}?
            </Text>

            <View className="space-y-2">
              {reportOptions.map(option => (
                <Pressable
                  key={option.value}
                  onPress={() => setSelectedReason(option.value)}
                  className={cn(
                    'p-4 rounded-lg border',
                    selectedReason === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card',
                  )}>
                  <View className="flex-1">
                    <Text
                      className={cn(
                        'font-medium',
                        selectedReason === option.value
                          ? 'text-primary'
                          : 'text-foreground',
                      )}>
                      {option.label}
                    </Text>
                    <Text
                      className={cn(
                        'text-sm mt-1',
                        selectedReason === option.value
                          ? 'text-primary/80'
                          : 'text-muted-foreground',
                      )}>
                      {option.description}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-base font-medium text-foreground mb-3">
              Additional Information
            </Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              placeholder="Please provide additional details about why you're reporting this content..."
              placeholderTextColor={colors.mutedForeground}
              className="border border-border rounded-lg p-3 text-foreground"
              style={{
                textAlignVertical: 'top',
                color: colors.foreground,
                backgroundColor: colors.background,
              }}
              maxLength={500}
            />
            <Text className="text-xs text-muted-foreground mt-1">
              {description.length}/500 characters
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <View className="flex-row items-center space-x-2">
                <AlertTriangle size={16} color={colors.destructive} />
                <Text className="text-destructive text-sm flex-1">{error}</Text>
              </View>
            </View>
          )}

          {/* Guidelines */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Reporting Guidelines
              </Text>
              <View className="space-y-1">
                <Text className="text-xs text-muted-foreground">
                  • Reports are recorded on the Solana blockchain
                </Text>
                <Text className="text-xs text-muted-foreground">
                  • False reports may result in account restrictions
                </Text>
                <Text className="text-xs text-muted-foreground">
                  • We'll keep your report confidential
                </Text>
                <Text className="text-xs text-muted-foreground">
                  • Reports help maintain community standards
                </Text>
              </View>
            </CardContent>
          </Card>
        </ScrollView>

        {/* Submit Button */}
        <View className="border-t border-border p-4">
          <Button
            onPress={handleSubmit}
            disabled={
              !selectedReason ||
              !description.trim() ||
              isSubmitting ||
              !publicKey
            }
            className="w-full">
            <Text className="text-primary-foreground font-medium">
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Text>
          </Button>

          {!publicKey && (
            <Text className="text-muted-foreground text-xs text-center mt-2">
              Connect your wallet to submit reports
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
