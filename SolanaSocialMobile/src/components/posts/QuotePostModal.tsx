import React, {useState} from 'react';
import {View, Text, Modal, TextInput, ScrollView, Alert} from 'react-native';
import {usePostQuotingStore} from '../../store/postQuotingStore';
import {QuoteablePost, QuoteType} from '../../types/post-quoting';
import {Button} from '../ui/button';
import {Card} from '../ui/card';
import {QuotePreview} from './QuotePreview';

interface QuotePostModalProps {
  visible: boolean;
  onClose: () => void;
  post: QuoteablePost;
}

export const QuotePostModal: React.FC<QuotePostModalProps> = ({
  visible,
  onClose,
  post,
}) => {
  const {quotePost, modalState, updateModalState, closeQuoteModal} =
    usePostQuotingStore();
  const [userContent, setUserContent] = useState('');
  const [selectedQuoteType, setSelectedQuoteType] =
    useState<QuoteType>('neutral');

  const quoteTypes: {value: QuoteType; label: string; description: string}[] = [
    {value: 'agree', label: 'Agree', description: 'I agree with this post'},
    {
      value: 'disagree',
      label: 'Disagree',
      description: 'I disagree with this post',
    },
    {
      value: 'add_context',
      label: 'Add Context',
      description: 'Adding additional information',
    },
    {value: 'share', label: 'Share', description: 'Sharing with my followers'},
    {
      value: 'question',
      label: 'Question',
      description: 'I have a question about this',
    },
    {
      value: 'neutral',
      label: 'Comment',
      description: 'General comment or response',
    },
  ];

  const handleSubmit = async () => {
    if (!userContent.trim()) {
      Alert.alert('Error', 'Please add your thoughts about this post');
      return;
    }

    try {
      await quotePost(post.id, selectedQuoteType, userContent.trim());
      Alert.alert('Success', 'Post quoted successfully!');
      onClose();

      // Reset form
      setUserContent('');
      setSelectedQuoteType('neutral');
    } catch (error) {
      Alert.alert('Error', 'Failed to quote post');
    }
  };

  const handleClose = () => {
    onClose();
    closeQuoteModal();
    setUserContent('');
    setSelectedQuoteType('neutral');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="border-b border-gray-200 p-4">
          <View className="flex-row justify-between items-center">
            <Button variant="ghost" onPress={handleClose}>
              <Text className="text-gray-600">Cancel</Text>
            </Button>
            <Text className="text-lg font-semibold">Quote Post</Text>
            <Button
              onPress={handleSubmit}
              disabled={modalState.isLoading || !userContent.trim()}>
              <Text className="text-white font-medium">
                {modalState.isLoading ? 'Posting...' : 'Quote'}
              </Text>
            </Button>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* User Input */}
          <Card className="p-4 mb-4">
            <Text className="font-medium mb-2">Add your thoughts:</Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={userContent}
              onChangeText={setUserContent}
              placeholder="What do you think about this post?"
              className="text-base border border-gray-300 rounded-lg p-3"
              style={{textAlignVertical: 'top'}}
            />
          </Card>

          {/* Quote Type Selection */}
          <View className="mb-4">
            <Text className="font-medium mb-3">How are you responding?</Text>
            <View className="space-y-2">
              {quoteTypes.map(type => (
                <Button
                  key={type.value}
                  variant={
                    selectedQuoteType === type.value ? 'default' : 'outline'
                  }
                  className="justify-start p-3"
                  onPress={() => setSelectedQuoteType(type.value)}>
                  <View className="flex-1">
                    <Text
                      className={`font-medium ${
                        selectedQuoteType === type.value
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}>
                      {type.label}
                    </Text>
                    <Text
                      className={`text-sm ${
                        selectedQuoteType === type.value
                          ? 'text-gray-100'
                          : 'text-gray-600'
                      }`}>
                      {type.description}
                    </Text>
                  </View>
                </Button>
              ))}
            </View>
          </View>

          {/* Original Post Preview */}
          <View className="mb-4">
            <Text className="font-medium mb-2">Quoting:</Text>
            <QuotePreview post={post} />
          </View>

          {/* Error Message */}
          {modalState.error && (
            <View className="mb-4 p-3 bg-red-50 rounded-lg">
              <Text className="text-red-700 text-sm">{modalState.error}</Text>
            </View>
          )}

          {/* Quote Guidelines */}
          <Card className="p-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Quote Guidelines
            </Text>
            <Text className="text-xs text-gray-600">
              • Be respectful and constructive in your responses{'\n'}• Add
              meaningful context or perspective{'\n'}• Credit original authors
              appropriately{'\n'}• Follow community guidelines
            </Text>
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
};
