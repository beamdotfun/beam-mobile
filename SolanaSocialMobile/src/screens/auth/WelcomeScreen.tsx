import React from 'react';
import {View, Text, ScrollView, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '../../components/ui/button';
import {Card, CardContent} from '../../components/ui/card';
import {Badge} from '../../components/ui/badge';
import {useThemeStore} from '../../store/themeStore';
import {AuthStackScreenProps} from '../../types/navigation';

type Props = AuthStackScreenProps<'Welcome'>;

export default function WelcomeScreen({navigation}: Props) {
  const {colors, isDark} = useThemeStore();

  const features = [
    {
      icon: '🏆',
      title: 'Reputation System',
      description: 'Build your on-chain reputation through community voting',
    },
    {
      icon: '💰',
      title: 'SOL Tipping',
      description: 'Tip creators directly with SOL cryptocurrency',
    },
    {
      icon: '🎨',
      title: 'NFT Verification',
      description: 'Verify your identity with your favorite NFT collection',
    },
    {
      icon: '🏪',
      title: 'Brand Features',
      description: 'Create brands and run advertising auctions',
    },
    {
      icon: '⚡',
      title: 'Real-time Updates',
      description: 'Live notifications and instant social interactions',
    },
    {
      icon: '🔐',
      title: 'Web3 Native',
      description: 'Your data, your keys, fully decentralized',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent={false}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          {/* Logo and Header */}
          <View className="items-center mb-8">
            <View className="w-24 h-24 mb-4 bg-primary/10 rounded-full items-center justify-center">
              <Text className="text-4xl">🌐</Text>
            </View>

            <Text className="text-3xl font-bold text-foreground text-center mb-2">
              Welcome to Beam
            </Text>

            <Text className="text-muted-foreground text-center text-lg leading-6">
              The first mobile social platform built for the Solana ecosystem
            </Text>

            <View className="flex-row mt-4 space-x-2">
              <Badge variant="default">Mobile First</Badge>
              <Badge variant="secondary">Solana Native</Badge>
              <Badge variant="success">Web3 Social</Badge>
            </View>
          </View>

          {/* Features Grid */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-foreground mb-4 text-center">
              Why Choose Beam?
            </Text>

            <View className="space-y-3">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <View className="flex-row items-start space-x-3">
                      <Text className="text-2xl">{feature.icon}</Text>
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold mb-1">
                          {feature.title}
                        </Text>
                        <Text className="text-muted-foreground text-sm">
                          {feature.description}
                        </Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-4">
            <Button
              onPress={() => navigation.navigate('ConnectWallet')}
              className="w-full"
              size="lg">
              Connect Your Wallet
            </Button>

            <View className="flex-row space-x-3">
              <Button
                variant="outline"
                onPress={() => {
                  /* Handle learn more */
                }}
                className="flex-1">
                Learn More
              </Button>

              <Button
                variant="outline"
                onPress={() => {
                  /* Handle demo */
                }}
                className="flex-1">
                View Demo
              </Button>
            </View>
          </View>

          {/* Footer */}
          <View className="mt-8 pt-6 border-t border-border">
            <Text className="text-muted-foreground text-center text-sm">
              Built for Solana Mobile • Secured by Blockchain
            </Text>
            <Text className="text-muted-foreground text-center text-xs mt-2">
              Your keys, your data, your social network
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
