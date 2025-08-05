import React, {useMemo} from 'react';
import {View, Dimensions} from 'react-native';
import {Text, Card, Badge} from '../../ui';
import {BarChart, PieChart} from 'react-native-chart-kit';
import {EarningsAnalytics} from '../../../types/analytics';
import {CHART_COLORS} from '../../../types/analytics';
import {DollarSign, TrendingUp, TrendingDown} from 'lucide-react-native';

const {width: screenWidth} = Dimensions.get('window');

interface EarningsChartProps {
  analytics?: EarningsAnalytics;
}

export function EarningsChart({analytics}: EarningsChartProps) {
  const earningsBreakdownData = useMemo(() => {
    if (!analytics) {return null;}

    const data = [
      {
        name: 'Tips',
        amount: analytics.bySource.tips.amount,
        percentage: analytics.bySource.tips.percentage,
        color: CHART_COLORS.primary,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Subscriptions',
        amount: analytics.bySource.subscriptions.amount,
        percentage: analytics.bySource.subscriptions.percentage,
        color: CHART_COLORS.secondary,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'NFT Sales',
        amount: analytics.bySource.nftSales.amount,
        percentage: analytics.bySource.nftSales.percentage,
        color: CHART_COLORS.accent,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
    ].filter(item => item.amount > 0);

    return data;
  }, [analytics]);

  const trendsData = useMemo(() => {
    if (!analytics?.earningsTrend || analytics.earningsTrend.length === 0)
      {return null;}

    const last7Days = analytics.earningsTrend.slice(-7);

    return {
      labels: last7Days.map(trend => {
        const date = new Date(trend.period);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }),
      datasets: [
        {
          data: last7Days.map(trend => trend.value),
          color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // purple
          strokeWidth: 2,
        },
      ],
    };
  }, [analytics]);

  const earningsStats = useMemo(() => {
    if (!analytics) {return null;}

    const currentPeriodEarnings = analytics.total.amount;
    const previousPeriodEarnings = analytics.vsLastPeriod.previous;
    const changePercent = analytics.vsLastPeriod.changePercent;
    const isPositive = changePercent >= 0;

    return {
      current: currentPeriodEarnings,
      previous: previousPeriodEarnings,
      change: analytics.vsLastPeriod.change,
      changePercent,
      isPositive,
      avgPerTransaction:
        analytics.total.transactions > 0
          ? analytics.total.amount / analytics.total.transactions
          : 0,
    };
  }, [analytics]);

  if (!analytics) {
    return (
      <Card className="p-4">
        <Text className="text-lg font-semibold mb-2">Earnings Analytics</Text>
        <View className="h-48 justify-center items-center bg-muted/20 rounded-lg">
          <Text className="text-center text-muted-foreground">
            No earnings data available
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <View>
      {/* Earnings Summary */}
      <Card className="p-4 mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold">Total Earnings</Text>
          <DollarSign className="h-5 w-5 text-purple-500" />
        </View>

        <View className="flex-row items-end gap-2 mb-2">
          <Text className="text-3xl font-bold">
            {analytics.total.amount.toFixed(3)}
          </Text>
          <Text className="text-lg text-muted-foreground mb-1">SOL</Text>
        </View>

        <Text className="text-sm text-muted-foreground mb-4">
          ≈ ${analytics.total.usdValue.toLocaleString()} USD
        </Text>

        {earningsStats && (
          <View className="flex-row items-center gap-2">
            {earningsStats.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <Text
              className={`text-sm font-medium ${
                earningsStats.isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
              {earningsStats.isPositive ? '+' : ''}
              {earningsStats.changePercent.toFixed(1)}%
            </Text>
            <Text className="text-sm text-muted-foreground">
              vs last period
            </Text>
          </View>
        )}
      </Card>

      {/* Earnings Breakdown Pie Chart */}
      {earningsBreakdownData && earningsBreakdownData.length > 0 && (
        <Card className="p-4 mb-4">
          <Text className="text-lg font-semibold mb-4">Earnings Breakdown</Text>

          <PieChart
            data={earningsBreakdownData}
            width={screenWidth - 48}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />

          {/* Source breakdown */}
          <View className="mt-4 space-y-3">
            {earningsBreakdownData.map((source, index) => (
              <View
                key={source.name}
                className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-4 h-4 rounded"
                    style={{backgroundColor: source.color}}
                  />
                  <Text className="font-medium">{source.name}</Text>
                </View>
                <View className="items-end">
                  <Text className="font-semibold">
                    {source.amount.toFixed(3)} SOL
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {source.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Earnings Trend */}
      {trendsData && (
        <Card className="p-4 mb-4">
          <Text className="text-lg font-semibold mb-4">
            Earnings Trend (7 days)

          <BarChart
            data={trendsData}
            width={screenWidth - 48}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 3,
              color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            showValuesOnTopOfBars
            fromZero
          />
        </Card>
      )}

      {/* Top Earning Posts */}
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-4">Top Earning Posts</Text>

        {analytics.topEarningPosts.length > 0 ? (
          <View className="space-y-3">
            {analytics.topEarningPosts.slice(0, 5).map((post, index) => (
              <View key={post.postId} className="flex-row items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 rounded-full">
                  <Text className="text-xs font-medium">#{index + 1}</Text>
                </Badge>

                <View className="flex-1">
                  <Text className="font-medium" numberOfLines={1}>
                    {post.content}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {post.tips} tips • Avg: {post.avgTipAmount.toFixed(3)} SOL
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="font-semibold text-purple-600">
                    {post.earnings.toFixed(3)} SOL
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-center text-muted-foreground py-8">
            No earning posts yet
          </Text>
        )}
      </Card>

      {/* Top Tippers */}
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-4">Top Supporters</Text>

        {analytics.topTippers.length > 0 ? (
          <View className="space-y-3">
            {analytics.topTippers.slice(0, 5).map((tipper, index) => (
              <View key={tipper.wallet} className="flex-row items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 rounded-full">
                  <Text className="text-xs font-medium">#{index + 1}</Text>
                </Badge>

                <View className="flex-1">
                  <Text className="font-medium">
                    {tipper.username || `${tipper.wallet.slice(0, 8)}...`}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {tipper.tipCount} tips
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="font-semibold text-green-600">
                    {tipper.totalTipped.toFixed(3)} SOL
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Avg: {tipper.avgTipAmount.toFixed(3)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-center text-muted-foreground py-8">
            No tips received yet
          </Text>
        )}
      </Card>

      {/* Earnings Stats */}
      <Card className="p-4">
        <Text className="text-lg font-semibold mb-4">Quick Stats</Text>

        <View className="flex-row flex-wrap gap-4">
          <View className="flex-1 min-w-[120px]">
            <Text className="text-2xl font-bold text-purple-600">
              {analytics.total.transactions}
            </Text>
            <Text className="text-sm text-muted-foreground">
              Total Transactions
            </Text>

          <View className="flex-1 min-w-[120px]">
            <Text className="text-2xl font-bold text-blue-600">
              {analytics.total.uniqueTippers}
            </Text>
            <Text className="text-sm text-muted-foreground">
              Unique Supporters
            </Text>
          </View>

          {earningsStats && (
            <View className="flex-1 min-w-[120px]">
              <Text className="text-2xl font-bold text-green-600">
                {earningsStats.avgPerTransaction.toFixed(3)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Avg per Transaction
              </Text>
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}
