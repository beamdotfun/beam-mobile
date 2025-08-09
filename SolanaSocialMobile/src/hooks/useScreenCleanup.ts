import { useEffect, useRef } from 'react';
import { useSocialStore } from '../store/socialStore';
import { useProfileStore } from '../store/profileStore';
import { logMemoryUsage, forceGarbageCollection } from '../utils/memoryUtils';

/**
 * Hook to automatically cleanup memory when screens unmount
 * @param screenName - Name of the screen for logging
 * @param cleanupDelay - Delay before cleanup (ms), default 500ms
 */
export function useScreenCleanup(screenName: string, cleanupDelay = 500) {
  const isMountedRef = useRef(true);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Log memory on mount
    console.log(`📱 ${screenName}: Screen mounted`);
    logMemoryUsage(`${screenName} - Mount`);
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
      console.log(`📱 ${screenName}: Screen unmounting, scheduling cleanup...`);
      
      // Clear any pending cleanup
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      
      // Schedule cleanup after delay to avoid affecting transitions
      cleanupTimeoutRef.current = setTimeout(() => {
        console.log(`🧹 ${screenName}: Performing memory cleanup`);
        
        // Clear large data from stores if appropriate
        const socialState = useSocialStore.getState();
        const profileState = useProfileStore.getState();
        
        // If we have too many posts, trim them
        if (socialState.posts.length > 50) {
          console.log(`🧹 ${screenName}: Trimming ${socialState.posts.length} posts to 50`);
          useSocialStore.setState({ 
            posts: socialState.posts.slice(0, 50) 
          });
        }
        
        // Clear profile data if not viewing own profile
        if (profileState.userPosts.length > 20) {
          console.log(`🧹 ${screenName}: Clearing ${profileState.userPosts.length} profile posts`);
          useProfileStore.setState({ 
            userPosts: profileState.userPosts.slice(0, 20) 
          });
        }
        
        // Force garbage collection if memory is high
        logMemoryUsage(`${screenName} - After cleanup`);
        forceGarbageCollection();
        
        console.log(`✅ ${screenName}: Cleanup complete`);
      }, cleanupDelay);
    };
  }, [screenName, cleanupDelay]);
  
  return isMountedRef;
}