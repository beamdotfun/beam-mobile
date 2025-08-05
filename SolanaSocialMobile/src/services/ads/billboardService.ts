import { BillboardAdData } from '../../components/ads/BillboardAd';

// Mock billboard ads for development
const mockBillboardAds: BillboardAdData[] = [
  {
    id: 'ad_001',
    brandName: 'SolanaSpaces',
    brandWallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    brandProfilePicture: 'https://pbs.twimg.com/profile_images/1577991240892678144/BclSZNb5_400x400.jpg',
    brandReputation: 95,
    title: 'Limited NFT Drop',
    message: 'Join the Solana Spaces community and claim your exclusive Genesis NFT! 🚀\n\nFirst 1000 claimers get a rare variant with special utilities. Be part of the future of Web3 co-working spaces.\n\n#SolanaSpaces #NFTDrop #Web3',
    mediaUrls: [
      'https://pbs.twimg.com/media/FgU8V8PWAAEQqBJ?format=jpg&name=large'
    ],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    claimReward: 0.05,
    claimType: 'nft',
    isVerified: true,
    isPinned: false,
  },
  {
    id: 'ad_002',
    brandName: 'MagicEden',
    brandWallet: 'MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8',
    brandProfilePicture: 'https://pbs.twimg.com/profile_images/1518645946388004864/XfTG8gOL_400x400.jpg',
    brandReputation: 88,
    title: 'Creator Rewards Program',
    message: 'Earn 0.1 SOL for every successful referral to Magic Eden! 💰\n\nShare your unique link and start earning today. No limits, no catches - just pure rewards for growing the community.\n\n#MagicEden #Rewards #Solana',
    mediaUrls: [
      'https://pbs.twimg.com/media/FwXiT8aXgAAaRqN?format=jpg&name=large'
    ],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    claimReward: 0.1,
    claimType: 'sol',
    isVerified: true,
    isPinned: false,
  },
  {
    id: 'ad_003',
    brandName: 'Phantom',
    brandWallet: 'PhantoAkFNvTt9s3Z1kC9Gf5KpXNnpwNQCUbKn1a7V2',
    brandProfilePicture: 'https://pbs.twimg.com/profile_images/1601911970924052481/L2jmDG4V_400x400.jpg',
    brandReputation: 92,
    title: 'Mobile Beta Access',
    message: 'Be among the first to try Phantom Mobile beta! 📱\n\nGet early access to our revolutionary mobile wallet experience. Limited spots available - claim your beta access now!\n\n#Phantom #Mobile #Beta #SolanaWallet',
    mediaUrls: [
      'https://pbs.twimg.com/media/FlQVMJZaEAE4V5z?format=jpg&name=large'
    ],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    claimReward: 0.02,
    claimType: 'token',
    isVerified: true,
    isPinned: true,
  },
  {
    id: 'ad_004',
    brandName: 'Jupiter',
    brandWallet: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
    brandProfilePicture: 'https://pbs.twimg.com/profile_images/1642888496218710016/2gXkJSdF_400x400.jpg',
    brandReputation: 90,
    title: 'Swap & Earn Campaign',
    message: 'Swap tokens on Jupiter and earn bonus JUP tokens! 🪐\n\nFor every 1 SOL swapped, get 10 JUP tokens as a bonus. Campaign runs until the end of the month.\n\n#Jupiter #DeFi #Swap #JUP',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    claimReward: 10,
    claimType: 'token',
    isVerified: true,
    isPinned: false,
  },
];

export interface BillboardAdService {
  getBillboardAdForUser: (userWallet: string) => Promise<BillboardAdData | null>;
  claimAd: (adId: string, userWallet: string) => Promise<{ success: boolean; signature?: string; error?: string }>;
  markAdViewed: (adId: string, userWallet: string) => Promise<void>;
  getAdAnalytics: (adId: string) => Promise<{ views: number; claims: number; conversion: number }>;
}

class MockBillboardAdService implements BillboardAdService {
  private viewedAds: Set<string> = new Set();
  private claimedAds: Set<string> = new Set();

  /**
   * Gets a billboard ad for a specific user
   * In production, this would use user targeting, frequency capping, etc.
   */
  async getBillboardAdForUser(userWallet: string): Promise<BillboardAdData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // TODO: Integrate with real ad serving API
    // For now, return null to show the house ad
    return null;

    // Original mock logic (commented out for now):
    /*
    // Simple logic: show ads that haven't been claimed yet
    const availableAds = mockBillboardAds.filter(ad => 
      !this.claimedAds.has(`${ad.id}_${userWallet}`)
    );

    if (availableAds.length === 0) {
      return null;
    }

    // Return the first available ad (in production, this would use targeting algorithms)
    return availableAds[0];
    */
  }

  /**
   * Claims an ad reward for a user
   */
  async claimAd(adId: string, userWallet: string): Promise<{ success: boolean; signature?: string; error?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const adKey = `${adId}_${userWallet}`;
    
    if (this.claimedAds.has(adKey)) {
      return {
        success: false,
        error: 'Ad already claimed'
      };
    }

    // Mark as claimed
    this.claimedAds.add(adKey);

    // In production, this would trigger the actual reward transaction
    // For now, return a mock signature
    const mockSignature = `claim_${adId}_${Date.now()}`;

    return {
      success: true,
      signature: mockSignature
    };
  }

  /**
   * Marks an ad as viewed (for analytics)
   */
  async markAdViewed(adId: string, userWallet: string): Promise<void> {
    const viewKey = `${adId}_${userWallet}`;
    this.viewedAds.add(viewKey);
  }

  /**
   * Gets analytics for an ad
   */
  async getAdAnalytics(adId: string): Promise<{ views: number; claims: number; conversion: number }> {
    // Mock analytics data
    const views = Math.floor(Math.random() * 10000) + 1000;
    const claims = Math.floor(Math.random() * 500) + 50;
    const conversion = claims / views;

    return { views, claims, conversion };
  }
}

// Export the service instance
export const billboardAdService = new MockBillboardAdService();

// Types for API integration (when ready)
export interface BillboardAdRequest {
  userWallet: string;
  location?: string;
  interests?: string[];
  previousAds?: string[];
}

export interface BillboardAdResponse {
  ad: BillboardAdData | null;
  trackingId: string;
  expiresAt: string;
}

export interface ClaimAdRequest {
  adId: string;
  userWallet: string;
  trackingId: string;
}

export interface ClaimAdResponse {
  success: boolean;
  transactionSignature?: string;
  reward?: {
    type: 'sol' | 'token' | 'nft';
    amount: number;
    tokenMint?: string;
    nftMint?: string;
  };
  error?: string;
}