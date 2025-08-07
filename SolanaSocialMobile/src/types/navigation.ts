import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  Modal: {
    screen: string;
    params?: any;
  };
};

export type AuthStackParamList = {
  SignIn: undefined;
  EmailSignIn: undefined;
  EmailSignUp: undefined;
  ForgotPassword: undefined;
  Welcome: undefined;
  ConnectWallet: undefined;
  CreateProfile: {
    walletAddress: string;
    displayName?: string;
    email?: string;
  };
};

export type MainTabParamList = {
  Feed: undefined;
  Search: undefined;
  Leaderboard: undefined;
  Notifications: undefined;
  Messages: undefined;
};

export type FeedStackParamList = {
  FeedHome: undefined;
  PostDetail: {
    postId: string;
  };
  ThreadDetails: {
    threadId?: string;
    thread?: any; // ThreadGroup type
    posts?: any[]; // Post[] type
  };
  UserProfile: {
    walletAddress?: string;
    username?: string;
  };
  Profile:
    | {
        walletAddress?: string;
      }
    | undefined;
  Reputation: {
    walletAddress: string;
  };
  CreatePost:
    | {
        quotedPost?: {
          id: string;
          message: string;
          user: {
            name?: string;
            profilePicture?: string;
            isVerified?: boolean;
          };
          userWallet: string;
          createdAt: string;
        };
        loadDraft?: boolean;
        draftId?: number;
      }
    | undefined;
  PinnedPosts: {
    userWallet: string;
  };
  SendTip: {
    recipientWallet: string;
    recipientName?: string;
    recipientAvatar?: string;
  };
  VoteSelection: {
    targetWallet: string;
    targetName?: string;
  };
  Verification: {
    targetWallet: string;
    targetName?: string;
  };
  // Additional screens accessible from sidebar
  Posts: undefined;
  Receipts: undefined;
  Watchlist: undefined;
  Tokens: undefined;
  Points: undefined;
  Business: undefined;
  HelpCenter: undefined;
  Settings: undefined;
  // Settings sub-screens
  GeneralSettings: undefined;
  EmailSettings: undefined;
  PasswordSettings: undefined;
  FeedSettings: undefined;
  WalletSettings: undefined;
  SolanaSettings: undefined;
  BadgesSettings: undefined;
  EditUsername: {
    currentUsername?: string;
  };
  EditProfilePicture: undefined;
  NFTSelection: undefined;
  BuySOL: undefined;
  ThreadSend: {
    threadPosts: Array<{
      id: string;
      content: string;
      order: number;
    }>;
    threadTitle?: string;
  };
  TransferDemo: undefined;
};

export type DiscoverStackParamList = {
  DiscoverHome: undefined;
  SearchResults: {
    query: string;
  };
  TrendingTopics: undefined;
  Leaderboard: {
    type: 'reputation' | 'tips' | 'posts';
  };
  // Screens accessible from search results
  PostDetail: {
    postId: string;
    post?: any;
  };
  ThreadDetails: {
    threadId: string;
    post?: any;
  };
  Profile: {
    walletAddress: string;
  };
  CreatePost: {
    quotedPost?: any;
  };
};

export type BrandStackParamList = {
  BrandHome: undefined;
  BrandDetail: {
    brandId: string;
  };
  CreateBrand: undefined;
  BrandAnalytics: {
    brandId: string;
  };
  BrandSettings: {
    brandId: string;
  };
};

export type AuctionStackParamList = {
  AuctionHome: undefined;
  AuctionDetail: {
    auctionId: string;
  };
  CreateAuction: undefined;
  BidHistory: {
    auctionId: string;
  };
  AuctionAnalytics: undefined;
  AuctionSearch: undefined;
  AuctionFilters: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  WalletSettings: undefined;
  NotificationSettings: undefined;
  PrivacySettings: undefined;
  SecuritySettings: undefined;
  SecurityEvents: undefined;
  BackupCodes: undefined;
  DataAudit: undefined;
  DeleteAccount: undefined;
  BlockedUsers: undefined;
  PrivacyPolicy: undefined;
  FeeAnalyticsDashboard: undefined;
  Admin: undefined; // Only visible for admin users
};

// Screen prop types for type-safe navigation
export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

export type AuthStackScreenProps<Screen extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, Screen>;

export type MainTabScreenProps<Screen extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, Screen>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type FeedStackScreenProps<Screen extends keyof FeedStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<FeedStackParamList, Screen>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

export type DiscoverStackScreenProps<
  Screen extends keyof DiscoverStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<DiscoverStackParamList, Screen>,
  MainTabScreenProps<keyof MainTabParamList>
>;

export type BrandStackScreenProps<Screen extends keyof BrandStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<BrandStackParamList, Screen>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

export type AuctionStackScreenProps<
  Screen extends keyof AuctionStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<AuctionStackParamList, Screen>,
  MainTabScreenProps<keyof MainTabParamList>
>;

export type ProfileStackScreenProps<
  Screen extends keyof ProfileStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, Screen>,
  MainTabScreenProps<keyof MainTabParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
