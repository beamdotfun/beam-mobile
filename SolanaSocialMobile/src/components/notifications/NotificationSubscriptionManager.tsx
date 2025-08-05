import React, {useState} from 'react';
import {View, ScrollView, Alert} from 'react-native';
import {
  Plus,
  X,
  Users,
  Hash,
  FileText,
  TrendingUp,
  Settings,
  Bell,
  BellOff,
  Clock,
  Zap,
} from 'lucide-react-native';
import {useActivityNotificationStore} from '../../stores/activityNotificationStore';
import {
  NotificationSubscription,
  SubscriptionType,
  SubscriptionFrequency,
  DeliveryMethod,
  NotificationFilter,
} from '../../types/activity-notifications';
import {Button} from '../ui/button';
import {Card} from '../ui/card';
import {Text} from '../ui/text';
import {Badge} from '../ui/badge';
import {LoadingSpinner} from '../ui/loading-spinner';
import {cn} from '../../lib/utils';

interface NotificationSubscriptionManagerProps {
  userId?: string;
  showCreateButton?: boolean;
}

export const NotificationSubscriptionManager: React.FC<
  NotificationSubscriptionManagerProps
> = ({userId, showCreateButton = true}) => {
  const {notificationSystem, isLoading, subscribeTo, unsubscribeFrom} =
    useActivityNotificationStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<NotificationSubscription | null>(null);

  const subscriptions = notificationSystem?.activeSubscriptions || [];

  const handleCreateSubscription = () => {
    setSelectedSubscription(null);
    setShowCreateForm(true);
  };

  const handleEditSubscription = (subscription: NotificationSubscription) => {
    setSelectedSubscription(subscription);
    setShowCreateForm(true);
  };

  const handleDeleteSubscription = async (
    subscription: NotificationSubscription,
  ) => {
    Alert.alert(
      'Remove Subscription',
      `Are you sure you want to stop receiving notifications for "${subscription.target}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await unsubscribeFrom(subscription.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove subscription');
            }
          },
        },
      ],
    );
  };

  const getSubscriptionIcon = (type: SubscriptionType) => {
    switch (type) {
      case 'user_activity':
        return <Users size={16} color="#3B82F6" />;
      case 'content_updates':
        return <FileText size={16} color="#10B981" />;
      case 'topic_activity':
        return <Hash size={16} color="#8B5CF6" />;
      case 'trending_content':
        return <TrendingUp size={16} color="#F59E0B" />;
      case 'platform_updates':
        return <Settings size={16} color="#6B7280" />;
      default:
        return <Bell size={16} color="#6B7280" />;
    }
  };

  const getFrequencyIcon = (frequency: SubscriptionFrequency) => {
    switch (frequency) {
      case 'instant':
        return <Zap size={12} color="#10B981" />;
      case 'hourly':
        return <Clock size={12} color="#3B82F6" />;
      case 'daily':
        return <Clock size={12} color="#8B5CF6" />;
      case 'weekly':
        return <Clock size={12} color="#F59E0B" />;
      default:
        return <Clock size={12} color="#6B7280" />;
    }
  };

  const getDeliveryMethods = (methods: DeliveryMethod[]) => {
    return methods
      .map(method => {
        switch (method) {
          case 'push':
            return '📱';
          case 'in_app':
            return '🔔';
          case 'badge':
            return '🔴';
          default:
            return '📧';
        }
      })
      .join(' ');
  };

  if (isLoading) {
    return (
      <View className="items-center py-8">
        <LoadingSpinner size="large" />
        <Text className="mt-4 text-gray-600">Loading subscriptions...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-lg font-semibold text-gray-900">
            Subscriptions
          </Text>
          <Text className="text-sm text-gray-600">
            Manage your notification subscriptions
          </Text>
        </View>
        {showCreateButton && (
          <Button
            variant="default"
            size="sm"
            onPress={handleCreateSubscription}>
            <Plus size={16} color="white" />
            <Text className="text-white ml-1">Add</Text>
          </Button>
        )}
      </View>

      {/* Subscriptions List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {subscriptions.length > 0 ? (
          <View className="space-y-3">
            {subscriptions.map(subscription => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onEdit={() => handleEditSubscription(subscription)}
                onDelete={() => handleDeleteSubscription(subscription)}
                getIcon={getSubscriptionIcon}
                getFrequencyIcon={getFrequencyIcon}
                getDeliveryMethods={getDeliveryMethods}
              />
            ))}
          </View>
        ) : (
          <View className="items-center py-16">
            <BellOff size={48} color="#9CA3AF" />
            <Text className="text-gray-600 mt-4">No active subscriptions</Text>
            <Text className="text-sm text-gray-500 text-center mt-2">
              Create subscriptions to get notified about specific users,
              content, or topics
            </Text>
            {showCreateButton && (
              <Button
                variant="outline"
                className="mt-4"
                onPress={handleCreateSubscription}>
                <Plus size={16} color="#6B7280" />
                <Text className="ml-2">Create Subscription</Text>
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <CreateSubscriptionForm
          subscription={selectedSubscription}
          onClose={() => setShowCreateForm(false)}
          onSave={async subscriptionData => {
            try {
              if (selectedSubscription) {
                // Update existing subscription (in real implementation)
                console.log('Update subscription:', subscriptionData);
              } else {
                await subscribeTo(subscriptionData);
              }
              setShowCreateForm(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to save subscription');
            }
          }}
        />
      )}
    </View>
  );
};

// Subscription Card Component
const SubscriptionCard: React.FC<{
  subscription: NotificationSubscription;
  onEdit: () => void;
  onDelete: () => void;
  getIcon: (type: SubscriptionType) => React.JSX.Element;
  getFrequencyIcon: (frequency: SubscriptionFrequency) => React.JSX.Element;
  getDeliveryMethods: (methods: DeliveryMethod[]) => string;
}> = ({
  subscription,
  onEdit,
  onDelete,
  getIcon,
  getFrequencyIcon,
  getDeliveryMethods,
}) => {
  const formatTarget = (target: string, targetType: string) => {
    switch (targetType) {
      case 'user':
        return `@${target}`;
      case 'hashtag':
        return `#${target}`;
      case 'topic':
        return target;
      default:
        return target;
    }
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-600';
  };

  return (
    <Card className="p-4 bg-white">
      <View className="space-y-3">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-3">
            {getIcon(subscription.type)}
            <View className="flex-1">
              <Text className="font-medium text-gray-900">
                {formatTarget(subscription.target, subscription.targetType)}
              </Text>
              <Text className="text-sm text-gray-600 capitalize">
                {subscription.type.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2">
            <Badge className={getStatusColor(subscription.enabled)}>
              <Text className="text-xs font-medium">
                {subscription.enabled ? 'Active' : 'Paused'}
              </Text>
            </Badge>
            <Button variant="ghost" size="sm" onPress={onEdit}>
              <Settings size={16} color="#6B7280" />
            </Button>
            <Button variant="ghost" size="sm" onPress={onDelete}>
              <X size={16} color="#EF4444" />
            </Button>
          </View>
        </View>

        {/* Details */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-4">
            {/* Frequency */}
            <View className="flex-row items-center space-x-1">
              {getFrequencyIcon(subscription.frequency)}
              <Text className="text-xs text-gray-600 capitalize">
                {subscription.frequency}
              </Text>
            </View>

            {/* Delivery Methods */}
            <View className="flex-row items-center space-x-1">
              <Text className="text-sm">
                {getDeliveryMethods(subscription.delivery)}
              </Text>
              <Text className="text-xs text-gray-600">
                {subscription.delivery.length} method
                {subscription.delivery.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View className="items-end">
            <Text className="text-xs text-gray-500">
              {subscription.triggerCount} notifications
            </Text>
            {subscription.lastTriggered && (
              <Text className="text-xs text-gray-500">
                Last:{' '}
                {new Date(subscription.lastTriggered).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        {/* Filters */}
        {subscription.filters && subscription.filters.length > 0 && (
          <View>
            <Text className="text-xs text-gray-600 mb-1">Filters:</Text>
            <View className="flex-row flex-wrap gap-1">
              {subscription.filters.map((filter, index) => (
                <Badge key={index} variant="secondary" className="py-0.5">
                  <Text className="text-xs">
                    {filter.type}: {filter.operator} {filter.value}
                  </Text>
                </Badge>
              ))}
            </View>
          </View>
        )}
      </View>
    </Card>
  );
};

// Create Subscription Form Component
const CreateSubscriptionForm: React.FC<{
  subscription: NotificationSubscription | null;
  onClose: () => void;
  onSave: (data: Partial<NotificationSubscription>) => void;
}> = ({subscription, onClose, onSave}) => {
  const [formData, setFormData] = useState({
    type: subscription?.type || ('user_activity' as SubscriptionType),
    target: subscription?.target || '',
    targetType:
      subscription?.targetType ||
      ('user' as 'user' | 'content' | 'topic' | 'hashtag'),
    frequency: subscription?.frequency || ('instant' as SubscriptionFrequency),
    delivery:
      subscription?.delivery || (['in_app', 'push'] as DeliveryMethod[]),
    enabled: subscription?.enabled ?? true,
  });

  const handleSave = () => {
    if (!formData.target.trim()) {
      Alert.alert('Error', 'Please enter a target for the subscription');
      return;
    }

    onSave(formData);
  };

  return (
    <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
      <Card className="m-4 p-6 bg-white max-w-sm w-full">
        <View className="space-y-4">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-gray-900">
              {subscription ? 'Edit Subscription' : 'Create Subscription'}
            </Text>
            <Button variant="ghost" size="sm" onPress={onClose}>
              <X size={20} color="#6B7280" />
            </Button>
          </View>

          {/* Form fields would go here */}
          <View className="space-y-3">
            <Text className="text-sm text-gray-600">
              Target: {formData.target || 'Enter target...'}
            </Text>
            <Text className="text-sm text-gray-600">Type: {formData.type}</Text>
            <Text className="text-sm text-gray-600">
              Frequency: {formData.frequency}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row justify-end space-x-2 pt-4">
            <Button variant="outline" onPress={onClose}>
              <Text>Cancel</Text>
            </Button>
            <Button variant="default" onPress={handleSave}>
              <Text className="text-white">
                {subscription ? 'Update' : 'Create'}
              </Text>
            </Button>
          </View>
        </View>
      </Card>
    </View>
  );
};
