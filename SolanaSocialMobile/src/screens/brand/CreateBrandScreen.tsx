import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TextInput,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Upload, Palette, X} from 'lucide-react-native';
import {useBrandManagementStore} from '../../store/brandManagement';
import {
  BrandCreationRequest,
  BrandCategory,
  BrandVisibility,
} from '../../types/brand';
import {Button} from '../../components/ui/button';
import {Card, CardContent} from '../../components/ui/card';
import {Input} from '../../components/ui/input';
import {Badge} from '../../components/ui/badge';
import {Header} from '../../components/layout/Header';
import {Screen} from '../../components/layout/Screen';
import {useThemeStore} from '../../store/themeStore';
import {launchImageLibrary} from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';

interface CreateBrandScreenProps {
  navigation: any;
}

export default function CreateBrandScreen({
  navigation,
}: CreateBrandScreenProps) {
  const {colors} = useThemeStore();
  const {createBrand, isCreating, error, clearError} =
    useBrandManagementStore();

  const [formData, setFormData] = useState<BrandCreationRequest>({
    brandName: '',
    brandHandle: '',
    displayName: '',
    bio: '',
    category: 'lifestyle',
    tags: [],
    colors: {
      primary: '#3B82F6',
      secondary: '#64748B',
      accent: '#F59E0B',
    },
    visibility: 'public',
    allowFollowers: true,
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof BrandCreationRequest, value: any) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: ''}));
    }
  };

  const handleColorChange = (
    colorType: keyof typeof formData.colors,
    color: string,
  ) => {
    setFormData(prev => ({
      ...prev,
      colors: {...prev.colors, [colorType]: color},
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleImageUpload = (field: 'logoUrl' | 'bannerUrl') => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: field === 'logoUrl' ? 512 : 1200,
        maxHeight: field === 'logoUrl' ? 512 : 400,
      },
      response => {
        if (response.assets && response.assets[0]) {
          handleInputChange(field, response.assets[0].uri);
        }
      },
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.brandName.trim()) {
      newErrors.brandName = 'Brand name is required';
    }

    if (!formData.brandHandle.trim()) {
      newErrors.brandHandle = 'Brand handle is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.brandHandle)) {
      newErrors.brandHandle =
        'Handle can only contain letters, numbers, and underscores';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.length > 200) {
      newErrors.bio = 'Bio must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await createBrand(formData);
      Alert.alert('Success', 'Brand created successfully!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create brand. Please try again.');
    }
  };

  const categories: {value: BrandCategory; label: string}[] = [
    {value: 'technology', label: 'Technology'},
    {value: 'fashion', label: 'Fashion'},
    {value: 'food', label: 'Food & Beverage'},
    {value: 'travel', label: 'Travel'},
    {value: 'fitness', label: 'Fitness & Health'},
    {value: 'gaming', label: 'Gaming'},
    {value: 'music', label: 'Music'},
    {value: 'art', label: 'Art & Design'},
    {value: 'education', label: 'Education'},
    {value: 'business', label: 'Business'},
    {value: 'lifestyle', label: 'Lifestyle'},
    {value: 'entertainment', label: 'Entertainment'},
    {value: 'other', label: 'Other'},
  ];

  const ColorPicker = ({
    color,
    onColorChange,
  }: {
    color: string;
    onColorChange: (color: string) => void;
  }) => {
    const colorOptions = [
      '#3B82F6',
      '#8B5CF6',
      '#EF4444',
      '#F59E0B',
      '#10B981',
      '#F97316',
      '#EC4899',
      '#6366F1',
    ];

    return (
      <View className="flex-row flex-wrap gap-2">
        {colorOptions.map(colorOption => (
          <Pressable
            key={colorOption}
            onPress={() => onColorChange(colorOption)}
            className={`w-8 h-8 rounded-full border-2 ${
              color === colorOption ? 'border-foreground' : 'border-border'
            }`}
            style={{backgroundColor: colorOption}}
          />
        ))}
      </View>
    );
  };

  return (
    <Screen>
      <Header
        title="Create Brand"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Text className="text-lg font-semibold mb-4 text-foreground">
              Basic Information
            </Text>

            <View className="space-y-4">
              <Input
                label="Brand Name"
                value={formData.brandName}
                onChangeText={text => handleInputChange('brandName', text)}
                placeholder="Enter brand name"
                error={errors.brandName}
              />

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Brand Handle
                </Text>
                <View className="flex-row items-center border border-border rounded-lg px-3 py-2 bg-input">
                  <Text className="text-muted-foreground">@</Text>
                  <TextInput
                    className="flex-1 ml-1 text-foreground"
                    style={{color: colors.foreground}}
                    placeholder="brandhandle"
                    placeholderTextColor={colors.mutedForeground}
                    value={formData.brandHandle}
                    onChangeText={text =>
                      handleInputChange('brandHandle', text.toLowerCase())
                    }
                  />
                </View>
                {errors.brandHandle && (
                  <Text className="text-destructive text-xs mt-1">
                    {errors.brandHandle}
                  </Text>
                )}
              </View>

              <Input
                label="Display Name"
                value={formData.displayName}
                onChangeText={text => handleInputChange('displayName', text)}
                placeholder="How your brand appears to users"
                error={errors.displayName}
              />

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Bio
                </Text>
                <TextInput
                  className="border border-border rounded-lg px-3 py-2 bg-input text-foreground min-h-[80px]"
                  style={{color: colors.foreground, textAlignVertical: 'top'}}
                  placeholder="Tell people about your brand"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.bio}
                  onChangeText={text => handleInputChange('bio', text)}
                  multiline
                  maxLength={200}
                />
                <Text className="text-xs text-muted-foreground mt-1">
                  {formData.bio.length}/200 characters
                </Text>
                {errors.bio && (
                  <Text className="text-destructive text-xs mt-1">
                    {errors.bio}
                  </Text>
                )}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Category and Tags */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Text className="text-lg font-semibold mb-4 text-foreground">
              Category & Tags
            </Text>

            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Category
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-2">
                    {categories.map(category => (
                      <Pressable
                        key={category.value}
                        onPress={() =>
                          handleInputChange('category', category.value)
                        }>
                        <Badge
                          variant={
                            formData.category === category.value
                              ? 'default'
                              : 'secondary'
                          }
                          className="mr-2">
                          <Text
                            className={
                              formData.category === category.value
                                ? 'text-primary-foreground'
                                : 'text-muted-foreground'
                            }>
                            {category.label}
                          </Text>
                        </Badge>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Tags
                </Text>
                <View className="flex-row items-center space-x-2 mb-2">
                  <TextInput
                    className="flex-1 border border-border rounded-lg px-3 py-2 bg-input text-foreground"
                    style={{color: colors.foreground}}
                    placeholder="Add a tag"
                    placeholderTextColor={colors.mutedForeground}
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={addTag}
                  />
                  <Button size="sm" onPress={addTag}>
                    <Text className="text-primary-foreground">Add</Text>
                  </Button>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <View
                      key={tag}
                      className="bg-primary/10 px-2 py-1 rounded-full flex-row items-center">
                      <Text className="text-primary text-sm">{tag}</Text>
                      <Pressable
                        onPress={() => removeTag(tag)}
                        className="ml-1">
                        <X size={14} color={colors.primary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Visual Branding */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Text className="text-lg font-semibold mb-4 text-foreground">
              Visual Branding
            </Text>

            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Brand Colors
                </Text>
                <View className="space-y-3">
                  <View>
                    <Text className="text-sm text-muted-foreground mb-2">
                      Primary Color
                    </Text>
                    <ColorPicker
                      color={formData.colors.primary}
                      onColorChange={color =>
                        handleColorChange('primary', color)
                      }
                    />
                  </View>
                  <View>
                    <Text className="text-sm text-muted-foreground mb-2">
                      Secondary Color
                    </Text>
                    <ColorPicker
                      color={formData.colors.secondary}
                      onColorChange={color =>
                        handleColorChange('secondary', color)
                      }
                    />
                  </View>
                  <View>
                    <Text className="text-sm text-muted-foreground mb-2">
                      Accent Color
                    </Text>
                    <ColorPicker
                      color={formData.colors.accent}
                      onColorChange={color =>
                        handleColorChange('accent', color)
                      }
                    />
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Brand Logo
                </Text>
                <Pressable
                  onPress={() => handleImageUpload('logoUrl')}
                  className="h-32 border border-dashed border-border rounded-lg items-center justify-center bg-muted">
                  {formData.logoUrl ? (
                    <FastImage
                      source={{uri: formData.logoUrl}}
                      className="w-full h-full rounded-lg"
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  ) : (
                    <View className="items-center">
                      <Upload size={24} color={colors.mutedForeground} />
                      <Text className="text-muted-foreground text-sm mt-2">
                        Upload brand logo
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Text className="text-lg font-semibold mb-4 text-foreground">
              Brand Settings
            </Text>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Visibility
              </Text>
              <View className="space-y-2">
                {[
                  {
                    value: 'public',
                    label: 'Public',
                    description: 'Anyone can see your brand',
                  },
                  {
                    value: 'followers_only',
                    label: 'Followers Only',
                    description: 'Only followers can see your brand',
                  },
                  {
                    value: 'private',
                    label: 'Private',
                    description: 'Only you can see your brand',
                  },
                ].map(option => (
                  <Pressable
                    key={option.value}
                    onPress={() =>
                      handleInputChange(
                        'visibility',
                        option.value as BrandVisibility,
                      )
                    }
                    className={`p-3 rounded-lg border ${
                      formData.visibility === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}>
                    <Text className="font-medium text-foreground">
                      {option.label}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {option.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <View className="mb-8">
          <Button
            onPress={handleSubmit}
            disabled={isCreating}
            className="w-full">
            <Text className="text-primary-foreground">
              {isCreating ? 'Creating Brand...' : 'Create Brand'}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}
