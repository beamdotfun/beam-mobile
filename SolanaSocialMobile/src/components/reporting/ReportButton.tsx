import React, {useState} from 'react';
import {Pressable, Text} from 'react-native';
import {Flag} from 'lucide-react-native';
import {ReportModal} from './ReportModal';
import {useThemeStore} from '../../store/themeStore';
import {useWalletStore} from '../../store/wallet';
import {cn} from '../../utils/cn';

interface ReportButtonProps {
  contentId: string;
  contentType: 'post' | 'profile';
  reportedUserWallet: string;
  size?: 'sm' | 'md';
  variant?: 'icon' | 'text' | 'both';
  className?: string;
  onPress?: () => void;
}

export function ReportButton({
  contentId,
  contentType,
  reportedUserWallet,
  size = 'md',
  variant = 'icon',
  className,
  onPress,
}: ReportButtonProps) {
  const {colors} = useThemeStore();
  const {publicKey} = useWalletStore();
  const [showModal, setShowModal] = useState(false);

  const iconSize = size === 'sm' ? 16 : 20;

  // Don't show report button for own content
  if (publicKey?.toString() === reportedUserWallet) {
    return null;
  }

  return (
    <>
      <Pressable
        onPress={() => {
          onPress?.();
          setShowModal(true);
        }}
        className={cn(
          'flex-row items-center space-x-1 p-2 rounded-lg',
          className,
        )}>
        {(variant === 'icon' || variant === 'both') && (
          <Flag size={iconSize} color={colors.mutedForeground} />
        )}
        {(variant === 'text' || variant === 'both') && (
          <Text className="text-muted-foreground text-sm">Report</Text>
        )}
      </Pressable>

      <ReportModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        contentId={contentId}
        contentType={contentType}
        reportedUserWallet={reportedUserWallet}
      />
    </>
  );
}
