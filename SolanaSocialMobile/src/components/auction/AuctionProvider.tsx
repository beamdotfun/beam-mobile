import React, {createContext, useContext, useEffect} from 'react';
import {useAuctionStore} from '../../store/auctionStore';

interface AuctionContextType {
  // WebSocket functionality removed - using polling instead
}

const AuctionContext = createContext<AuctionContextType | null>(null);

interface AuctionProviderProps {
  children: React.ReactNode;
}

export function AuctionProvider({children}: AuctionProviderProps) {
  const {fetchStats} = useAuctionStore();

  // Fetch initial stats when the provider mounts
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const contextValue: AuctionContextType = {};

  return (
    <AuctionContext.Provider value={contextValue}>
      {children}
    </AuctionContext.Provider>
  );
}

export function useAuctionContext() {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuctionContext must be used within an AuctionProvider');
  }
  return context;
}
