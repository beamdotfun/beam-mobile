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
  Database,
  Shield,
  Globe,
  Lock,
  Download,
  CheckCircle,
  XCircle,
  Info,
  FileText,
  Users,
  BarChart,
} from 'lucide-react-native';
import {usePrivacySecurityStore} from '../../store/privacySecurityStore';
import {useNavigation} from '@react-navigation/native';
import {PrivacyAudit, DataCategory} from '../../types/privacy-security';

export const DataAudit: React.FC = () => {
  const navigation = useNavigation();
  const {privacyAudit, loading, fetchPrivacyAudit, requestDataDeletion} =
    usePrivacySecurityStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPrivacyAudit();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrivacyAudit();
    setRefreshing(false);
  };

  const handleRequestDeletion = () => {
    navigation.navigate('DeleteAccount');
  };

  const renderComplianceStatus = (isCompliant: boolean, label: string) => (
    <View className="flex-row items-center justify-between py-3">
      <Text className="text-gray-700">{label}</Text>
      <View className="flex-row items-center">
        {isCompliant ? (
          <>
            <CheckCircle size={16} color="#10B981" />
            <Text className="text-green-600 ml-1 text-sm">Compliant</Text>
          </>
        ) : (
          <>
            <XCircle size={16} color="#EF4444" />
            <Text className="text-red-600 ml-1 text-sm">Non-compliant</Text>
          </>
        )}
      </View>
    </View>
  );

  const renderDataCategory = (category: DataCategory) => (
    <View key={category.category} className="bg-gray-50 rounded-lg p-3 mb-2">
      <View className="flex-row items-start justify-between mb-1">
        <Text className="font-medium text-gray-900 flex-1">
          {category.category}
        </Text>
        {category.required && (
          <View className="bg-blue-100 px-2 py-0.5 rounded">
            <Text className="text-xs text-blue-600">Required</Text>
          </View>
        )}
      </View>
      <Text className="text-sm text-gray-600 mb-2">{category.description}</Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-gray-500">
          Purpose: {category.purpose}
        </Text>
        {category.canOptOut && (
          <Pressable className="bg-gray-200 px-2 py-1 rounded">
            <Text className="text-xs text-gray-700">Opt Out</Text>
          </Pressable>
        )}
      </View>
      <Text className="text-xs text-gray-400 mt-1">
        Retention: {category.retention}
      </Text>
    </View>
  );

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
        <Text className="text-lg font-semibold ml-2">Data Audit</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }>
        {privacyAudit && (
          <View className="p-4">
            {/* Compliance Overview */}
            <View className="bg-white rounded-lg p-4 mb-4">
              <View className="flex-row items-center mb-4">
                <Shield size={20} color="#3B82F6" />
                <Text className="text-lg font-semibold ml-2">
                  Compliance Status
                </Text>

              {renderComplianceStatus(
                privacyAudit.gdprCompliant,
                'GDPR Compliance',
              )}
              <View className="border-t border-gray-100" />
              {renderComplianceStatus(
                privacyAudit.ccpaCompliant,
                'CCPA Compliance',
              )}
              <View className="border-t border-gray-100" />
              {renderComplianceStatus(
                privacyAudit.rightToDelete,
                'Right to Delete',
              )}
              <View className="border-t border-gray-100" />
              {renderComplianceStatus(
                privacyAudit.rightToExport,
                'Right to Export',
              )}
            </View>

            {/* Data Collection */}
            <View className="bg-white rounded-lg p-4 mb-4">
              <View className="flex-row items-center mb-4">
                <Database size={20} color="#3B82F6" />
                <Text className="text-lg font-semibold ml-2">
                  Data Collected
                </Text>

              {privacyAudit.dataCollected.map(renderDataCategory)}
            </View>

            {/* Data Sharing */}
            <View className="bg-white rounded-lg p-4 mb-4">
              <View className="flex-row items-center mb-4">
                <Users size={20} color="#3B82F6" />
                <Text className="text-lg font-semibold ml-2">Data Sharing</Text>
              </View>

              {privacyAudit.dataShared.length > 0 ? (
                privacyAudit.dataShared.map((sharing, index) => (
                  <View key={index} className="bg-gray-50 rounded-lg p-3 mb-2">
                    <Text className="font-medium text-gray-900">
                      {sharing.party}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-1">
                      {sharing.purpose}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Data types: {sharing.dataTypes.join(', ')}
                    </Text>
                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-xs text-gray-400">
                        Jurisdiction: {sharing.jurisdiction}
                      </Text>
                      {sharing.canOptOut && (
                        <Pressable className="bg-gray-200 px-2 py-1 rounded">
                          <Text className="text-xs text-gray-700">Opt Out</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-gray-500">
                  No data sharing arrangements
                </Text>
              )}
            </View>

            {/* Data Security */}
            <View className="bg-white rounded-lg p-4 mb-4">
              <View className="flex-row items-center mb-4">
                <Lock size={20} color="#3B82F6" />
                <Text className="text-lg font-semibold ml-2">
                  Data Security
                </Text>
              </View>

              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Encryption Level</Text>
                  <Text className="text-gray-900 font-medium">
                    {privacyAudit.encryptionLevel}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Data Location</Text>
                  <Text className="text-gray-900 font-medium">
                    {privacyAudit.dataLocation}
                  </Text>
                </View>
                <View>
                  <Text className="text-gray-700 mb-1">Backup Locations</Text>
                  <Text className="text-sm text-gray-600">
                    {privacyAudit.backupLocations.join(', ')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Data Retention */}
            <View className="bg-white rounded-lg p-4 mb-4">
              <View className="flex-row items-center mb-4">
                <FileText size={20} color="#3B82F6" />
                <Text className="text-lg font-semibold ml-2">
                  Data Retention Policy
                </Text>
              </View>

              <View className="space-y-3">
                <View>
                  <Text className="text-sm font-medium text-gray-700">
                    Personal Data
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {privacyAudit.dataRetention.personalData}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700">
                    Analytics Data
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {privacyAudit.dataRetention.analyticsData}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700">
                    Transaction Data
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {privacyAudit.dataRetention.transactionData}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700">
                    Communication Data
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {privacyAudit.dataRetention.communicationData}
                  </Text>
                </View>
              </View>
            </View>

            {/* Analytics Settings */}
            <View className="bg-white rounded-lg p-4 mb-4">
              <View className="flex-row items-center mb-4">
                <BarChart size={20} color="#3B82F6" />
                <Text className="text-lg font-semibold ml-2">
                  Analytics & Tracking
                </Text>
              </View>

              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Analytics Enabled</Text>
                  <View className="flex-row items-center">
                    {privacyAudit.analyticsEnabled ? (
                      <CheckCircle size={16} color="#10B981" />
                    ) : (
                      <XCircle size={16} color="#EF4444" />
                    )}
                    <Text
                      className={`ml-1 ${
                        privacyAudit.analyticsEnabled
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                      {privacyAudit.analyticsEnabled ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Third-Party Tracking</Text>
                  <View className="flex-row items-center">
                    {privacyAudit.thirdPartyTracking ? (
                      <CheckCircle size={16} color="#10B981" />
                    ) : (
                      <XCircle size={16} color="#EF4444" />
                    )}
                    <Text
                      className={`ml-1 ${
                        privacyAudit.thirdPartyTracking
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                      {privacyAudit.thirdPartyTracking ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Ad Personalization</Text>
                  <View className="flex-row items-center">
                    {privacyAudit.advertisingPersonalization ? (
                      <CheckCircle size={16} color="#10B981" />
                    ) : (
                      <XCircle size={16} color="#EF4444" />
                    )}
                    <Text
                      className={`ml-1 ${
                        privacyAudit.advertisingPersonalization
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                      {privacyAudit.advertisingPersonalization ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="bg-white rounded-lg p-4">
              <Text className="text-lg font-semibold mb-4">Actions</Text>

              <View className="space-y-3">
                <Pressable
                  onPress={() => navigation.navigate('PrivacySettings')}
                  className="bg-gray-100 p-3 rounded-lg flex-row items-center justify-center">
                  <Shield size={16} color="#374151" />
                  <Text className="ml-2 text-gray-700 font-medium">
                    Manage Privacy Settings
                  </Text>

                <Pressable
                  onPress={() => {}}
                  className="bg-blue-100 p-3 rounded-lg flex-row items-center justify-center">
                  <Download size={16} color="#2563EB" />
                  <Text className="ml-2 text-blue-600 font-medium">
                    Download Full Report
                  </Text>

                <Pressable
                  onPress={handleRequestDeletion}
                  className="bg-red-100 p-3 rounded-lg flex-row items-center justify-center">
                  <Info size={16} color="#DC2626" />
                  <Text className="ml-2 text-red-600 font-medium">
                    Request Data Deletion
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
