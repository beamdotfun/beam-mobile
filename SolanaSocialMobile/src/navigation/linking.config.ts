import {LinkingOptions} from '@react-navigation/native';

export interface RootStackParamList {
  Auth: undefined;
  Main: {
    screen: string;
    params?: any;
  };
  PostDetail: {
    signature: string;
  };
  UserProfile: {
    wallet: string;
  };
  BrandProfile: {
    brandId: string;
  };
  AuctionDetail: {
    groupId: string;
  };
  CreatePost: undefined;
  Settings: undefined;
}

export const linkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'beam://',
    'https://beam.app',
    'https://app.beam.io',
    'https://api.beam.fun', // Development
  ],
  config: {
    screens: {
      Auth: 'auth',
      Main: {
        screens: {
          Feed: {
            screens: {
              FeedScreen: 'feed',
              PostDetail: 'post/:signature',
            },
          },
          Profile: {
            screens: {
              ProfileScreen: 'profile',
              UserProfile: 'u/:wallet',
            },
          },
          Discover: {
            screens: {
              DiscoverScreen: 'discover',
              BrandProfile: 'brand/:brandId',
            },
          },
          Brands: {
            screens: {
              BrandsScreen: 'brands',
              BrandProfile: 'brand/:brandId',
            },
          },
          Auctions: {
            screens: {
              AuctionsScreen: 'auctions',
              AuctionDetail: 'auction/:groupId',
            },
          },
        },
      },
      // Modal screens
      PostDetail: 'post/:signature',
      UserProfile: 'profile/:wallet',
      BrandProfile: 'brand/:brandId',
      AuctionDetail: 'auction/:groupId',
      CreatePost: 'compose',
      Settings: 'settings',
    },
  },
  // Custom getStateFromPath for complex routing
  getStateFromPath: (path, options) => {
    // Handle special cases like shortened URLs
    if (path.includes('/p/')) {
      // Post shortlink
      const signature = path.split('/p/')[1];
      return {
        routes: [
          {
            name: 'Main',
            state: {
              routes: [
                {
                  name: 'Feed',
                  state: {
                    routes: [
                      {name: 'FeedScreen'},
                      {name: 'PostDetail', params: {signature}},
                    ],
                  },
                },
              ],
            },
          },
        ],
      };
    }

    if (path.includes('/u/')) {
      // Profile shortlink
      const wallet = path.split('/u/')[1];
      return {
        routes: [
          {
            name: 'Main',
            state: {
              routes: [
                {
                  name: 'Profile',
                  state: {
                    routes: [
                      {name: 'ProfileScreen'},
                      {name: 'UserProfile', params: {wallet}},
                    ],
                  },
                },
              ],
            },
          },
        ],
      };
    }

    if (path.includes('/b/')) {
      // Brand shortlink
      const brandId = path.split('/b/')[1];
      return {
        routes: [
          {
            name: 'Main',
            state: {
              routes: [
                {
                  name: 'Discover',
                  state: {
                    routes: [
                      {name: 'DiscoverScreen'},
                      {name: 'BrandProfile', params: {brandId}},
                    ],
                  },
                },
              ],
            },
          },
        ],
      };
    }

    if (path.includes('/a/')) {
      // Auction shortlink
      const groupId = path.split('/a/')[1];
      return {
        routes: [
          {
            name: 'Main',
            state: {
              routes: [
                {
                  name: 'Auctions',
                  state: {
                    routes: [
                      {name: 'AuctionsScreen'},
                      {name: 'AuctionDetail', params: {groupId}},
                    ],
                  },
                },
              ],
            },
          },
        ],
      };
    }

    // Default parsing
    return options.getStateFromPath?.(path, options);
  },
};
