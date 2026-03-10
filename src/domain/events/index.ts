/**
 * Domain Events
 * 
 * Events that represent significant state changes in the domain.
 * These enable loose coupling, event sourcing, and audit trails.
 */

import type {
  NoteId,
  FolderId,
  TagId,
  UserId,
  Timestamp,
} from '../entities';

// ============================================================================
// Base Event Type
// ============================================================================

export interface DomainEvent<T extends string = string, P = unknown> {
  readonly type: T;
  readonly payload: P;
  readonly timestamp: Timestamp;
  readonly userId: UserId;
  readonly correlationId: string;
}

// ============================================================================
// Note Events
// ============================================================================

export interface NoteCreatedEvent extends DomainEvent<'note.created', {
  noteId: NoteId;
  title: string;
  folderId: FolderId | null;
}> {}

export interface NoteUpdatedEvent extends DomainEvent<'note.updated', {
  noteId: NoteId;
  changes: {
    title?: string;
    content?: string;
    folderId?: FolderId | null;
  };
}> {}

export interface NoteDeletedEvent extends DomainEvent<'note.deleted', {
  noteId: NoteId;
  permanent: boolean;
}> {}

export interface NotePinnedEvent extends DomainEvent<'note.pinned', {
  noteId: NoteId;
  isPinned: boolean;
}> {}

export interface NoteArchivedEvent extends DomainEvent<'note.archived', {
  noteId: NoteId;
  isArchived: boolean;
}> {}

export interface NoteMovedEvent extends DomainEvent<'note.moved', {
  noteId: NoteId;
  fromFolderId: FolderId | null;
  toFolderId: FolderId | null;
}> {}

export interface NoteTaggedEvent extends DomainEvent<'note.tagged', {
  noteId: NoteId;
  tagId: TagId;
  action: 'add' | 'remove';
}> {}

// ============================================================================
// Folder Events
// ============================================================================

export interface FolderCreatedEvent extends DomainEvent<'folder.created', {
  folderId: FolderId;
  name: string;
  parentId: FolderId | null;
}> {}

export interface FolderUpdatedEvent extends DomainEvent<'folder.updated', {
  folderId: FolderId;
  changes: {
    name?: string;
    color?: string | null;
    icon?: string | null;
  };
}> {}

export interface FolderDeletedEvent extends DomainEvent<'folder.deleted', {
  folderId: FolderId;
  childNoteCount: number;
  childFolderCount: number;
}> {}

export interface FolderMovedEvent extends DomainEvent<'folder.moved', {
  folderId: FolderId;
  fromParentId: FolderId | null;
  toParentId: FolderId | null;
}> {}

// ============================================================================
// Tag Events
// ============================================================================

export interface TagCreatedEvent extends DomainEvent<'tag.created', {
  tagId: TagId;
  name: string;
  color: string;
}> {}

export interface TagUpdatedEvent extends DomainEvent<'tag.updated', {
  tagId: TagId;
  changes: {
    name?: string;
    color?: string;
  };
}> {}

export interface TagDeletedEvent extends DomainEvent<'tag.deleted', {
  tagId: TagId;
  affectedNoteCount: number;
}> {}

// ============================================================================
// Sync Events
// ============================================================================

export interface SyncStartedEvent extends DomainEvent<'sync.started', {
  direction: 'push' | 'pull' | 'both';
}> {}

export interface SyncCompletedEvent extends DomainEvent<'sync.completed', {
  direction: 'push' | 'pull' | 'both';
  changesApplied: number;
}> {}

export interface SyncFailedEvent extends DomainEvent<'sync.failed', {
  direction: 'push' | 'pull' | 'both';
  error: string;
}> {}

export interface SyncConflictEvent extends DomainEvent<'sync.conflict', {
  entityType: 'note' | 'folder' | 'tag';
  entityId: string;
  resolution: 'local' | 'remote' | 'merge';
}> {}

// ============================================================================
// Union Types
// ============================================================================

export type NoteEvent =
  | NoteCreatedEvent
  | NoteUpdatedEvent
  | NoteDeletedEvent
  | NotePinnedEvent
  | NoteArchivedEvent
  | NoteMovedEvent
  | NoteTaggedEvent;

export type FolderEvent =
  | FolderCreatedEvent
  | FolderUpdatedEvent
  | FolderDeletedEvent
  | FolderMovedEvent;

export type TagEvent =
  | TagCreatedEvent
  | TagUpdatedEvent
  | TagDeletedEvent;

export type SyncEvent =
  | SyncStartedEvent
  | SyncCompletedEvent
  | SyncFailedEvent
  | SyncConflictEvent;

export type AllDomainEvents =
  | NoteEvent
  | FolderEvent
  | TagEvent
  | SyncEvent;

// ============================================================================
// Event Bus Interface
// ============================================================================

export type EventHandler<E extends DomainEvent> = (event: E) => void | Promise<void>;

export interface IEventBus {
  publish<E extends DomainEvent>(event: E): void;
  subscribe<E extends DomainEvent>(
    eventType: E['type'],
    handler: EventHandler<E>
  ): () => void;
  subscribeAll(handler: EventHandler<AllDomainEvents>): () => void;
}

// ============================================================================
// Event Factory
// ============================================================================

let correlationCounter = 0;

export function createEvent<T extends AllDomainEvents['type'], P>(
  type: T,
  payload: P,
  userId: UserId
): DomainEvent<T, P> {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    userId,
    correlationId: `${Date.now()}-${++correlationCounter}`,
  };
}
