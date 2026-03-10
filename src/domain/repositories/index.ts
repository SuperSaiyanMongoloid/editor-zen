/**
 * Repository Interfaces
 * 
 * Abstract persistence layer that defines the contract for data access.
 * Implementations can use any storage mechanism: databases, file systems,
 * cloud storage, or even in-memory stores for testing.
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
  Attachment,
  AttachmentId,
  User,
  UserId,
  Timestamp,
} from '../entities';

// ============================================================================
// Common Types
// ============================================================================

/**
 * Result wrapper for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Paginated result set
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Note sort options
 */
export interface NoteSortOptions {
  field: 'title' | 'updatedAt' | 'createdAt' | 'isPinned';
  direction: SortDirection;
}

/**
 * Note filter options
 */
export interface NoteFilterOptions {
  folderId?: FolderId | null;
  tagIds?: TagId[];
  isPinned?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
  searchQuery?: string;
  updatedAfter?: Timestamp;
  updatedBefore?: Timestamp;
}

// ============================================================================
// Repository Interfaces
// ============================================================================

/**
 * Note Repository Interface
 * Handles all note-related persistence operations
 */
export interface INoteRepository {
  // CRUD Operations
  findById(id: NoteId): Promise<Result<Note | null>>;
  findMany(
    filter?: NoteFilterOptions,
    sort?: NoteSortOptions,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<NoteSummary>>>;
  create(note: Note): Promise<Result<Note>>;
  update(id: NoteId, updates: Partial<Omit<Note, 'id' | 'ownerId' | 'createdAt'>>): Promise<Result<Note>>;
  delete(id: NoteId): Promise<Result<void>>;
  
  // Bulk Operations
  bulkUpdate(ids: NoteId[], updates: Partial<Note>): Promise<Result<number>>;
  bulkDelete(ids: NoteId[]): Promise<Result<number>>;
  bulkMove(ids: NoteId[], targetFolderId: FolderId | null): Promise<Result<number>>;
  
  // Search
  search(query: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<NoteSummary>>>;
  
  // Sync Support
  findModifiedSince(timestamp: Timestamp): Promise<Result<Note[]>>;
  
  // Stats
  getCount(filter?: NoteFilterOptions): Promise<Result<number>>;
}

/**
 * Folder Repository Interface
 * Handles all folder-related persistence operations
 */
export interface IFolderRepository {
  // CRUD Operations
  findById(id: FolderId): Promise<Result<Folder | null>>;
  findByParentId(parentId: FolderId | null): Promise<Result<Folder[]>>;
  findAll(): Promise<Result<FolderWithCount[]>>;
  create(folder: Folder): Promise<Result<Folder>>;
  update(id: FolderId, updates: Partial<Omit<Folder, 'id' | 'ownerId' | 'createdAt'>>): Promise<Result<Folder>>;
  delete(id: FolderId): Promise<Result<void>>;
  
  // Tree Operations
  getTree(): Promise<Result<FolderTreeNode[]>>;
  move(id: FolderId, newParentId: FolderId | null): Promise<Result<Folder>>;
  getAncestors(id: FolderId): Promise<Result<Folder[]>>;
  getDescendants(id: FolderId): Promise<Result<Folder[]>>;
  
  // Bulk Operations
  reorder(orderedIds: FolderId[]): Promise<Result<void>>;
}

/**
 * Tag Repository Interface
 * Handles all tag-related persistence operations
 */
export interface ITagRepository {
  // CRUD Operations
  findById(id: TagId): Promise<Result<Tag | null>>;
  findAll(): Promise<Result<Tag[]>>;
  findByNoteId(noteId: NoteId): Promise<Result<Tag[]>>;
  create(tag: Tag): Promise<Result<Tag>>;
  update(id: TagId, updates: Partial<Omit<Tag, 'id' | 'ownerId' | 'createdAt'>>): Promise<Result<Tag>>;
  delete(id: TagId): Promise<Result<void>>;
  
  // Note-Tag Association
  addToNote(tagId: TagId, noteId: NoteId): Promise<Result<void>>;
  removeFromNote(tagId: TagId, noteId: NoteId): Promise<Result<void>>;
  
  // Stats
  getNoteCounts(): Promise<Result<Map<TagId, number>>>;
}

/**
 * Attachment Repository Interface
 * Handles all attachment-related persistence operations
 */
export interface IAttachmentRepository {
  // CRUD Operations
  findById(id: AttachmentId): Promise<Result<Attachment | null>>;
  findByNoteId(noteId: NoteId): Promise<Result<Attachment[]>>;
  create(attachment: Attachment): Promise<Result<Attachment>>;
  delete(id: AttachmentId): Promise<Result<void>>;
  
  // Bulk Operations
  deleteByNoteId(noteId: NoteId): Promise<Result<number>>;
  
  // Storage
  getDownloadUrl(id: AttachmentId): Promise<Result<string>>;
}

/**
 * User Repository Interface
 * Handles all user-related persistence operations
 */
export interface IUserRepository {
  findById(id: UserId): Promise<Result<User | null>>;
  findByEmail(email: string): Promise<Result<User | null>>;
  create(user: User): Promise<Result<User>>;
  update(id: UserId, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<Result<User>>;
}

// ============================================================================
// Unit of Work Pattern
// ============================================================================

/**
 * Unit of Work interface for transaction management
 * Ensures atomic operations across multiple repositories
 */
export interface IUnitOfWork {
  readonly notes: INoteRepository;
  readonly folders: IFolderRepository;
  readonly tags: ITagRepository;
  readonly attachments: IAttachmentRepository;
  readonly users: IUserRepository;
  
  // Transaction control
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  
  // Convenience method for transactional operations
  transaction<T>(work: () => Promise<T>): Promise<Result<T>>;
}

// ============================================================================
// Storage Provider Interface
// ============================================================================

/**
 * Storage provider for file/blob storage
 * Can be implemented for Vercel Blob, S3, local filesystem, etc.
 */
export interface IStorageProvider {
  upload(file: File | Blob, path: string): Promise<Result<string>>;
  download(path: string): Promise<Result<Blob>>;
  delete(path: string): Promise<Result<void>>;
  getSignedUrl(path: string, expiresIn?: number): Promise<Result<string>>;
  exists(path: string): Promise<Result<boolean>>;
}

// ============================================================================
// Sync Provider Interface
// ============================================================================

/**
 * Sync provider for offline-first and real-time sync capabilities
 */
export interface ISyncProvider {
  // Push local changes to remote
  push(changes: SyncChange[]): Promise<Result<void>>;
  
  // Pull remote changes
  pull(since: Timestamp): Promise<Result<SyncChange[]>>;
  
  // Conflict resolution
  resolveConflict(local: SyncChange, remote: SyncChange): Promise<Result<SyncChange>>;
  
  // Connection status
  isOnline(): boolean;
  onStatusChange(callback: (online: boolean) => void): () => void;
}

export interface SyncChange {
  entityType: 'note' | 'folder' | 'tag' | 'attachment';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: Timestamp;
  version: number;
}
