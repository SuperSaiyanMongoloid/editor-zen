"use client";

/**
 * Application State Context
 * 
 * Provides centralized state management for the entire application.
 * Uses React Context with custom hooks for type-safe access.
 * 
 * Architecture:
 * - Context provides access to repositories and app state
 * - Custom hooks encapsulate domain logic
 * - Components remain thin presentation layers
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

import type {
  Note,
  NoteId,
  NoteSummary,
  Folder,
  FolderId,
  UserId,
  FolderTreeNode,
} from '@/domain/entities';

import { asNoteId, asFolderId, asUserId } from '@/domain/entities';

import {
  InMemoryUnitOfWork,
  createInMemoryUnitOfWork,
} from '@/infrastructure/repositories/in-memory';

// ============================================================================
// Types
// ============================================================================

export type SyncStatus = 'synced' | 'syncing' | 'offline';
export type ViewMode = 'list' | 'editor';
export type QuickAccessFilter = 'all' | 'starred' | 'recent' | 'archive' | 'trash';

export interface AppState {
  // User
  userId: UserId;
  
  // Notes
  notes: NoteSummary[];
  selectedNoteId: NoteId | null;
  selectedNote: Note | null;
  
  // Folders
  folders: Folder[];
  folderTree: FolderTreeNode[];
  expandedFolders: Set<FolderId>;
  
  // UI State
  syncStatus: SyncStatus;
  isMetadataPanelOpen: boolean;
  isCommandPaletteOpen: boolean;
  mobileView: ViewMode;
  quickAccessFilter: QuickAccessFilter;
  searchQuery: string;
}

export interface AppActions {
  // Note Actions
  selectNote: (noteId: NoteId | string | null) => Promise<void>;
  createNote: (folderId?: FolderId | null) => Promise<Note>;
  updateNote: (noteId: NoteId, updates: Partial<Pick<Note, 'title' | 'content'>>) => Promise<void>;
  deleteNote: (noteId: NoteId | string) => Promise<void>;
  toggleNotePin: (noteId: NoteId | string) => Promise<void>;
  moveNote: (noteId: NoteId, folderId: FolderId | null) => Promise<void>;
  
  // Folder Actions
  toggleFolderExpanded: (folderId: FolderId | string) => void;
  createFolder: (name: string, parentId?: FolderId | null) => Promise<Folder>;
  
  // UI Actions
  setMobileView: (view: ViewMode) => void;
  setMetadataPanelOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickAccessFilter: (filter: QuickAccessFilter) => void;
  setSearchQuery: (query: string) => void;
  
  // Data Actions
  refreshNotes: () => Promise<void>;
  refreshFolders: () => Promise<void>;
}

interface AppContextValue {
  state: AppState;
  actions: AppActions;
  unitOfWork: InMemoryUnitOfWork;
}

// ============================================================================
// Context
// ============================================================================

const AppContext = createContext<AppContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Initialize unit of work (repository layer)
  const [unitOfWork] = useState(() => createInMemoryUnitOfWork());
  
  // Core state
  const [userId] = useState<UserId>(() => asUserId('default-user'));
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<NoteId | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<FolderId>>(new Set());
  
  // UI state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isMetadataPanelOpen, setIsMetadataPanelOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [mobileView, setMobileView] = useState<ViewMode>('list');
  const [quickAccessFilter, setQuickAccessFilter] = useState<QuickAccessFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // Data Loading
  // ============================================================================

  const refreshNotes = useCallback(async () => {
    const result = await unitOfWork.notes.findMany(
      { isTrashed: false, searchQuery: searchQuery || undefined },
      { field: 'updatedAt', direction: 'desc' }
    );
    
    if (result.success) {
      setNotes(result.data.items);
    }
  }, [unitOfWork, searchQuery]);

  const refreshFolders = useCallback(async () => {
    const [foldersResult, treeResult] = await Promise.all([
      unitOfWork.folders.findAll(),
      unitOfWork.folders.getTree(),
    ]);
    
    if (foldersResult.success) {
      setFolders(foldersResult.data);
      // Auto-expand root folders
      const rootIds = foldersResult.data
        .filter(f => f.parentId === null)
        .map(f => f.id);
      setExpandedFolders(prev => {
        const next = new Set(prev);
        rootIds.forEach(id => next.add(id));
        return next;
      });
    }
    
    if (treeResult.success) {
      setFolderTree(treeResult.data);
    }
  }, [unitOfWork]);

  // Load initial data
  useEffect(() => {
    refreshNotes();
    refreshFolders();
  }, [refreshNotes, refreshFolders]);

  // Refresh notes when search query changes
  useEffect(() => {
    refreshNotes();
  }, [searchQuery, refreshNotes]);

  // ============================================================================
  // Note Actions
  // ============================================================================

  const selectNote = useCallback(async (noteId: NoteId | string | null) => {
    if (noteId === null) {
      setSelectedNoteId(null);
      setSelectedNote(null);
      return;
    }
    
    const id = typeof noteId === 'string' ? asNoteId(noteId) : noteId;
    setSelectedNoteId(id);
    
    const result = await unitOfWork.notes.findById(id);
    if (result.success && result.data) {
      setSelectedNote(result.data);
    }
  }, [unitOfWork]);

  const createNote = useCallback(async (folderId?: FolderId | null): Promise<Note> => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: asNoteId(`note-${Date.now()}`),
      ownerId: userId,
      title: 'Untitled',
      content: '',
      folderId: folderId ?? null,
      tagIds: [],
      isPinned: false,
      isArchived: false,
      isTrashed: false,
      wordCount: 0,
      characterCount: 0,
      readingTimeMinutes: 0,
      createdAt: now,
      updatedAt: now,
      trashedAt: null,
      version: 1,
    };
    
    await unitOfWork.notes.create(newNote);
    await refreshNotes();
    await selectNote(newNote.id);
    
    return newNote;
  }, [userId, unitOfWork, refreshNotes, selectNote]);

  const updateNote = useCallback(async (
    noteId: NoteId,
    updates: Partial<Pick<Note, 'title' | 'content'>>
  ) => {
    setSyncStatus('syncing');
    
    const result = await unitOfWork.notes.update(noteId, updates);
    
    if (result.success) {
      // Update selected note if it's the one being edited
      if (selectedNoteId === noteId) {
        setSelectedNote(result.data);
      }
      
      // Refresh note list to update previews
      await refreshNotes();
    }
    
    // Simulate network delay for sync status
    setTimeout(() => setSyncStatus('synced'), 500);
  }, [unitOfWork, selectedNoteId, refreshNotes]);

  const deleteNote = useCallback(async (noteId: NoteId | string) => {
    const id = typeof noteId === 'string' ? asNoteId(noteId) : noteId;
    
    // Soft delete by moving to trash
    await unitOfWork.notes.update(id, { 
      isTrashed: true, 
      trashedAt: new Date().toISOString() 
    });
    
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
      setSelectedNote(null);
    }
    
    await refreshNotes();
  }, [unitOfWork, selectedNoteId, refreshNotes]);

  const toggleNotePin = useCallback(async (noteId: NoteId | string) => {
    const id = typeof noteId === 'string' ? asNoteId(noteId) : noteId;
    
    const result = await unitOfWork.notes.findById(id);
    if (result.success && result.data) {
      await unitOfWork.notes.update(id, { isPinned: !result.data.isPinned });
      await refreshNotes();
      
      // Update selected note if needed
      if (selectedNoteId === id) {
        const updated = await unitOfWork.notes.findById(id);
        if (updated.success && updated.data) {
          setSelectedNote(updated.data);
        }
      }
    }
  }, [unitOfWork, selectedNoteId, refreshNotes]);

  const moveNote = useCallback(async (noteId: NoteId, folderId: FolderId | null) => {
    await unitOfWork.notes.update(noteId, { folderId });
    await refreshNotes();
  }, [unitOfWork, refreshNotes]);

  // ============================================================================
  // Folder Actions
  // ============================================================================

  const toggleFolderExpanded = useCallback((folderId: FolderId | string) => {
    const id = typeof folderId === 'string' ? asFolderId(folderId) : folderId;
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const createFolder = useCallback(async (
    name: string, 
    parentId?: FolderId | null
  ): Promise<Folder> => {
    const now = new Date().toISOString();
    const newFolder: Folder = {
      id: asFolderId(`folder-${Date.now()}`),
      ownerId: userId,
      name,
      parentId: parentId ?? null,
      color: null,
      icon: null,
      sortOrder: folders.length,
      isExpanded: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
    
    await unitOfWork.folders.create(newFolder);
    await refreshFolders();
    
    return newFolder;
  }, [userId, folders.length, unitOfWork, refreshFolders]);

  // ============================================================================
  // Memoized State & Actions
  // ============================================================================

  const state = useMemo<AppState>(() => ({
    userId,
    notes,
    selectedNoteId,
    selectedNote,
    folders,
    folderTree,
    expandedFolders,
    syncStatus,
    isMetadataPanelOpen,
    isCommandPaletteOpen,
    mobileView,
    quickAccessFilter,
    searchQuery,
  }), [
    userId,
    notes,
    selectedNoteId,
    selectedNote,
    folders,
    folderTree,
    expandedFolders,
    syncStatus,
    isMetadataPanelOpen,
    isCommandPaletteOpen,
    mobileView,
    quickAccessFilter,
    searchQuery,
  ]);

  const actions = useMemo<AppActions>(() => ({
    selectNote,
    createNote,
    updateNote,
    deleteNote,
    toggleNotePin,
    moveNote,
    toggleFolderExpanded,
    createFolder,
    setMobileView,
    setMetadataPanelOpen: setIsMetadataPanelOpen,
    setCommandPaletteOpen: setIsCommandPaletteOpen,
    setQuickAccessFilter,
    setSearchQuery,
    refreshNotes,
    refreshFolders,
  }), [
    selectNote,
    createNote,
    updateNote,
    deleteNote,
    toggleNotePin,
    moveNote,
    toggleFolderExpanded,
    createFolder,
    refreshNotes,
    refreshFolders,
  ]);

  const contextValue = useMemo<AppContextValue>(() => ({
    state,
    actions,
    unitOfWork,
  }), [state, actions, unitOfWork]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function useAppState(): AppState {
  return useApp().state;
}

export function useAppActions(): AppActions {
  return useApp().actions;
}

// Convenience hooks for common patterns
export function useSelectedNote() {
  const { selectedNote, selectedNoteId } = useAppState();
  const { selectNote, updateNote, deleteNote, toggleNotePin } = useAppActions();
  
  return {
    note: selectedNote,
    noteId: selectedNoteId,
    select: selectNote,
    update: selectedNoteId 
      ? (updates: Partial<Pick<Note, 'title' | 'content'>>) => updateNote(selectedNoteId, updates)
      : undefined,
    delete: selectedNoteId ? () => deleteNote(selectedNoteId) : undefined,
    togglePin: selectedNoteId ? () => toggleNotePin(selectedNoteId) : undefined,
  };
}

export function useNotes() {
  const { notes, searchQuery } = useAppState();
  const { createNote, refreshNotes, setSearchQuery } = useAppActions();
  
  return {
    notes,
    searchQuery,
    create: createNote,
    refresh: refreshNotes,
    search: setSearchQuery,
  };
}

export function useFolders() {
  const { folders, folderTree, expandedFolders } = useAppState();
  const { toggleFolderExpanded, createFolder, refreshFolders } = useAppActions();
  
  return {
    folders,
    folderTree,
    expandedFolders,
    toggle: toggleFolderExpanded,
    create: createFolder,
    refresh: refreshFolders,
  };
}

export function useUIState() {
  const { 
    syncStatus, 
    isMetadataPanelOpen, 
    isCommandPaletteOpen, 
    mobileView,
    quickAccessFilter,
  } = useAppState();
  
  const { 
    setMobileView, 
    setMetadataPanelOpen, 
    setCommandPaletteOpen,
    setQuickAccessFilter,
  } = useAppActions();
  
  return {
    syncStatus,
    isMetadataPanelOpen,
    isCommandPaletteOpen,
    mobileView,
    quickAccessFilter,
    setMobileView,
    setMetadataPanelOpen,
    setCommandPaletteOpen,
    setQuickAccessFilter,
  };
}
