import React, {useState} from 'react';
import {View, FlatList, Dimensions} from 'react-native';
import {Text, Card, Badge, Button} from '../ui';
import {PieChart, BarChart} from 'react-native-chart-kit';
import {
  Globe,
  Smartphone,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  Wallet,
  Star,
  Target,
} from 'lucide-react-native';
import {AudienceAnalytics} from '../../types/analytics';
import {CHART_COLORS} from '../../types/analytics';

const {width: screenWidth} = Dimensions.get('window');

interface AudienceInsightsProps {
  analytics?: AudienceAnalytics;
}

export function AudienceInsights({analytics}: AudienceInsightsProps) {
  const [activeTab, setActiveTab] = useState<
    'demographics' | 'behavior' | 'growth' | 'fans'
  >('demographics');

  if (!analytics) {
    return (
      <Card className="p-4">
        <Text className="text-lg font-semibold mb-2">Audience Insights</Text>
        <View className="h-48 justify-center items-center bg-muted/20 rounded-lg">
          <Text className="text-center text-muted-foreground">
            No audience data available
          </Text>
        </View>
      </Card>
    );
  }

  const tabs = [
    {id: 'demographics', label: 'Demographics', icon: Globe},
    {id: 'behavior', label: 'Behavior', icon: Clock},
    {id: 'growth', label: 'Growth', icon: TrendingUp},
    {id: 'fans', label: 'Top Fans', icon: Star},
  ] as const;

  // Prepare chart data
  const locationData = analytics.demographics.locations
    .slice(0, 5)
    .map((location, index) => ({
      name: location.country,
      population: location.percentage,
      color:
        Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));

  const deviceData = analytics.demographics.devices.map((device, index) => ({
    name: device.deviceType,
    population: device.percentage,
    color:
      Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  const walletData = analytics.demographics.walletTypes.map(
    (wallet, index) => ({
      name: wallet.walletType,
      population: wallet.percentage,
      color:
        Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }),
  );

  const activityData = {
    labels: analytics.behavior.activeHours
      .slice(0, 8)
      .map(hour => `${hour.hour}:00`),
    datasets: [
      {
        data: analytics.behavior.activeHours
          .slice(0, 8)
          .map(hour => hour.activityLevel),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const renderDemographicsTab = () => (
    <View>
      {/* Location Distribution */}
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-4">
          Geographic Distribution
        </Text>
        {locationData.length > 0 && (
          <>
            <PieChart
              data={locationData}
              width={screenWidth - 48}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <View className="mt-4 space-y-2">
              {analytics.demographics.locations
                .slice(0, 5)
                .map((location, index) => (
                  <View
                    key={location.country}
                    className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor:
                            locationData[index]?.color || CHART_COLORS.muted,
                        }}
                      />
                      <Text className="font-medium">{location.country}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-semibold">
                        {location.percentage.toFixed(1)}%
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {location.count.toLocaleString()} users
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          </>
        )}
      </Card>

      {/* Device Distribution */}
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-4">Device Types</Text>
        {deviceData.length > 0 && (
          <>
            <PieChart
              data={deviceData}
              width={screenWidth - 48}
              height={180}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <View className="mt-4 space-y-2">
              {analytics.demographics.devices.map((device, index) => (
                <View
                  key={device.deviceType}
                  className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <Text className="font-medium capitalize">
                      {device.deviceType}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      ({device.os})
                    </Text>
                  </View>
                  <Text className="font-semibold">
                    {device.percentage.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Card>

      {/* Wallet Distribution */}
      <Card className="p-4">
        <Text className="text-lg font-semibold mb-4">Wallet Preferences</Text>
        <View className="space-y-3">
          {analytics.demographics.walletTypes.map((wallet, index) => (
            <View
              key={wallet.walletType}
              className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <Text className="font-medium capitalize">
                  {wallet.walletType}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-semibold">
                  {wallet.percentage.toFixed(1)}%
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {wallet.count.toLocaleString()} users
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );

  const renderBehaviorTab = () => (
    <View>
      {/* Activity Hours */}
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-4">Peak Activity Hours</Text>
        <BarChart
          data={activityData}
          width={screenWidth - 48}
          height={200}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {borderRadius: 16},
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          showValuesOnTopOfBars
          fromZero
        />
      </Card>

      {/* Behavior Stats */}
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-4">Behavior Metrics</Text>
        <View className="space-y-4">
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">Engagement Rate</Text>
            <Text className="font-semibold text-green-600">
              {(analytics.behavior.engagementRate * 100).toFixed(1)}%
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">Avg Session Time</Text>
            <Text className="font-semibold">
              {Math.round(analytics.behavior.averageSessionTime / 60)} minutes
            </Text>
          </View>
        </View>
      </Card>

      {/* Active Days */}
      <Card className="p-4">
        <Text className="text-lg font-semibold mb-4">Most Active Days</Text>
        <View className="space-y-3">
          {analytics.behavior.activeDays
            .sort((a, b) => b.activityLevel - a.activityLevel)
            .slice(0, 7)
            .map((day, index) => (
              <View
                key={day.day}
                className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full">
                    <Text className="text-xs">#{index + 1}</Text>
                  </Badge>
                  <Text className="font-medium">{day.day}</Text>
                </View>
                <View className="items-end">
                  <Text className="font-semibold">
                    {day.activityLevel.toFixed(0)}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {(day.engagementRate * 100).toFixed(1)}% engagement
                  </Text>
                </View>
              </View>
            ))}
        </View>
      </Card>
    </View>
  );

  const renderGrowthTab = () => (
    <View>
      {/* Growth Stats */}
      <View className="flex-row gap-4 mb-4">
        <Card className="flex-1 p-4">
          <View className="flex-row items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <Text className="text-sm font-medium">Growth Rate</Text>
          </View>
          <Text className="text-2xl font-bold text-green-600">
            {analytics.growthRate.toFixed(1)}%
          </Text>
          <Text className="text-xs text-muted-foreground">Monthly</Text>
        </Card>

        <Card className="flex-1 p-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-500" />
            <Text className="text-sm font-medium">Projected</Text>
          </View>
          <Text className="text-2xl font-bold text-blue-600">
            {analytics.projectedFollowers.toLocaleString()}
          </Text>
          <Text className="text-xs text-muted-foreground">Next month</Text>
        </Card>
      </View>

      {/* New Followers */}
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-4">Recent Followers</Text>
        {analytics.newFollowers.length > 0 ? (
          <View className="space-y-3">
            {analytics.newFollowers.slice(0, 5).map(follower => (
              <View
                key={follower.wallet}
                className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 bg-gray-300 rounded-full" />
                  <View>
                    <Text className="font-medium">
                      {follower.username || `${follower.wallet.slice(0, 8)}...`}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {new Date(follower.followedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Badge
                  variant={
                    follower.engagementLevel === 'high'
                      ? 'default'
                      : follower.engagementLevel === 'medium'
                      ? 'secondary'
                      : 'outline'
                  }>
                  <Text className="text-xs capitalize">
                    {follower.engagementLevel}
                  </Text>
                </Badge>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-center text-muted-foreground py-4">
            No new followers yet
          </Text>
        )}
      </Card>

      {/* Milestones */}
      <Card className="p-4">
        <Text className="text-lg font-semibold mb-4">Milestones</Text>
        <View className="space-y-3">
          {analytics.milestones.slice(0, 5).map((milestone, index) => (
            <View key={index} className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium">{milestone.description}</Text>
                <Text className="text-sm text-muted-foreground">
                  Target: {milestone.value.toLocaleString()} {milestone.type}
                </Text>
              </View>
              <View className="items-end">
                {milestone.achievedAt ? (
                  <Badge variant="default">
                    <Text className="text-xs text-white">Achieved</Text>
                  </Badge>
                ) : (
                  <Text className="text-sm text-muted-foreground">
                    {milestone.projectedAt &&
                      new Date(milestone.projectedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );

  const renderFansTab = () => (
    <View>
      <Card className="p-4">
        <Text className="text-lg font-semibold mb-4">Top Supporters</Text>
        {analytics.topFans.length > 0 ? (
          <View className="space-y-4">
            {analytics.topFans.slice(0, 10).map((fan, index) => (
              <View
                key={fan.wallet}
                className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full">
                    <Text className="text-xs font-medium">#{index + 1}</Text>
                  </Badge>
                  <View className="w-10 h-10 bg-gray-300 rounded-full" />
                  <View>
                    <Text className="font-medium">
                      {fan.username || `${fan.wallet.slice(0, 8)}...`}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Fan since {new Date(fan.fanSince).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="font-semibold text-purple-600">
                    {fan.totalTips.toFixed(3)} SOL
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {fan.totalInteractions} interactions
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Score: {fan.engagementScore.toFixed(0)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-center text-muted-foreground py-8">
            No fan data available yet
          </Text>
        )}
      </Card>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'demographics':
        return renderDemographicsTab();
      case 'behavior':
        return renderBehaviorTab();
      case 'growth':
        return renderGrowthTab();
      case 'fans':
        return renderFansTab();
      default:
        return null;
    }
  };

  return (
    <View>
      {/* Tab Navigation */}
      <View className="flex-row mb-4">
        <View className="flex-row bg-muted rounded-lg p-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={`mr-1 ${isActive ? '' : 'bg-transparent'}`}
                onPress={() => setActiveTab(tab.id)}>
                <Icon className="h-4 w-4 mr-1" />
                <Text
                  className={`text-xs ${
                    isActive ? 'text-white' : 'text-muted-foreground'
                  }`}>
                  {tab.label}
                </Text>
              </Button>
            );
          })}
        </View>
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
}
