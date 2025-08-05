import {API_CONFIG} from '../config/api';

interface LinkPreviewData {
  title: string;
  description: string;
  image?: string;
  url: string;
}

class LinkPreviewService {
  private apiEndpoint = `${API_CONFIG.BASE_URL}/link-preview`;

  async generatePostPreview(signature: string): Promise<LinkPreviewData> {
    try {
      const response = await fetch(`${this.apiEndpoint}/post/${signature}`);
      const data = await response.json();

      if (data.success) {
        return {
          title: `${data.data.author.displayName} on Beam`,
          description: data.data.message.substring(0, 160),
          image: data.data.author.profileImage,
          url: `${API_CONFIG.BASE_URL}/p/${signature}`,
        };
      }

      throw new Error('Failed to fetch post data');
    } catch (error) {
      console.error('Error generating post preview:', error);
      return this.getDefaultPreview('post', signature);
    }
  }

  async generateProfilePreview(wallet: string): Promise<LinkPreviewData> {
    try {
      const response = await fetch(`${this.apiEndpoint}/profile/${wallet}`);
      const data = await response.json();

      if (data.success) {
        return {
          title: `${data.data.displayName} (@${
            data.data.snsName || wallet.slice(0, 8)
          })`,
          description: `${data.data.postCount} posts • ${data.data.followersCount} followers on Beam`,
          image: data.data.profileImage,
          url: `${API_CONFIG.BASE_URL}/u/${wallet}`,
        };
      }

      throw new Error('Failed to fetch profile data');
    } catch (error) {
      console.error('Error generating profile preview:', error);
      return this.getDefaultPreview('profile', wallet);
    }
  }

  async generateBrandPreview(brandId: string): Promise<LinkPreviewData> {
    try {
      const response = await fetch(`${this.apiEndpoint}/brand/${brandId}`);
      const data = await response.json();

      if (data.success) {
        return {
          title: `${data.data.name} - Brand on Beam`,
          description: data.data.description || 'Discover this brand on Beam',
          image: data.data.logoUrl,
          url: `${API_CONFIG.BASE_URL}/b/${brandId}`,
        };
      }

      throw new Error('Failed to fetch brand data');
    } catch (error) {
      console.error('Error generating brand preview:', error);
      return this.getDefaultPreview('brand', brandId);
    }
  }

  async generateAuctionPreview(groupId: string): Promise<LinkPreviewData> {
    try {
      const response = await fetch(`${this.apiEndpoint}/auction/${groupId}`);
      const data = await response.json();

      if (data.success) {
        return {
          title: `${data.data.title} - Auction on Beam`,
          description: `Starting at ${
            data.data.startingBid
          } SOL • Ends ${new Date(data.data.endTime).toLocaleDateString()}`,
          image: data.data.imageUrl,
          url: `${API_CONFIG.BASE_URL}/a/${groupId}`,
        };
      }

      throw new Error('Failed to fetch auction data');
    } catch (error) {
      console.error('Error generating auction preview:', error);
      return this.getDefaultPreview('auction', groupId);
    }
  }

  private getDefaultPreview(type: string, id: string): LinkPreviewData {
    const baseUrl = API_CONFIG.BASE_URL;

    switch (type) {
      case 'post':
        return {
          title: 'Post on Beam',
          description:
            'Check out this post on the decentralized social platform',
          image: `${baseUrl}/og-image.png`,
          url: `${baseUrl}/p/${id}`,
        };
      case 'profile':
        return {
          title: 'Profile on Beam',
          description:
            'Discover this user on the decentralized social platform',
          image: `${baseUrl}/og-image.png`,
          url: `${baseUrl}/u/${id}`,
        };
      case 'brand':
        return {
          title: 'Brand on Beam',
          description:
            'Explore this brand on the decentralized social platform',
          image: `${baseUrl}/og-image.png`,
          url: `${baseUrl}/b/${id}`,
        };
      case 'auction':
        return {
          title: 'Auction on Beam',
          description:
            'Participate in this auction on the decentralized social platform',
          image: `${baseUrl}/og-image.png`,
          url: `${baseUrl}/a/${id}`,
        };
      default:
        return {
          title: 'Beam',
          description: 'Decentralized social platform on Solana',
          image: `${baseUrl}/og-image.png`,
          url: baseUrl,
        };
    }
  }

  // Cache management for link previews
  private cache = new Map<string, {data: LinkPreviewData; timestamp: number}>();
  private readonly CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

  private getCacheKey(type: string, id: string): string {
    return `${type}:${id}`;
  }

  private getCachedPreview(type: string, id: string): LinkPreviewData | null {
    const key = this.getCacheKey(type, id);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Remove expired cache entry
    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  private setCachedPreview(
    type: string,
    id: string,
    data: LinkPreviewData,
  ): void {
    const key = this.getCacheKey(type, id);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // Public method with caching
  async getPreview(
    type: 'post' | 'profile' | 'brand' | 'auction',
    id: string,
  ): Promise<LinkPreviewData> {
    // Check cache first
    const cached = this.getCachedPreview(type, id);
    if (cached) {
      return cached;
    }

    // Generate new preview
    let preview: LinkPreviewData;
    switch (type) {
      case 'post':
        preview = await this.generatePostPreview(id);
        break;
      case 'profile':
        preview = await this.generateProfilePreview(id);
        break;
      case 'brand':
        preview = await this.generateBrandPreview(id);
        break;
      case 'auction':
        preview = await this.generateAuctionPreview(id);
        break;
      default:
        preview = this.getDefaultPreview('unknown', id);
    }

    // Cache the result
    this.setCachedPreview(type, id, preview);
    return preview;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const linkPreviewService = new LinkPreviewService();
