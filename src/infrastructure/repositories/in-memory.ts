/**
 * In-Memory Repository Implementation
 * 
 * A complete in-memory implementation of the repository interfaces.
 * This serves as:
 * 1. Development/testing storage
 * 2. Reference implementation for other storage backends
 * 3. Offline-first local cache layer
 * 
 * Can be swapped with database implementations (Supabase, Neon, etc.)
 * by implementing the same interfaces.
 */

import type {
  Note,
  NoteId,
  NoteSummary,
  Folder,
  FolderId,
  FolderWithCount,
  FolderTreeNode,
  Tag,
  TagId,
  UserId,
  Timestamp,
  createNote,
  createFolder,
  asNoteId,
  asFolderId,
  asUserId,
} from '@/domain/entities';

import type {
  Result,
  PaginationParams,
  PaginatedResult,
  NoteSortOptions,
  NoteFilterOptions,
  INoteRepository,
  IFolderRepository,
  IUnitOfWork,
} from '@/domain/repositories';

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function success<T>(data: T): Result<T> {
  return { success: true, data };
}

function failure<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

function getPreview(content: string, maxLength = 100): string {
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...'
    : plainText;
}

function calculateWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function calculateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

// ============================================================================
// In-Memory Note Repository
// ============================================================================

export class InMemoryNoteRepository implements INoteRepository {
  private notes: Map<NoteId, Note> = new Map();
  
  constructor(initialNotes?: Note[]) {
    if (initialNotes) {
      initialNotes.forEach(note => this.notes.set(note.id, note));
    }
  }

  async findById(id: NoteId): Promise<Result<Note | null>> {
    const note = this.notes.get(id) || null;
    return success(note);
  }

  async findMany(
    filter?: NoteFilterOptions,
    sort?: NoteSortOptions,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<NoteSummary>>> {
    let notes = Array.from(this.notes.values());
    
    // Apply filters
    if (filter) {
      if (filter.folderId !== undefined) {
        notes = notes.filter(n => n.folderId === filter.folderId);
      }
      if (filter.isPinned !== undefined) {
        notes = notes.filter(n => n.isPinned === filter.isPinned);
      }
      if (filter.isArchived !== undefined) {
        notes = notes.filter(n => n.isArchived === filter.isArchived);
      }
      if (filter.isTrashed !== undefined) {
        notes = notes.filter(n => n.isTrashed === filter.isTrashed);
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        notes = notes.filter(n => 
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
        );
      }
      if (filter.tagIds && filter.tagIds.length > 0) {
        notes = notes.filter(n => 
          filter.tagIds!.some(tagId => n.tagIds.includes(tagId))
        );
      }
    }
    
    // Apply sorting
    if (sort) {
      notes.sort((a, b) => {
        let comparison = 0;
        switch (sort.field) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'updatedAt':
            comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'isPinned':
            comparison = (a.isPinned ? 1 : 0) - (b.isPinned ? 1 : 0);
            break;
        }
        return sort.direction === 'desc' ? -comparison : comparison;
      });
    } else {
      // Default: pinned first, then by updatedAt desc
      notes.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }
    
    const total = notes.length;
    
    // Apply pagination
    if (pagination) {
      notes = notes.slice(pagination.offset, pagination.offset + pagination.limit);
    }
    
    // Convert to summaries
    const summaries: NoteSummary[] = notes.map(n => ({
      id: n.id,
      title: n.title,
      preview: getPreview(n.content),
      folderId: n.folderId,
      folderName: null, // Would be populated by a join in real DB
      isPinned: n.isPinned,
      isArchived: n.isArchived,
      updatedAt: n.updatedAt,
      tagIds: n.tagIds,
    }));
    
    return success({
      items: summaries,
      total,
      hasMore: pagination ? pagination.offset + pagination.limit < total : false,
    });
  }

  async create(note: Note): Promise<Result<Note>> {
    this.notes.set(note.id, note);
    return success(note);
  }

  async update(
    id: NoteId, 
    updates: Partial<Omit<Note, 'id' | 'ownerId' | 'createdAt'>>
  ): Promise<Result<Note>> {
    const existing = this.notes.get(id);
    if (!existing) {
      return failure(new Error(`Note ${id} not found`));
    }
    
    const wordCount = updates.content !== undefined 
      ? calculateWordCount(updates.content)
      : existing.wordCount;
    
    const updated: Note = {
      ...existing,
      ...updates,
      wordCount,
      characterCount: updates.content?.length ?? existing.characterCount,
      readingTimeMinutes: calculateReadingTime(wordCount),
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    };
    
    this.notes.set(id, updated);
    return success(updated);
  }

  async delete(id: NoteId): Promise<Result<void>> {
    this.notes.delete(id);
    return success(undefined);
  }

  async bulkUpdate(ids: NoteId[], updates: Partial<Note>): Promise<Result<number>> {
    let count = 0;
    for (const id of ids) {
      const result = await this.update(id, updates);
      if (result.success) count++;
    }
    return success(count);
  }

  async bulkDelete(ids: NoteId[]): Promise<Result<number>> {
    let count = 0;
    for (const id of ids) {
      if (this.notes.delete(id)) count++;
    }
    return success(count);
  }

  async bulkMove(ids: NoteId[], targetFolderId: FolderId | null): Promise<Result<number>> {
    return this.bulkUpdate(ids, { folderId: targetFolderId });
  }

  async search(query: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<NoteSummary>>> {
    return this.findMany({ searchQuery: query, isTrashed: false }, undefined, pagination);
  }

  async findModifiedSince(timestamp: Timestamp): Promise<Result<Note[]>> {
    const notes = Array.from(this.notes.values()).filter(
      n => new Date(n.updatedAt).getTime() > new Date(timestamp).getTime()
    );
    return success(notes);
  }

  async getCount(filter?: NoteFilterOptions): Promise<Result<number>> {
    const result = await this.findMany(filter);
    return result.success ? success(result.data.total) : result;
  }

  // Helper method to get all notes (for debugging/export)
  getAll(): Note[] {
    return Array.from(this.notes.values());
  }
}

// ============================================================================
// In-Memory Folder Repository
// ============================================================================

export class InMemoryFolderRepository implements IFolderRepository {
  private folders: Map<FolderId, Folder> = new Map();
  
  constructor(initialFolders?: Folder[]) {
    if (initialFolders) {
      initialFolders.forEach(folder => this.folders.set(folder.id, folder));
    }
  }

  async findById(id: FolderId): Promise<Result<Folder | null>> {
    return success(this.folders.get(id) || null);
  }

  async findByParentId(parentId: FolderId | null): Promise<Result<Folder[]>> {
    const folders = Array.from(this.folders.values())
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return success(folders);
  }

  async findAll(): Promise<Result<FolderWithCount[]>> {
    const folders = Array.from(this.folders.values())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(f => ({
        ...f,
        noteCount: 0, // Would be populated by counting notes
        childFolderCount: Array.from(this.folders.values())
          .filter(child => child.parentId === f.id).length,
      }));
    return success(folders);
  }

  async create(folder: Folder): Promise<Result<Folder>> {
    this.folders.set(folder.id, folder);
    return success(folder);
  }

  async update(
    id: FolderId,
    updates: Partial<Omit<Folder, 'id' | 'ownerId' | 'createdAt'>>
  ): Promise<Result<Folder>> {
    const existing = this.folders.get(id);
    if (!existing) {
      return failure(new Error(`Folder ${id} not found`));
    }
    
    const updated: Folder = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    this.folders.set(id, updated);
    return success(updated);
  }

  async delete(id: FolderId): Promise<Result<void>> {
    this.folders.delete(id);
    return success(undefined);
  }

  async getTree(): Promise<Result<FolderTreeNode[]>> {
    const allFolders = Array.from(this.folders.values());
    
    const buildTree = (parentId: FolderId | null): FolderTreeNode[] => {
      return allFolders
        .filter(f => f.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(f => ({
          ...f,
          children: buildTree(f.id),
          notes: [], // Would be populated by joining with notes
        }));
    };
    
    return success(buildTree(null));
  }

  async move(id: FolderId, newParentId: FolderId | null): Promise<Result<Folder>> {
    return this.update(id, { parentId: newParentId });
  }

  async getAncestors(id: FolderId): Promise<Result<Folder[]>> {
    const ancestors: Folder[] = [];
    let current = this.folders.get(id);
    
    while (current?.parentId) {
      const parent = this.folders.get(current.parentId);
      if (parent) {
        ancestors.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    
    return success(ancestors);
  }

  async getDescendants(id: FolderId): Promise<Result<Folder[]>> {
    const descendants: Folder[] = [];
    const allFolders = Array.from(this.folders.values());
    
    const findDescendants = (parentId: FolderId) => {
      const children = allFolders.filter(f => f.parentId === parentId);
      for (const child of children) {
        descendants.push(child);
        findDescendants(child.id);
      }
    };
    
    findDescendants(id);
    return success(descendants);
  }

  async reorder(orderedIds: FolderId[]): Promise<Result<void>> {
    orderedIds.forEach((id, index) => {
      const folder = this.folders.get(id);
      if (folder) {
        this.folders.set(id, { ...folder, sortOrder: index });
      }
    });
    return success(undefined);
  }

  getAll(): Folder[] {
    return Array.from(this.folders.values());
  }
}

// ============================================================================
// In-Memory Unit of Work
// ============================================================================

export class InMemoryUnitOfWork implements Partial<IUnitOfWork> {
  public readonly notes: InMemoryNoteRepository;
  public readonly folders: InMemoryFolderRepository;
  
  constructor(
    notes?: InMemoryNoteRepository,
    folders?: InMemoryFolderRepository
  ) {
    this.notes = notes || new InMemoryNoteRepository();
    this.folders = folders || new InMemoryFolderRepository();
  }

  async beginTransaction(): Promise<void> {
    // No-op for in-memory
  }

  async commit(): Promise<void> {
    // No-op for in-memory
  }

  async rollback(): Promise<void> {
    // No-op for in-memory
  }

  async transaction<T>(work: () => Promise<T>): Promise<Result<T>> {
    try {
      const result = await work();
      return success(result);
    } catch (error) {
      return failure(error as Error);
    }
  }
}

// ============================================================================
// Factory with Sample Data
// ============================================================================

export function createSampleData(ownerId: UserId): {
  notes: Note[];
  folders: Folder[];
} {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();

  const folders: Folder[] = [
    {
      id: 'personal' as FolderId,
      ownerId,
      name: 'Personal',
      parentId: null,
      color: null,
      icon: null,
      sortOrder: 0,
      isExpanded: true,
      isArchived: false,
      createdAt: twoDaysAgo,
      updatedAt: now,
    },
    {
      id: 'journal' as FolderId,
      ownerId,
      name: 'Journal',
      parentId: 'personal' as FolderId,
      color: null,
      icon: null,
      sortOrder: 0,
      isExpanded: true,
      isArchived: false,
      createdAt: twoDaysAgo,
      updatedAt: now,
    },
    {
      id: 'work' as FolderId,
      ownerId,
      name: 'Work',
      parentId: null,
      color: null,
      icon: null,
      sortOrder: 1,
      isExpanded: false,
      isArchived: false,
      createdAt: twoDaysAgo,
      updatedAt: now,
    },
  ];

  const notes: Note[] = [
    {
      id: '1' as NoteId,
      ownerId,
      title: 'Welcome to Editor Zen',
      content: '# Welcome to Editor Zen\n\nA calm, focused writing environment designed for clarity and flow.\n\n## Features\n\n- **Distraction-free** editing\n- **Markdown** support\n- **Keyboard shortcuts** for everything\n- **Dark mode** that\'s easy on the eyes\n\n## Getting Started\n\nJust start typing. Your thoughts deserve space to breathe.',
      folderId: 'personal' as FolderId,
      tagIds: [],
      isPinned: true,
      isArchived: false,
      isTrashed: false,
      wordCount: 42,
      characterCount: 298,
      readingTimeMinutes: 1,
      createdAt: twoDaysAgo,
      updatedAt: now,
      trashedAt: null,
      version: 1,
    },
    {
      id: '2' as NoteId,
      ownerId,
      title: 'Morning Thoughts',
      content: '# Morning Thoughts\n\nToday I woke up thinking about the projects ahead. There\'s something peaceful about the early hours when the world is still quiet.\n\n## Reflections\n\nThe best ideas often come when we\'re not actively searching for them. Taking time to simply *be* is underrated.',
      folderId: 'journal' as FolderId,
      tagIds: [],
      isPinned: false,
      isArchived: false,
      isTrashed: false,
      wordCount: 52,
      characterCount: 312,
      readingTimeMinutes: 1,
      createdAt: yesterday,
      updatedAt: yesterday,
      trashedAt: null,
      version: 1,
    },
    {
      id: '3' as NoteId,
      ownerId,
      title: 'Project Ideas',
      content: '# Project Ideas\n\n## Current Focus\n\n1. Build a better note-taking experience\n2. Explore offline-first architecture\n3. Design with calm in mind\n\n## Future Exploration\n\n- AI-assisted writing helpers\n- Collaboration features\n- Mobile companion app',
      folderId: 'work' as FolderId,
      tagIds: [],
      isPinned: false,
      isArchived: false,
      isTrashed: false,
      wordCount: 38,
      characterCount: 267,
      readingTimeMinutes: 1,
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      trashedAt: null,
      version: 1,
    },
    {
      id: '4' as NoteId,
      ownerId,
      title: 'Keyboard Shortcuts',
      content: '# Keyboard Shortcuts\n\n| Action | Shortcut |\n|--------|----------|\n| New Note | ⌘ + N |\n| Search | ⌘ + K |\n| Save | ⌘ + S |\n| Bold | ⌘ + B |\n| Italic | ⌘ + I |\n\n## Pro Tips\n\nMaster these shortcuts and your writing flow will be uninterrupted.',
      folderId: 'personal' as FolderId,
      tagIds: [],
      isPinned: false,
      isArchived: false,
      isTrashed: false,
      wordCount: 36,
      characterCount: 282,
      readingTimeMinutes: 1,
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
      trashedAt: null,
      version: 1,
    },
  ];

  return { notes, folders };
}

export function createInMemoryUnitOfWork(ownerId?: UserId): InMemoryUnitOfWork {
  const userId = ownerId || ('default-user' as UserId);
  const { notes, folders } = createSampleData(userId);
  
  return new InMemoryUnitOfWork(
    new InMemoryNoteRepository(notes),
    new InMemoryFolderRepository(folders)
  );
}
