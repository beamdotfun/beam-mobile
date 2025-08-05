import React from 'react';
import {View, Text, ScrollView} from 'react-native';
import {Screen} from '../../components/layout/Screen';
import {Header} from '../../components/layout/Header';
import {Card, CardContent, CardHeader} from '../../components/ui/card';
import {Avatar} from '../../components/ui/avatar';
import {Badge} from '../../components/ui/badge';
import {Separator} from '../../components/ui/separator';
import {VoteButton} from '../../components/social/VoteButton';
import {TipButton} from '../../components/social/TipButton';
import {useThemeStore} from '../../store/themeStore';

export default function FeedScreen() {
  const {toggleTheme} = useThemeStore();

  const demoPost = {
    id: 1,
    author: 'alice.sol',
    avatar: undefined,
    content:
      'Just launched my first NFT collection on Solana! 🚀 The future of digital art is here.',
    timestamp: '2 hours ago',
    upvotes: 42,
    downvotes: 3,
    tips: 5,
    isUpvoted: false,
    isDownvoted: false,
  };

  return (
    <Screen>
      <Header title="Feed" onRightPress={toggleTheme} />

      <ScrollView className="flex-1 px-4 py-4">
        {/* Demo Post */}
        <Card className="mb-4">
          <CardHeader>
            <View className="flex-row items-center space-x-3">
              <Avatar
                src={demoPost.avatar}
                alt={demoPost.author}
                fallback="A"
                size="md"
              />
              <View className="flex-1">
                <View className="flex-row items-center space-x-2">
                  <Text className="font-semibold text-foreground">
                    {demoPost.author}
                  </Text>
                  <Badge variant="verified" className="scale-75">
                    ✓
                  </Badge>
                </View>
                <Text className="text-sm text-muted-foreground">
                  {demoPost.timestamp}
                </Text>
              </View>
            </View>
          </CardHeader>

          <CardContent>
            <Text className="text-foreground mb-4">{demoPost.content}</Text>

            <Separator className="mb-4" />

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center space-x-2">
                <VoteButton
                  type="upvote"
                  count={demoPost.upvotes}
                  isVoted={demoPost.isUpvoted}
                  onPress={() => console.log('Upvote pressed')}
                />

                <VoteButton
                  type="downvote"
                  count={demoPost.downvotes}
                  isVoted={demoPost.isDownvoted}
                  onPress={() => console.log('Downvote pressed')}
                />
              </View>

              <TipButton onPress={() => console.log('Tip pressed')} size="sm" />
            </View>
          </CardContent>
        </Card>

        {/* Component Showcase */}
        <Card className="mb-4">
          <CardHeader>
            <Text className="text-lg font-semibold text-foreground">
              UI Components Showcase
            </Text>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Badges */}
            <View>
              <Text className="font-medium text-foreground mb-2">Badges</Text>
              <View className="flex-row flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="verified">Verified</Badge>
                <Badge variant="tip">Tip</Badge>
                <Badge variant="brand">Brand</Badge>
              </View>
            </View>

            <Separator />

            {/* Avatars */}
            <View>
              <Text className="font-medium text-foreground mb-2">Avatars</Text>
              <View className="flex-row items-center space-x-3">
                <Avatar size="sm" fallback="S" />
                <Avatar size="md" fallback="M" />
                <Avatar size="lg" fallback="L" />
                <Avatar size="xl" fallback="XL" />
              </View>
            </View>

            <Separator />

            {/* Voting Buttons */}
            <View>
              <Text className="font-medium text-foreground mb-2">Voting</Text>
              <View className="flex-row space-x-3">
                <VoteButton
                  type="upvote"
                  count={125}
                  isVoted={true}
                  onPress={() => {}}
                />
                <VoteButton
                  type="downvote"
                  count={12}
                  isVoted={false}
                  onPress={() => {}}
                />
              </View>
            </View>

            <Separator />

            {/* Tip Buttons */}
            <View>
              <Text className="font-medium text-foreground mb-2">
                Tip Buttons
              </Text>
              <View className="flex-row space-x-3">
                <TipButton size="sm" onPress={() => {}} />
                <TipButton size="md" onPress={() => {}} />
                <TipButton size="lg" onPress={() => {}} />
              </View>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </Screen>
  );
}
