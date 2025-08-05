import {NavigationProp} from '@react-navigation/native';
import {BaseNotification} from '../types/notifications';
import {RootStackParamList} from '../types/navigation';

/**
 * Handle navigation based on notification data
 */
export function handleNotificationNavigation(
  notification: BaseNotification,
  navigation: NavigationProp<RootStackParamList>,
) {
  const {data} = notification;

  // Handle explicit navigation data
  if (data.screen && data.params) {
    navigation.navigate(data.screen as any, data.params);
    return;
  }

  // Handle type-specific navigation
  switch (notification.type) {
    case 'post_like':
    case 'post_comment':
    case 'post_share':
      if (data.postId) {
        navigation.navigate('Feed', {
          screen: 'PostDetail',
          params: {postId: data.postId},
        });
      }
      break;

    case 'comment_reply':
    case 'comment_like':
      if (data.postId && data.commentId) {
        navigation.navigate('Feed', {
          screen: 'PostDetail',
          params: {
            postId: data.postId,
            highlightCommentId: data.commentId,
          },
        });
      }
      break;

    case 'user_follow':
    case 'user_mention':
    case 'user_tip':
    case 'user_vote':
      if (data.userWallet) {
        navigation.navigate('Feed', {
          screen: 'UserProfile',
          params: {walletAddress: data.userWallet},
        });
      }
      break;

    case 'brand_follow':
    case 'brand_post':
      if (data.brandId) {
        navigation.navigate('Brands', {
          screen: 'BrandDetail',
          params: {brandId: data.brandId},
        });
      }
      break;

    case 'auction_bid':
    case 'auction_won':
    case 'auction_outbid':
    case 'auction_ended':
      if (data.auctionId) {
        navigation.navigate('Auctions', {
          screen: 'AuctionDetail',
          params: {auctionId: data.auctionId},
        });
      }
      break;

    case 'system_announcement':
    case 'system_update':
      // Navigate to settings or announcements
      navigation.navigate('Feed', {
        screen: 'Settings',
      });
      break;

    case 'moderation_warning':
    case 'moderation_action':
      // Navigate to moderation or help section
      navigation.navigate('Feed', {
        screen: 'Settings',
      });
      break;

    default:
      console.log('Unknown notification type:', notification.type);
  }
}

/**
 * Generate deep link URL for notification
 */
export function generateNotificationDeepLink(
  notification: BaseNotification,
): string {
  const {data} = notification;

  const baseUrl = 'beam://';

  // Handle explicit navigation data
  if (data.screen && data.params) {
    const params = new URLSearchParams(data.params).toString();
    return `${baseUrl}${data.screen}?${params}`;
  }

  // Handle type-specific deep links
  switch (notification.type) {
    case 'post_like':
    case 'post_comment':
    case 'post_share':
      if (data.postId) {
        return `${baseUrl}post/${data.postId}`;
      }
      break;

    case 'comment_reply':
    case 'comment_like':
      if (data.postId && data.commentId) {
        return `${baseUrl}post/${data.postId}?comment=${data.commentId}`;
      }
      break;

    case 'user_follow':
    case 'user_mention':
    case 'user_tip':
    case 'user_vote':
      if (data.userWallet) {
        return `${baseUrl}user/${data.userWallet}`;
      }
      break;

    case 'brand_follow':
    case 'brand_post':
      if (data.brandId) {
        return `${baseUrl}brand/${data.brandId}`;
      }
      break;

    case 'auction_bid':
    case 'auction_won':
    case 'auction_outbid':
    case 'auction_ended':
      if (data.auctionId) {
        return `${baseUrl}auction/${data.auctionId}`;
      }
      break;

    case 'system_announcement':
    case 'system_update':
      return `${baseUrl}settings`;

    case 'moderation_warning':
    case 'moderation_action':
      return `${baseUrl}settings/moderation`;

    default:
      return `${baseUrl}notifications`;
  }

  return `${baseUrl}notifications`;
}

/**
 * Parse deep link URL to navigation parameters
 */
export function parseNotificationDeepLink(url: string): {
  screen?: string;
  params?: Record<string, any>;
} {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.slice(1); // Remove leading slash
    const searchParams = Object.fromEntries(urlObj.searchParams);

    // Handle different URL patterns
    if (path.startsWith('post/')) {
      const postId = path.split('/')[1];
      return {
        screen: 'PostDetail',
        params: {
          postId,
          ...searchParams,
        },
      };
    }

    if (path.startsWith('user/')) {
      const walletAddress = path.split('/')[1];
      return {
        screen: 'UserProfile',
        params: {walletAddress},
      };
    }

    if (path.startsWith('brand/')) {
      const brandId = path.split('/')[1];
      return {
        screen: 'BrandDetail',
        params: {brandId},
      };
    }

    if (path.startsWith('auction/')) {
      const auctionId = path.split('/')[1];
      return {
        screen: 'AuctionDetail',
        params: {auctionId},
      };
    }

    if (path === 'settings') {
      return {
        screen: 'Settings',
        params: searchParams,
      };
    }

    if (path === 'notifications') {
      return {
        screen: 'Notifications',
        params: searchParams,
      };
    }

    // Default to notifications
    return {
      screen: 'Notifications',
      params: {},
    };
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return {
      screen: 'Notifications',
      params: {},
    };
  }
}

/**
 * Handle background notification tap (when app is closed/backgrounded)
 */
export function handleBackgroundNotification(
  notificationData: any,
  navigation: NavigationProp<RootStackParamList>,
) {
  try {
    // Parse the notification data
    const notification: BaseNotification = JSON.parse(
      notificationData.notification || '{}',

    // Handle navigation
    handleNotificationNavigation(notification, navigation);
  } catch (error) {
    console.error('Failed to handle background notification:', error);
    // Fallback to notifications screen
    navigation.navigate('Notifications');
  }
}

/**
 * Handle foreground notification tap (when app is active)
 */
export function handleForegroundNotification(
  notification: BaseNotification,
  navigation: NavigationProp<RootStackParamList>,
) {
  handleNotificationNavigation(notification, navigation);
}
