import React, {useState} from 'react';
import {Pressable, Text} from 'react-native';
import {MessageSquareQuote} from 'lucide-react-native';
import {QuotePostModal} from './QuotePostModal';
import {QuoteablePost} from '../../types/post-quoting';

interface QuotePostButtonProps {
  post: QuoteablePost;
  size?: 'sm' | 'md';
  showCount?: boolean;
  variant?: 'icon' | 'text' | 'both';
}

export const QuotePostButton: React.FC<QuotePostButtonProps> = ({
  post,
  size = 'md',
  showCount = true,
  variant = 'both',
}) => {
  const [showModal, setShowModal] = useState(false);

  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <>
      <Pressable
        onPress={() => setShowModal(true)}
        className="flex-row items-center space-x-1 p-2 rounded-lg">
        {(variant === 'icon' || variant === 'both') && (
          <MessageSquareQuote size={iconSize} color="#6B7280" />
        )}
        {showCount && post.engagement.quotes > 0 && (
          <Text className="text-gray-600 text-sm">
            {post.engagement.quotes}
          </Text>
        )}
        {(variant === 'text' || (variant === 'both' && !showCount)) && (
          <Text className="text-gray-600 text-sm">Quote</Text>
        )}
      </Pressable>

      <QuotePostModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        post={post}
      />
    </>
  );
};
