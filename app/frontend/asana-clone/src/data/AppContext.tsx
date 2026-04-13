import React, { createContext, useContext, useState } from 'react';
import { useTaskStore, useCommentStore, useNotificationStore, useTagStore, useSectionStore } from './store';
import * as seed from './seed';

type AppContextType = ReturnType<typeof useTaskStore> &
  ReturnType<typeof useCommentStore> &
  ReturnType<typeof useNotificationStore> &
  ReturnType<typeof useTagStore> &
  ReturnType<typeof useSectionStore> & {
    selectedTaskId: string | null;
    setSelectedTaskId: (id: string | null) => void;
    selectedTasks: string[];
    setSelectedTasks: React.Dispatch<React.SetStateAction<string[]>>;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    searchOpen: boolean;
    setSearchOpen: (v: boolean) => void;
    sidebarExpanded: boolean;
    setSidebarExpanded: React.Dispatch<React.SetStateAction<boolean>>;
    seed: typeof seed;
  };

const AppContext = createContext<AppContextType>(null!);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const taskStore = useTaskStore();
  const commentStore = useCommentStore();
  const notifStore = useNotificationStore();
  const tagStore = useTagStore();
  const sectionStore = useSectionStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <AppContext.Provider value={{
      ...taskStore,
      ...commentStore,
      ...notifStore,
      ...tagStore,
      ...sectionStore,
      selectedTaskId, setSelectedTaskId,
      selectedTasks, setSelectedTasks,
      searchQuery, setSearchQuery,
      searchOpen, setSearchOpen,
      sidebarExpanded, setSidebarExpanded,
      seed,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
