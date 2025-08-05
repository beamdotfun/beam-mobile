import {Linking} from 'react-native';
import {navigationRef} from '../navigation/NavigationService';
import {API_CONFIG} from '../config/api';

interface DeepLinkMetadata {
  source?: string;
  campaign?: string;
  medium?: string;
  content?: string;
}

interface DeepLinkRoute {
  type: 'post' | 'profile' | 'brand' | 'auction';
  id: string;
  params?: Record<string, any>;
}

class DeepLinkService {
  private pendingDeepLink: string | null = null;
  private isAuthenticated = false;
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) {return;}

    // Handle initial URL
    this.handleInitialURL();

    // Listen for URL changes
    const linkingListener = Linking.addEventListener(
      'url',
      this.handleDeepLink,

    this.isInitialized = true;

    return () => {
      linkingListener?.remove();
    };
  }

  cleanup() {
    Linking.removeAllListeners('url');
    this.isInitialized = false;
  }

  private async handleInitialURL() {
    try {
      const url = await Linking.getInitialURL();
      if (url) {
        this.handleDeepLink({url});
      }
    } catch (error) {
      console.error('Error handling initial URL:', error);
    }
  }

  private handleDeepLink = ({url}: {url: string}) => {
    console.log('Deep link received:', url);

    // Track deep link
    this.trackDeepLink(url);

    // If not authenticated, store for later
    if (!this.isAuthenticated) {
      this.pendingDeepLink = url;
      return;
    }

    this.navigateToDeepLink(url);
  };

  private trackDeepLink(url: string) {
    try {
      // Track deep link analytics
      console.log('Tracking deep link:', {
        url,
        timestamp: Date.now(),
      });

      // TODO: Integrate with analytics service when available
      // analytics().logEvent('deep_link_received', {
      //   url,
      //   timestamp: Date.now(),
      // });
    } catch (error) {
      console.error('Error tracking deep link:', error);
    }
  }

  setAuthenticated(authenticated: boolean) {
    this.isAuthenticated = authenticated;

    // Handle pending deep link after authentication
    if (authenticated && this.pendingDeepLink) {
      this.navigateToDeepLink(this.pendingDeepLink);
      this.pendingDeepLink = null;
    }
  }

  private navigateToDeepLink(url: string) {
    const route = this.parseDeepLink(url);
    if (!route) {
      console.warn('Could not parse deep link:', url);
      return;
    }

    // Navigate after a small delay to ensure navigation is ready
    setTimeout(() => {
      this.performNavigation(route);
    }, 100);
  }

  private performNavigation(route: DeepLinkRoute) {
    if (!navigationRef.current) {
      console.warn('Navigation not ready for deep link');
      return;
    }

    try {
      switch (route.type) {
        case 'post':
          navigationRef.current.navigate('Main', {
            screen: 'Feed',
            params: {
              screen: 'PostDetail',
              params: {signature: route.id},
            },
          });
          break;

        case 'profile':
          navigationRef.current.navigate('Main', {
            screen: 'Profile',
            params: {
              screen: 'UserProfile',
              params: {wallet: route.id},
            },
          });
          break;

        case 'brand':
          navigationRef.current.navigate('Main', {
            screen: 'Discover',
            params: {
              screen: 'BrandProfile',
              params: {brandId: route.id},
            },
          });
          break;

        case 'auction':
          navigationRef.current.navigate('Main', {
            screen: 'Auctions',
            params: {
              screen: 'AuctionDetail',
              params: {groupId: route.id},
            },
          });
          break;

        default:
          console.warn('Unknown deep link type:', route.type);
      }
    } catch (error) {
      console.error('Error navigating to deep link:', error);
    }
  }

  private parseDeepLink(url: string): DeepLinkRoute | null {
    try {
      const parsedUrl = new URL(url);
      const {pathname} = parsedUrl;

      // Post: /post/:signature or /p/:signature
      const postMatch = pathname.match(/^\/(?:post|p)\/(.+)$/);
      if (postMatch) {
        const signature = postMatch[1];
        return signature ? {type: 'post', id: signature} : null;
      }

      // Profile: /profile/:wallet or /u/:wallet
      const profileMatch = pathname.match(/^\/(?:profile|u)\/(.+)$/);
      if (profileMatch) {
        const wallet = profileMatch[1];
        return wallet ? {type: 'profile', id: wallet} : null;
      }

      // Brand: /brand/:brandId or /b/:brandId
      const brandMatch = pathname.match(/^\/(?:brand|b)\/(.+)$/);
      if (brandMatch) {
        const brandId = brandMatch[1];
        return brandId ? {type: 'brand', id: brandId} : null;
      }

      // Auction: /auction/:groupId or /a/:groupId
      const auctionMatch = pathname.match(/^\/(?:auction|a)\/(.+)$/);
      if (auctionMatch) {
        const groupId = auctionMatch[1];
        return groupId ? {type: 'auction', id: groupId} : null;
      }

      return null;
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return null;
    }
  }

  // Generate shareable links
  generatePostLink(signature: string): string {
    return `${API_CONFIG.BASE_URL}/p/${signature}`;
  }

  generateProfileLink(wallet: string): string {
    return `${API_CONFIG.BASE_URL}/u/${wallet}`;
  }

  generateBrandLink(brandId: string): string {
    return `${API_CONFIG.BASE_URL}/b/${brandId}`;
  }

  generateAuctionLink(groupId: string): string {
    return `${API_CONFIG.BASE_URL}/a/${groupId}`;
  }

  // Check if URL can be handled by the app
  canOpenURL(url: string): boolean {
    try {
      const route = this.parseDeepLink(url);
      return route !== null;
    } catch {
      return false;
    }
  }

  // Get pending deep link
  getPendingDeepLink(): string | null {
    return this.pendingDeepLink;
  }

  // Clear pending deep link
  clearPendingDeepLink(): void {
    this.pendingDeepLink = null;
  }
}

export const deepLinkService = new DeepLinkService();
