import {create} from 'zustand';

interface NavigationState {
  currentRoute: string;
  previousRoute: string | null;
  tabBarVisible: boolean;

  setCurrentRoute: (route: string) => void;
  setPreviousRoute: (route: string | null) => void;
  setTabBarVisible: (visible: boolean) => void;
}

export const useNavigationStore = create<NavigationState>(set => ({
  currentRoute: 'FeedHome',
  previousRoute: null,
  tabBarVisible: true,

  setCurrentRoute: route => set({currentRoute: route}),
  setPreviousRoute: route => set({previousRoute: route}),
  setTabBarVisible: visible => set({tabBarVisible: visible}),
}));
