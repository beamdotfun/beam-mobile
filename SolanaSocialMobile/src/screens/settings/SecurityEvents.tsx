import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  MapPin,
  Smartphone,
  Clock,
  Filter,
} from 'lucide-react-native';
import {usePrivacySecurityStore} from '../../store/privacySecurityStore';
import {useNavigation} from '@react-navigation/native';
import {formatRelativeTime} from '../../utils/formatting';
import {SecurityEvent, SecurityEventType} from '../../types/privacy-security';

export const SecurityEvents: React.FC = () => {
  const navigation = useNavigation();
  const {securityEvents, loading, fetchSecurityEvents, markEventResolved} =
    usePrivacySecurityStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSecurityEvents();
    setRefreshing(false);
  };

  const handleMarkResolved = async (eventId: string) => {
    try {
      await markEventResolved(eventId);
    } catch (error) {
      console.error('Failed to mark event as resolved:', error);
    }
  };

  const getEventIcon = (type: SecurityEventType) => {
    switch (type) {
      case 'login_attempt':
      case 'failed_login':
        return Shield;
      case 'suspicious_activity':
      case 'account_locked':
        return AlertTriangle;
      case 'password_change':
      case 'email_change':
      case 'privacy_setting_change':
        return Info;
      default:
        return Shield;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#DC2626'; // red-600
      case 'high':
        return '#F59E0B'; // amber-500
      case 'medium':
        return '#3B82F6'; // blue-500
      case 'low':
        return '#6B7280'; // gray-500
      default:
        return '#6B7280';
    }
  };

  const filteredEvents = securityEvents.filter(event => {
    if (!showResolved && event.resolved) {
      return false;
    }
    if (filterSeverity && event.severity !== filterSeverity) {
      return false;
    }
    return true;
  });

  const renderEvent = (event: SecurityEvent) => {
    const Icon = getEventIcon(event.type);
    const severityColor = getSeverityColor(event.severity);

    return (
      <View
        key={event.id}
        className={`bg-white rounded-lg p-4 mb-3 ${
          event.resolved ? 'opacity-60' : ''
        }`}>
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-start flex-1">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{backgroundColor: `${severityColor}20`}}>
              <Icon size={20} color={severityColor} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">
                {event.description}
              </Text>
              <View className="flex-row items-center mt-1">
                <Clock size={12} color="#6B7280" />
                <Text className="text-xs text-gray-500 ml-1">
                  {formatRelativeTime(event.timestamp)}
                </Text>
              </View>
            </View>
          </View>

          <View
            className="px-2 py-1 rounded"
            style={{backgroundColor: `${severityColor}20`}}>
            <Text
              className="text-xs font-medium capitalize"
              style={{color: severityColor}}>
              {event.severity}
            </Text>
          </View>
        </View>

        {/* Event Details */}
        <View className="ml-13">
          {event.location && (
            <View className="flex-row items-center mb-1">
              <MapPin size={12} color="#6B7280" />
              <Text className="text-xs text-gray-600 ml-1">
                {event.location}
              </Text>
            </View>
          )}

          {event.deviceInfo && (
            <View className="flex-row items-center mb-1">
              <Smartphone size={12} color="#6B7280" />
              <Text className="text-xs text-gray-600 ml-1">
                {event.deviceInfo}
              </Text>
            </View>
          )}

          {event.ipAddress && (
            <Text className="text-xs text-gray-500">IP: {event.ipAddress}</Text>
          )}
        </View>

        {/* Actions */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
          {event.resolved ? (
            <View className="flex-row items-center">
              <CheckCircle size={14} color="#10B981" />
              <Text className="text-xs text-green-600 ml-1">
                Resolved{' '}
                {event.resolvedAt && formatRelativeTime(event.resolvedAt)}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => handleMarkResolved(event.id)}
              className="flex-row items-center">
              <CheckCircle size={14} color="#6B7280" />
              <Text className="text-xs text-gray-600 ml-1 font-medium">
                Mark as resolved
              </Text>
            </Pressable>
          )}

          <Text className="text-xs text-gray-500 capitalize">
            {event.type.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={() => navigation.goBack()} className="p-2">
          <ArrowLeft size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-semibold ml-2">Security Events</Text>
      </View>

      {/* Filters */}
      <View className="flex-row items-center p-4 space-x-2">
        <Pressable
          onPress={() => setShowResolved(!showResolved)}
          className={`flex-row items-center px-3 py-1.5 rounded-lg ${
            showResolved ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
          <Filter size={14} color={showResolved ? '#2563EB' : '#6B7280'} />
          <Text
            className={`text-sm ml-1 ${
              showResolved ? 'text-blue-600' : 'text-gray-600'
            }`}>
            Show Resolved
          </Text>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'critical', 'high', 'medium', 'low'].map(severity => (
            <Pressable
              key={severity}
              onPress={() =>
                setFilterSeverity(severity === 'all' ? null : severity)
              }
              className={`px-3 py-1.5 rounded-lg mr-2 ${
                (severity === 'all' && !filterSeverity) ||
                filterSeverity === severity
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
              }`}>
              <Text
                className={`text-sm capitalize ${
                  (severity === 'all' && !filterSeverity) ||
                  filterSeverity === severity
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}>
                {severity}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Events List */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }>
        {filteredEvents.length > 0 ? (
          filteredEvents.map(renderEvent)
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Shield size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-center">
              {filterSeverity || !showResolved
                ? 'No events match your filters'
                : 'No security events to display'}
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center">
              Your account activity will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
