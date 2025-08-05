import {MediaAsset} from '../../types/media';
import {Platform} from 'react-native';
import {useAuthStore} from '../../store/auth';
import {API_CONFIG} from '../../config/api';

class MediaService {
  private readonly baseUrl = API_CONFIG.MEDIA_URL;

  async uploadMedia(
    asset: MediaAsset,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    const formData = new FormData();

    // Prepare file for upload
    const fileData = {
      uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
      type: asset.mimeType || 'image/jpeg',
      name: asset.fileName || `media_${Date.now()}.jpg`,
    };

    formData.append('file', fileData as any);
    formData.append('type', asset.type);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response.data.url);
            } else {
              reject(new Error(response.message || 'Upload failed'));
            }
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${this.baseUrl}/upload`);

      // Add auth header if available
      const authToken = this.getAuthToken();
      if (authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
      }

      xhr.send(formData);
    });
  }

  async deleteMedia(url: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({url}),
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }
    } catch (error) {
      console.error('Media deletion failed:', error);
      throw error;
    }
  }

  private getAuthToken(): string | null {
    // Get auth token from auth store
    try {
      const {token} = useAuthStore.getState();
      return token;
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }
}

export const mediaService = new MediaService();
