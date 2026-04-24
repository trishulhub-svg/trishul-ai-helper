import { create } from 'zustand';

interface AgentState {
  selectedProjectId: string | null;
  selectedConversationId: string | null;
  selectedFileId: string | null;
  sidebarOpen: boolean;
  fileViewerOpen: boolean;

  setSelectedProjectId: (id: string | null) => void;
  setSelectedConversationId: (id: string | null) => void;
  setSelectedFileId: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setFileViewerOpen: (open: boolean) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  selectedProjectId: null,
  selectedConversationId: null,
  selectedFileId: null,
  sidebarOpen: true,
  fileViewerOpen: false,

  setSelectedProjectId: (id) => set({ selectedProjectId: id, selectedConversationId: null, selectedFileId: null }),
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
  setSelectedFileId: (id) => set({ selectedFileId: id, fileViewerOpen: !!id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setFileViewerOpen: (open) => set({ fileViewerOpen: open }),
}));
