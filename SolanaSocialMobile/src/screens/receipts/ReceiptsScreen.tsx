import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {
  Bookmark,
  BookmarkCheck,
  Search,
  Filter,
  Plus,
  ChevronDown,
  X,
  Edit3,
  Trash2,
  Folder,
  Check,
} from 'lucide-react-native';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {useThemeStore} from '../../store/themeStore';
import {useReceiptsStore} from '../../store/receiptsStore';
import {Avatar} from '../../components/ui/avatar';
import {Toast} from '../../components/ui/Toast';
import {FeedSkeleton} from '../../components/loading/FeedSkeleton';
import {EnhancedErrorState} from '../../components/ui/EnhancedErrorState';
import {useEnhancedRefresh} from '../../hooks/useEnhancedRefresh';
import {Receipt, ReceiptCategory} from '../../services/api/receipts';

interface ReceiptsScreenProps {
  navigation: any;
}

export default function ReceiptsScreen({navigation}: ReceiptsScreenProps) {
  const {colors} = useThemeStore();
  const {
    receipts,
    categories,
    isLoadingReceipts,
    hasMoreReceipts,
    error,
    loadReceipts,
    loadMoreReceipts,
    loadCategories,
    removeReceipt,
    updateReceipt,
    createCategory,
    clearError,
  } = useReceiptsStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showEditReceiptModal, setShowEditReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [showToast, setShowToast] = useState(false);
  
  // Prevent multiple simultaneous loads
  const loadingRef = useRef(false);

  // New category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');

  // Edit receipt form
  const [editNotes, setEditNotes] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number | undefined>();
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.background,
    },
    searchInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderRadius: 22,
      height: 44,
      paddingHorizontal: 16,
    },
    searchIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
    clearButton: {
      padding: 4,
      marginLeft: 8,
    },
    filterButton: {
      width: 40,
      height: 40,
      backgroundColor: colors.muted,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
    },
    categoriesContainer: {
      backgroundColor: colors.background,
      paddingBottom: 16,
      paddingHorizontal: 16,
    },
    categoriesWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    categoriesScroll: {
      flex: 1,
    },
    categoriesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingRight: 16,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.muted,
      gap: 6,
    },
    categoryChipActive: {
      backgroundColor: colors.primary,
    },
    categoryChipText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
    },
    categoryChipTextActive: {
      color: colors.background,
    },
    addCategoryButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    receiptsList: {
      flex: 1,
      paddingHorizontal: 16,
    },
    receiptItem: {
      backgroundColor: colors.card,
      marginVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    receiptHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    receiptUser: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    receiptUserInfo: {
      flex: 1,
      marginLeft: 12,
    },
    receiptUserName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    receiptDate: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    receiptActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
    },
    receiptContent: {
      padding: 16,
    },
    receiptText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      marginBottom: 12,
    },
    receiptMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    categoryBadgeText: {
      fontSize: 12,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
    },
    receiptNotes: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    receiptNotesText: {
      fontSize: 13,
      color: '#92400E',
      fontFamily: 'Inter-Regular',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      marginTop: 100,
    },
    emptyStateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    emptyStateIcon: {
      marginRight: 12,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 24,
    },
    modal: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    closeButton: {
      padding: 8,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalOptionText: {
      flex: 1,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      marginLeft: 12,
    },
    formGroup: {
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 8,
    },
    formInput: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
    formTextArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    colorPicker: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    colorOption: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorOptionActive: {
      borderColor: colors.foreground,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    button: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    buttonSecondary: {
      backgroundColor: colors.muted,
    },
    buttonDanger: {
      backgroundColor: '#EF4444',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
      fontFamily: 'Inter-SemiBold',
    },
    buttonTextSecondary: {
      color: colors.foreground,
    },
    dropdownInput: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownText: {
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
    categoryPickerContent: {
      maxHeight: '70%',
    },
    categoryPickerList: {
      maxHeight: 400,
    },
    categoryPickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryPickerItemActive: {
      backgroundColor: colors.muted,
    },
    categoryPickerDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.mutedForeground,
      marginRight: 12,
    },
    categoryPickerText: {
      flex: 1,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
    categoryPickerTextActive: {
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
  });

  const showToastMessage = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = searchQuery === '' || 
      receipt.post?.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.tags?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
      (selectedCategory === 'uncategorized' && !receipt.categoryId) ||
      receipt.categoryId?.toString() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReceipts(1, selectedCategory === 'all' ? undefined : selectedCategory);
    setRefreshing(false);
  }, [selectedCategory]); // Remove loadReceipts from deps

  // Enhanced refresh with haptic feedback
  const { enhancedOnRefresh, tintColor: refreshTintColor, colors: refreshColors, handleRefreshStateChange } = useEnhancedRefresh({
    onRefresh: onRefresh,
    tintColor: colors.primary
  });
  
  // Track refresh state changes for haptic feedback
  useEffect(() => {
    handleRefreshStateChange(refreshing || isLoadingReceipts);
  }, [refreshing, isLoadingReceipts, handleRefreshStateChange]);

  const handleLoadMore = () => {
    if (hasMoreReceipts && !isLoadingReceipts) {
      loadMoreReceipts();
    }
  };

  const handleDeleteReceipt = async (signature: string) => {
    Alert.alert(
      'Remove Receipt',
      'Are you sure you want to remove this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeReceipt(signature);
            if (success) {
              showToastMessage('Receipt removed successfully', 'success');
            } else {
              showToastMessage('Failed to remove receipt', 'error');
            }
          },
        },
      ]
    );
  };

  const handleEditReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setEditNotes(receipt.notes || '');
    setEditCategoryId(receipt.categoryId);
    setShowEditReceiptModal(true);
  };

  const handleSaveReceipt = async () => {
    if (!selectedReceipt) return;

    const success = await updateReceipt(
      selectedReceipt.signature,
      editCategoryId,
      editNotes
    );

    if (success) {
      showToastMessage('Receipt updated successfully', 'success');
      setShowEditReceiptModal(false);
    } else {
      showToastMessage('Failed to update receipt', 'error');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showToastMessage('Category name is required', 'error');
      return;
    }

    const success = await createCategory(
      newCategoryName,
      newCategoryDescription,
      newCategoryColor,
      newCategoryIcon
    );

    if (success) {
      showToastMessage('Category created successfully', 'success');
      setShowCreateCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('#3B82F6');
      setNewCategoryIcon('');
    } else {
      showToastMessage('Failed to create category', 'error');
    }
  };


  // Load categories only once on mount
  useEffect(() => {
    const loadCategoriesOnce = async () => {
      await loadCategories();
    };
    loadCategoriesOnce();
  }, []); // Empty deps - we only want this once

  // Initial load on mount and category change
  useEffect(() => {
    if (!loadingRef.current) {
      loadingRef.current = true;
      const categoryToLoad = selectedCategory === 'all' ? undefined : selectedCategory;
      loadReceipts(1, categoryToLoad).finally(() => {
        loadingRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]); // Intentionally omit loadReceipts to prevent loops
  
  // Handle screen focus without causing reloads
  useFocusEffect(
    useCallback(() => {
      // We can add any focus-specific logic here if needed
      // But we don't reload data on every focus to prevent loops
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  useEffect(() => {
    if (error) {
      showToastMessage(error, 'error');
      clearError();
    }
  }, [error, clearError]);

  const renderReceiptItem = ({item}: {item: Receipt}) => {
    // Debug logging for receipt item structure
    console.log('📝 ReceiptsScreen: Rendering receipt item:', {
      signature: item.signature,
      postExists: !!item.post,
      postKeys: item.post ? Object.keys(item.post) : null,
      userInfo: item.post?.userInfo,
      user: item.post?.user,
      userType: typeof item.post?.user
    });
    
    return (
      <View style={styles.receiptItem}>
        <View style={styles.receiptHeader}>
          <View style={styles.receiptUser}>
            <Avatar
              src={undefined} // Receipt data doesn't include profile pictures
              fallback={
                item.post?.displayName?.charAt(0) || 
                item.post?.postUser?.charAt(0) || 
                'U'
              }
              size="sm"
            />
            <View style={styles.receiptUserInfo}>
              <Text style={styles.receiptUserName}>
                {item.post?.displayName || 
                 (item.post?.postUser ? `${item.post.postUser.slice(0, 8)}...` : 'Unknown User')}
              </Text>
              <Text style={styles.receiptDate}>
                Saved {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        
        <View style={styles.receiptActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleEditReceipt(item)}>
            <Edit3 size={18} color={colors.mutedForeground} />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleDeleteReceipt(item.signature)}>
            <Trash2 size={18} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      <View style={styles.receiptContent}>
        {item.post && (
          <Text style={styles.receiptText} numberOfLines={3}>
            {item.post.postMessage || item.post.message}
          </Text>
        )}

        <View style={styles.receiptMeta}>
          {item.category && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: item.category.color + '20' },
              ]}>
              <Text style={styles.categoryBadgeText}>
                {item.category.icon} {item.category.name}
              </Text>
            </View>
          )}
        </View>

        {item.notes && (
          <View style={styles.receiptNotes}>
            <Text style={styles.receiptNotesText}>
              {item.notes}
            </Text>
          </View>
        )}
      </View>
    </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateHeader}>
        <View style={styles.emptyStateIcon}>
          <Bookmark size={32} color={colors.foreground} />
        </View>
        <Text style={styles.emptyStateTitle}>No Receipts Yet</Text>
      </View>
      <Text style={styles.emptyStateText}>
        Start saving posts by tapping the bookmark icon on any post. 
        Your saved posts will appear here.
      </Text>
    </View>
  );

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title="My Receipts"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Search size={20} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search receipts..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable style={styles.clearButton} onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <View style={styles.categoriesWrapper}>
          <Pressable
            style={[
              styles.filterButton,
              showCategoryModal && styles.filterButtonActive,
            ]}
            onPress={() => setShowCategoryModal(true)}>
            <Filter size={20} color={showCategoryModal ? colors.background : colors.mutedForeground} />
          </Pressable>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesRow}>
            <Pressable
              style={[
                styles.categoryChip,
                selectedCategory === 'all' && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory('all')}>
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === 'all' && styles.categoryChipTextActive,
                ]}>
                All
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.categoryChip,
                selectedCategory === 'uncategorized' && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory('uncategorized')}>
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === 'uncategorized' && styles.categoryChipTextActive,
                ]}>
                Uncategorized
              </Text>
            </Pressable>

            {categories.map(category => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id.toString() && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.id.toString())}>
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category.id.toString() && styles.categoryChipTextActive,
                  ]}>
                  {category.icon} {category.name}
                </Text>
              </Pressable>
            ))}

            <Pressable
              style={styles.addCategoryButton}
              onPress={() => setShowCreateCategoryModal(true)}>
              <Plus size={16} color={colors.mutedForeground} />
            </Pressable>
          </ScrollView>
        </View>
      </View>

      {/* Receipts List */}
      {isLoadingReceipts && receipts.length === 0 ? (
        <FeedSkeleton itemCount={6} showImages={false} />
      ) : error && receipts.length === 0 ? (
        <EnhancedErrorState
          title="Can't load receipts"
          subtitle="Check your connection and try again"
          onRetry={onRefresh}
          retryLabel="Try Again"
          retrying={refreshing || isLoadingReceipts}
        />
      ) : (
        <FlatList
          style={styles.receiptsList}
          data={filteredReceipts}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.signature}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={enhancedOnRefresh}
              tintColor={colors.primary} // iOS spinner color
              colors={[colors.primary, colors.secondary]} // Android spinner colors  
              progressBackgroundColor={colors.card} // Android background
              progressViewOffset={0} // Normal positioning
              size="default"
              title="Pull to refresh" // iOS title
              titleColor={colors.mutedForeground} // iOS title color
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Category Filter Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}>
        <Pressable
          style={styles.modal}
          onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Category</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setShowCategoryModal(false)}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setSelectedCategory('all');
                setShowCategoryModal(false);
              }}>
              <Folder size={20} color={colors.mutedForeground} />
              <Text style={styles.modalOptionText}>All Receipts</Text>
            </Pressable>

            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setSelectedCategory('uncategorized');
                setShowCategoryModal(false);
              }}>
              <Folder size={20} color={colors.mutedForeground} />
              <Text style={styles.modalOptionText}>Uncategorized</Text>
            </Pressable>

            {categories.map(category => (
              <Pressable
                key={category.id}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedCategory(category.id.toString());
                  setShowCategoryModal(false);
                }}>
                <Text style={{ fontSize: 20 }}>{category.icon}</Text>
                <Text style={styles.modalOptionText}>{category.name}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        visible={showCreateCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateCategoryModal(false)}>
        <Pressable
          style={styles.modal}
          onPress={() => setShowCreateCategoryModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Category</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setShowCreateCategoryModal(false)}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.formInput}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Category name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={newCategoryDescription}
                onChangeText={setNewCategoryDescription}
                placeholder="Category description (optional)"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Icon/Emoji</Text>
              <TextInput
                style={styles.formInput}
                value={newCategoryIcon}
                onChangeText={setNewCategoryIcon}
                placeholder="📁"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Color</Text>
              <View style={styles.colorPicker}>
                {colorOptions.map(color => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategoryColor === color && styles.colorOptionActive,
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowCreateCategoryModal(false)}>
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable style={styles.button} onPress={handleCreateCategory}>
                <Text style={styles.buttonText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Edit Receipt Modal */}
      <Modal
        visible={showEditReceiptModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditReceiptModal(false)}>
        <Pressable
          style={styles.modal}
          onPress={() => setShowEditReceiptModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Receipt</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setShowEditReceiptModal(false)}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category</Text>
              <Pressable
                style={[styles.formInput, styles.dropdownInput]}
                onPress={() => setShowCategoryPicker(true)}>
                <Text style={styles.dropdownText}>
                  {editCategoryId
                    ? categories.find(c => c.id === editCategoryId)?.name || 'Select Category'
                    : 'Uncategorized'
                  }
                </Text>
                <ChevronDown size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Add your notes about this post..."
                multiline
              />
            </View>


            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowEditReceiptModal(false)}>
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable style={styles.button} onPress={handleSaveReceipt}>
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Toast Messages */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}>
        <Pressable
          style={styles.modal}
          onPress={() => setShowCategoryPicker(false)}>
          <View style={[styles.modalContent, styles.categoryPickerContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setShowCategoryPicker(false)}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView style={styles.categoryPickerList}>
              {/* Uncategorized option */}
              <Pressable
                style={[styles.categoryPickerItem, !editCategoryId && styles.categoryPickerItemActive]}
                onPress={() => {
                  setEditCategoryId(undefined);
                  setShowCategoryPicker(false);
                }}>
                <View style={styles.categoryPickerDot} />
                <Text style={[styles.categoryPickerText, !editCategoryId && styles.categoryPickerTextActive]}>
                  Uncategorized
                </Text>
                {!editCategoryId && <Check size={20} color={colors.primary} />}
              </Pressable>

              {/* Category options */}
              {categories.map(category => (
                <Pressable
                  key={category.id}
                  style={[styles.categoryPickerItem, editCategoryId === category.id && styles.categoryPickerItemActive]}
                  onPress={() => {
                    setEditCategoryId(category.id);
                    setShowCategoryPicker(false);
                  }}>
                  <View style={[styles.categoryPickerDot, {backgroundColor: category.color}]} />
                  <Text style={[styles.categoryPickerText, editCategoryId === category.id && styles.categoryPickerTextActive]}>
                    {category.name}
                  </Text>
                  {editCategoryId === category.id && <Check size={20} color={colors.primary} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}