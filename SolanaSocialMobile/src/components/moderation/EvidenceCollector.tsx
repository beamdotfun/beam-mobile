import React, {useState} from 'react';
import {View, Alert} from 'react-native';
import {Camera, Image, Link, FileText, Upload, X} from 'lucide-react-native';
import {Button} from '../ui/button';
import {Card} from '../ui/card';
import {Text} from '../ui/text';
import {Input} from '../ui/input';
import {Textarea} from '../ui/textarea';
import {LoadingSpinner} from '../ui/loading-spinner';
import {ReportEvidence, EvidenceType} from '../../types/advanced-moderation';
import {useAdvancedModerationStore} from '../../stores/advancedModerationStore';
import * as ImagePicker from 'react-native-image-picker';
import {cn} from '../../lib/utils';

interface EvidenceCollectorProps {
  requiredTypes?: EvidenceType[];
  onEvidenceAdded: (evidence: Omit<ReportEvidence, 'id' | 'verified'>) => void;
  maxItems?: number;
  currentCount?: number;
}

export const EvidenceCollector: React.FC<EvidenceCollectorProps> = ({
  requiredTypes = ['screenshot', 'url', 'description'],
  onEvidenceAdded,
  maxItems = 5,
  currentCount = 0,
}) => {
  const {uploadEvidence, isUploadingEvidence} = useAdvancedModerationStore();
  const [activeType, setActiveType] = useState<EvidenceType | null>(null);
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [txHash, setTxHash] = useState('');

  const handleImageSelection = async (useCamera: boolean) => {
    if (currentCount >= maxItems) {
      Alert.alert(
        'Limit Reached',
        `You can only add up to ${maxItems} pieces of evidence`,
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.8,
    };

    const launchMethod = useCamera
      ? ImagePicker.launchCamera
      : ImagePicker.launchImageLibrary;

    launchMethod(options, async response => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.base64) {
          try {
            // In a real app, upload to server and get URL
            const imageUrl = await uploadEvidence(asset, 'image');

            onEvidenceAdded({
              type: 'screenshot',
              data: imageUrl,
              description: `${useCamera ? 'Photo' : 'Screenshot'} evidence`,
              timestamp: new Date().toISOString(),
            });

            setActiveType(null);
          } catch (error) {
            Alert.alert(
              'Upload Failed',
              'Failed to upload image. Please try again.',
            );
          }
        }
      }
    });
  };

  const handleUrlSubmit = () => {
    if (!url.trim()) {
      Alert.alert('Invalid URL', 'Please enter a valid URL');
      return;
    }

    onEvidenceAdded({
      type: 'url',
      data: url,
      description: 'Related URL',
      timestamp: new Date().toISOString(),
    });

    setUrl('');
    setActiveType(null);
  };

  const handleDescriptionSubmit = () => {
    if (!description.trim() || description.length < 10) {
      Alert.alert(
        'Invalid Description',
        'Please provide at least 10 characters',
      );
      return;
    }

    onEvidenceAdded({
      type: 'description',
      data: description,
      description: 'Additional details',
      timestamp: new Date().toISOString(),
    });

    setDescription('');
    setActiveType(null);
  };

  const handleTxHashSubmit = () => {
    if (!txHash.trim() || txHash.length < 10) {
      Alert.alert(
        'Invalid Transaction',
        'Please enter a valid transaction hash',
      );
      return;
    }

    onEvidenceAdded({
      type: 'blockchain_tx',
      data: txHash,
      description: 'Blockchain transaction',
      timestamp: new Date().toISOString(),
    });

    setTxHash('');
    setActiveType(null);
  };

  const renderEvidenceTypeButton = (
    type: EvidenceType,
    icon: any,
    label: string,
  ) => {
    const isActive = activeType === type;
    const isRequired = requiredTypes.includes(type);

    return (
      <Button
        variant={isActive ? 'default' : 'outline'}
        onPress={() => setActiveType(isActive ? null : type)}
        disabled={currentCount >= maxItems}
        className="flex-1">
        {React.createElement(icon, {
          size: 16,
          color: isActive ? '#FFFFFF' : '#6B7280',
        })}
        <Text className={cn('ml-2 text-sm', isActive && 'text-white')}>
          {label}
        </Text>
        {isRequired && (
          <Text
            className={cn(
              'ml-1 text-xs',
              isActive ? 'text-white' : 'text-red-500',
            )}>
            *
          </Text>
        )}
      </Button>
    );
  };

  const renderActiveInput = () => {
    if (!activeType) {
      return null;
    }

    switch (activeType) {
      case 'screenshot':
        return (
          <Card className="p-4 bg-gray-50 space-y-3">
            <Text className="font-medium text-gray-900">Add Screenshot</Text>
            <View className="flex-row space-x-2">
              <Button
                variant="outline"
                onPress={() => handleImageSelection(false)}
                disabled={isUploadingEvidence}
                className="flex-1">
                <Image size={16} />
                <Text className="ml-2">Choose from Gallery</Text>
              </Button>
              <Button
                variant="outline"
                onPress={() => handleImageSelection(true)}
                disabled={isUploadingEvidence}
                className="flex-1">
                <Camera size={16} />
                <Text className="ml-2">Take Photo</Text>
              </Button>
            </View>
            {isUploadingEvidence && (
              <View className="items-center py-2">
                <LoadingSpinner size="small" />
                <Text className="text-sm text-gray-600 mt-1">Uploading...</Text>
              </View>
            )}
          </Card>
        );

      case 'url':
        return (
          <Card className="p-4 bg-gray-50 space-y-3">
            <Text className="font-medium text-gray-900">Add URL Evidence</Text>
            <Input
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com/evidence"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View className="flex-row space-x-2">
              <Button
                variant="outline"
                onPress={() => setActiveType(null)}
                className="flex-1">
                <Text>Cancel</Text>
              </Button>
              <Button
                onPress={handleUrlSubmit}
                disabled={!url.trim()}
                className="flex-1">
                <Text className="text-white">Add URL</Text>
              </Button>
            </View>
          </Card>
        );

      case 'description':
        return (
          <Card className="p-4 bg-gray-50 space-y-3">
            <Text className="font-medium text-gray-900">Add Description</Text>
            <Textarea
              value={description}
              onChangeText={setDescription}
              placeholder="Provide additional details about the violation..."
              className="min-h-[100px]"
              maxLength={300}
            />
            <Text className="text-xs text-gray-500 text-right">
              {description.length}/300
            </Text>
            <View className="flex-row space-x-2">
              <Button
                variant="outline"
                onPress={() => setActiveType(null)}
                className="flex-1">
                <Text>Cancel</Text>
              </Button>
              <Button
                onPress={handleDescriptionSubmit}
                disabled={description.length < 10}
                className="flex-1">
                <Text className="text-white">Add Description</Text>
              </Button>
            </View>
          </Card>
        );

      case 'blockchain_tx':
        return (
          <Card className="p-4 bg-gray-50 space-y-3">
            <Text className="font-medium text-gray-900">
              Add Transaction Hash
            </Text>
            <Input
              value={txHash}
              onChangeText={setTxHash}
              placeholder="Transaction hash..."
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View className="flex-row space-x-2">
              <Button
                variant="outline"
                onPress={() => setActiveType(null)}
                className="flex-1">
                <Text>Cancel</Text>
              </Button>
              <Button
                onPress={handleTxHashSubmit}
                disabled={txHash.length < 10}
                className="flex-1">
                <Text className="text-white">Add Transaction</Text>
              </Button>
            </View>
          </Card>
        );
    }
  };

  return (
    <View className="space-y-3">
      {/* Evidence Type Buttons */}
      <View className="flex-row flex-wrap gap-2">
        {renderEvidenceTypeButton('screenshot', Image, 'Screenshot')}
        {renderEvidenceTypeButton('url', Link, 'URL')}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {renderEvidenceTypeButton('description', FileText, 'Description')}
        {renderEvidenceTypeButton('blockchain_tx', Upload, 'Transaction')}
      </View>

      {/* Active Input */}
      {renderActiveInput()}

      {/* Evidence Count */}
      {currentCount > 0 && (
        <Text className="text-sm text-gray-600 text-center">
          {currentCount}/{maxItems} evidence items added
        </Text>
      )}
    </View>
  );
};
