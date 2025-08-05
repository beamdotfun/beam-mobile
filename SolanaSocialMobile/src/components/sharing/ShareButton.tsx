import React, {useState} from 'react';
import {TouchableOpacity} from 'react-native';
import {Share} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {ShareSheet} from './ShareSheet';

interface ShareButtonProps {
  type: 'post' | 'profile' | 'brand' | 'auction';
  id: string;
  title?: string;
  message?: string;
  size?: number;
  className?: string;
}

export function ShareButton({
  type,
  id,
  title,
  message,
  size = 20,
  className,
}: ShareButtonProps) {
  const {colors} = useThemeStore();
  const [showShareSheet, setShowShareSheet] = useState(false);

  const handleShare = () => {
    setShowShareSheet(true);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleShare}
        className={className}
        accessibilityLabel={`Share ${type}`}
        accessibilityRole="button">
        <Share size={size} color={colors.mutedForeground} />
      </TouchableOpacity>

      <ShareSheet
        visible={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        type={type}
        id={id}
        title={title}
        message={message}
      />
    </>
  );
}
