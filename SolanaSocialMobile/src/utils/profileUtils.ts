/**
 * Profile utility functions for safely handling profile data
 */

// Helper function to safely extract profile picture URL from various formats
export const getProfilePictureUrl = (profilePicture: any): string | undefined => {
  if (!profilePicture) return undefined;
  
  // If it's already a string, return it
  if (typeof profilePicture === 'string') return profilePicture;
  
  // If it's an array (ReadableNativeArray from React Native bridge), get the first item
  if (Array.isArray(profilePicture) && profilePicture.length > 0) {
    const firstItem = profilePicture[0];
    return typeof firstItem === 'string' ? firstItem : firstItem?.url;
  }
  
  // If it's an object with url property
  if (typeof profilePicture === 'object' && profilePicture.url) {
    return profilePicture.url;
  }
  
  return undefined;
};

// Helper function to get profile picture from user/profile data with fallbacks
export const getUserProfilePicture = (userData: any): string | undefined => {
  // Check for brand logo first (if it's a brand user) - fix field name to match API
  if (userData?.isBrand && userData?.brandLogoUrl) {
    return getProfilePictureUrl(userData.brandLogoUrl);
  }
  
  // Prioritize API fields first, then fallbacks for other sources
  return getProfilePictureUrl(userData?.profileImageUrl) ||      // Primary API field
         getProfilePictureUrl(userData?.profilePicture) ||       // Legacy fallback
         getProfilePictureUrl(userData?.profile_image_url) ||    // Snake case variant
         getProfilePictureUrl(userData?.avatar_url) ||           // Alternative field
         getProfilePictureUrl(userData?.userProfileImageUri) ||  // Other legacy field
         getProfilePictureUrl(userData?.brand_logo_url);         // Brand fallback
};