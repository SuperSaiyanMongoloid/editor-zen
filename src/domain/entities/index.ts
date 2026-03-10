/**
 * Domain Entities
 * 
 * Core business objects that represent the fundamental data structures
 * of the application. These entities are persistence-agnostic and can
 * be mapped to any storage mechanism.
 */

// ============================================================================
// Base Types
// ============================================================================

/** Unique identifier type - can be UUID, CUID, or database-specific ID */
export type EntityId = string;

/** ISO 8601 timestamp string for serialization compatibility */
export type Timestamp = string;

/** Branded type for ensuring type safety with IDs */
export type NoteId = EntityId & { readonly __brand: 'NoteId' };
export type FolderId = EntityId & { readonly __brand: 'FolderId' };
export type TagId = EntityId & { readonly __brand: 'TagId' };
export type UserId = EntityId & { readonly __brand: 'UserId' };
export type AttachmentId = EntityId & { readonly __brand: 'AttachmentId' };

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Note Entity
 * The primary content unit in the application
 */
export interface Note {
  readonly id: NoteId;
  title: string;
  content: string;
  
  // Organization
  folderId: FolderId | null;
  tagIds: TagId[];
  
  // Flags
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  
  // Metadata
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  trashedAt: Timestamp | null;
  
  // Ownership (for multi-user support)
  ownerId: UserId;
  
  // Versioning support
  version: number;
}

/**
 * Folder Entity
 * Hierarchical organization container for notes
 */
export interface Folder {
  readonly id: FolderId;
  name: string;
  parentId: FolderId | null;
  
  // Display
  color: string | null;
  icon: string | null;
  sortOrder: number;
  
  // Flags
  isExpanded: boolean;
  isArchived: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Ownership
  ownerId: UserId;
}

/**
 * Tag Entity
 * Cross-cutting categorization for notes
 */
export interface Tag {
  readonly id: TagId;
  name: string;
  color: string;
  
  // Timestamps
  createdAt: Timestamp;
  
  // Ownership
  ownerId: UserId;
}

/**
 * Attachment Entity
 * File attachments linked to notes
 */
export interface Attachment {
  readonly id: AttachmentId;
  noteId: NoteId;
  
  // File metadata
  filename: string;
  mimeType: string;
  sizeBytes: number;
  
  // Storage reference (URL, blob path, or storage key)
  storageRef: string;
  
  // Timestamps
  createdAt: Timestamp;
  
  // Ownership
  ownerId: UserId;
}

/**
 * User Entity
 * Application user for multi-tenancy support
 */
export interface User {
  readonly id: UserId;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  
  // Timestamps
  createdAt: Timestamp;
  lastLoginAt: Timestamp | null;
}

// ============================================================================
// View Models / DTOs
// ============================================================================

/**
 * Note summary for list views (minimal data)
 */
export interface NoteSummary {
  id: NoteId;
  title: string;
  preview: string;
  folderId: FolderId | null;
  folderName: string | null;
  isPinned: boolean;
  isArchived: boolean;
  updatedAt: Timestamp;
  tagIds: TagId[];
}

/**
 * Folder with computed note count
 */
export interface FolderWithCount extends Folder {
  noteCount: number;
  childFolderCount: number;
}

/**
 * Hierarchical folder tree node
 */
export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
  notes: NoteSummary[];
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new Note with defaults
 */
export function createNote(
  id: NoteId,
  ownerId: UserId,
  partial?: Partial<Omit<Note, 'id' | 'ownerId'>>
): Note {
  const now = new Date().toISOString();
  return {
    id,
    ownerId,
    title: partial?.title ?? 'Untitled',
    content: partial?.content ?? '',
    folderId: partial?.folderId ?? null,
    tagIds: partial?.tagIds ?? [],
    isPinned: partial?.isPinned ?? false,
    isArchived: partial?.isArchived ?? false,
    isTrashed: partial?.isTrashed ?? false,
    wordCount: partial?.wordCount ?? 0,
    characterCount: partial?.characterCount ?? 0,
    readingTimeMinutes: partial?.readingTimeMinutes ?? 0,
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    trashedAt: partial?.trashedAt ?? null,
    version: partial?.version ?? 1,
  };
}

/**
 * Create a new Folder with defaults
 */
export function createFolder(
  id: FolderId,
  ownerId: UserId,
  partial?: Partial<Omit<Folder, 'id' | 'ownerId'>>
): Folder {
  const now = new Date().toISOString();
  return {
    id,
    ownerId,
    name: partial?.name ?? 'New Folder',
    parentId: partial?.parentId ?? null,
    color: partial?.color ?? null,
    icon: partial?.icon ?? null,
    sortOrder: partial?.sortOrder ?? 0,
    isExpanded: partial?.isExpanded ?? true,
    isArchived: partial?.isArchived ?? false,
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
  };
}

/**
 * Create a new Tag with defaults
 */
export function createTag(
  id: TagId,
  ownerId: UserId,
  partial?: Partial<Omit<Tag, 'id' | 'ownerId'>>
): Tag {
  return {
    id,
    ownerId,
    name: partial?.name ?? 'New Tag',
    color: partial?.color ?? '#6366f1',
    createdAt: partial?.createdAt ?? new Date().toISOString(),
  };
}

// ============================================================================
// Type Guards
// ============================================================================

export function isNote(obj: unknown): obj is Note {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'content' in obj &&
    'ownerId' in obj
  );
}

export function isFolder(obj: unknown): obj is Folder {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'parentId' in obj &&
    'ownerId' in obj
  );
}

// ============================================================================
// ID Utilities
// ============================================================================

export function asNoteId(id: string): NoteId {
  return id as NoteId;
}

export function asFolderId(id: string): FolderId {
  return id as FolderId;
}

export function asTagId(id: string): TagId {
  return id as TagId;
}

export function asUserId(id: string): UserId {
  return id as UserId;
}

export function asAttachmentId(id: string): AttachmentId {
  return id as AttachmentId;
}
