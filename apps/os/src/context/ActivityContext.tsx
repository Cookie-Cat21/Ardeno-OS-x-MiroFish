// Stub ActivityContext — kept for backwards compatibility with kanban components.
// The original Ardeno OS uses RealActivityFeed from Supabase instead of an in-memory feed.
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ActivityItem } from '@/types';

interface ActivityContextType {
  activities: ActivityItem[];
  addActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
}

const ActivityContext = createContext<ActivityContextType>({
  activities: [],
  addActivity: () => {},
});

export function ActivityProvider({ children }: { children: ReactNode }) {
  return (
    <ActivityContext.Provider value={{ activities: [], addActivity: () => {} }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  return useContext(ActivityContext);
}
