import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ViewedBusiness {
  id: string;
  name: string;
  imageUrl?: string;
  category?: string;
  viewedAt: number;
}

interface RecentViewsStore {
  history: ViewedBusiness[];
  addViewedBusiness: (business: Omit<ViewedBusiness, 'viewedAt'>) => void;
  clearHistory: () => void;
  getRecentViews: (limit?: number) => ViewedBusiness[];
}

const MAX_HISTORY_LENGTH = 10;

export const useRecentViewsStore = create<RecentViewsStore>()(
  persist(
    (set, get) => ({
      history: [],
      
      addViewedBusiness: (business) => {
        const currentHistory = get().history;
        
        // Remove if already exists (to move to top)
        const filteredHistory = currentHistory.filter(b => b.id !== business.id);
        
        const newEntry: ViewedBusiness = {
          ...business,
          viewedAt: Date.now(),
        };
        
        // Add to beginning and limit length
        const newHistory = [newEntry, ...filteredHistory].slice(0, MAX_HISTORY_LENGTH);
        
        set({ history: newHistory });
      },
      
      clearHistory: () => {
        set({ history: [] });
      },
      
      getRecentViews: (limit = 5) => {
        return get().history.slice(0, limit);
      },
    }),
    {
      name: 'yookie-recent-views',
    }
  )
);
