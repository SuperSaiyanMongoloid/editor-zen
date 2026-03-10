/**
 * Domain Services
 * 
 * Business logic that doesn't naturally fit within a single entity.
 * These services orchestrate complex operations across multiple entities
 * and repositories.
 */

import type {
  Note,
  NoteId,
  NoteSummary,
  Folder,
  FolderId,
  FolderTreeNode,
  Tag,
  TagId,
  UserId,
  createNote,
  createFolder,
  createTag,
  asNoteId,
  asFolderId,
  asTagId,
} from '../entities';

import type {
  IUnitOfWork,
  Result,
  NoteFilterOptions,
  NoteSortOptions,
  PaginationParams,
  PaginatedResult,
} from '../repositories';

import type { IEventBus, AllDomainEvents } from '../events';

// ============================================================================
// Note Service
// ============================================================================

export interface INoteService {
  // Queries
  getNote(id: NoteId): Promise<Result<Note | null>>;
  getNotes(
    filter?: NoteFilterOptions,
    sort?: NoteSortOptions,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<NoteSummary>>>;
  searchNotes(query: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<NoteSummary>>>;
  
  // Commands
  createNote(input: CreateNoteInput): Promise<Result<Note>>;
  updateNote(id: NoteId, input: UpdateNoteInput): Promise<Result<Note>>;
  deleteNote(id: NoteId, permanent?: boolean): Promise<Result<void>>;
  
  // Actions
  togglePin(id: NoteId): Promise<Result<Note>>;
  toggleArchive(id: NoteId): Promise<Result<Note>>;
  moveToFolder(id: NoteId, folderId: FolderId | null): Promise<Result<Note>>;
  addTag(noteId: NoteId, tagId: TagId): Promise<Result<void>>;
  removeTag(noteId: NoteId, tagId: TagId): Promise<Result<void>>;
  
  // Bulk Actions
  bulkDelete(ids: NoteId[], permanent?: boolean): Promise<Result<number>>;
  bulkMove(ids: NoteId[], folderId: FolderId | null): Promise<Result<number>>;
  bulkArchive(ids: NoteId[], archive: boolean): Promise<Result<number>>;
  
  // Trash
  emptyTrash(): Promise<Result<number>>;
  restoreFromTrash(id: NoteId): Promise<Result<Note>>;
}

export interface CreateNoteInput {
  title?: string;
  content?: string;
  folderId?: FolderId | null;
  tagIds?: TagId[];
  isPinned?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}

// ============================================================================
// Folder Service
// ============================================================================

export interface IFolderService {
  // Queries
  getFolder(id: FolderId): Promise<Result<Folder | null>>;
  getFolderTree(): Promise<Result<FolderTreeNode[]>>;
  getBreadcrumb(id: FolderId): Promise<Result<Folder[]>>;
  
  // Commands
  createFolder(input: CreateFolderInput): Promise<Result<Folder>>;
  updateFolder(id: FolderId, input: UpdateFolderInput): Promise<Result<Folder>>;
  deleteFolder(id: FolderId, moveNotesTo?: FolderId | null): Promise<Result<void>>;
  
  // Actions
  moveFolder(id: FolderId, newParentId: FolderId | null): Promise<Result<Folder>>;
  toggleExpanded(id: FolderId): Promise<Result<Folder>>;
  reorderFolders(orderedIds: FolderId[]): Promise<Result<void>>;
}

export interface CreateFolderInput {
  name: string;
  parentId?: FolderId | null;
  color?: string;
  icon?: string;
}

export interface UpdateFolderInput {
  name?: string;
  color?: string | null;
  icon?: string | null;
}

// ============================================================================
// Tag Service
// ============================================================================

export interface ITagService {
  // Queries
  getTag(id: TagId): Promise<Result<Tag | null>>;
  getAllTags(): Promise<Result<Tag[]>>;
  getTagsForNote(noteId: NoteId): Promise<Result<Tag[]>>;
  getTagUsageCounts(): Promise<Result<Map<TagId, number>>>;
  
  // Commands
  createTag(input: CreateTagInput): Promise<Result<Tag>>;
  updateTag(id: TagId, input: UpdateTagInput): Promise<Result<Tag>>;
  deleteTag(id: TagId): Promise<Result<void>>;
  
  // Actions
  mergeTag(sourceId: TagId, targetId: TagId): Promise<Result<void>>;
}

export interface CreateTagInput {
  name: string;
  color?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
}

// ============================================================================
// Content Analysis Service
// ============================================================================

export interface IContentAnalysisService {
  /**
   * Analyze note content for metadata
   */
  analyzeContent(content: string): ContentAnalysis;
  
  /**
   * Extract preview text from content
   */
  extractPreview(content: string, maxLength?: number): string;
  
  /**
   * Parse markdown to structured data
   */
  parseMarkdown(content: string): ParsedMarkdown;
}

export interface ContentAnalysis {
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
  headings: string[];
  links: string[];
  codeBlocks: number;
}

export interface ParsedMarkdown {
  title: string | null;
  headings: Array<{ level: number; text: string }>;
  plainText: string;
}

// ============================================================================
// Service Factory
// ============================================================================

export interface ServiceFactory {
  createNoteService(uow: IUnitOfWork, eventBus: IEventBus, userId: UserId): INoteService;
  createFolderService(uow: IUnitOfWork, eventBus: IEventBus, userId: UserId): IFolderService;
  createTagService(uow: IUnitOfWork, eventBus: IEventBus, userId: UserId): ITagService;
  createContentAnalysisService(): IContentAnalysisService;
}

// ============================================================================
// Content Analysis Implementation
// ============================================================================

export function createContentAnalysisService(): IContentAnalysisService {
  return {
    analyzeContent(content: string): ContentAnalysis {
      const plainText = content
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]+`/g, '') // Remove inline code
        .replace(/[#*_~\[\]()]/g, '') // Remove markdown syntax
        .trim();
      
      const words = plainText.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const characterCount = plainText.length;
      const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
      
      const headingMatches = content.match(/^#{1,6}\s+.+$/gm) || [];
      const headings = headingMatches.map(h => h.replace(/^#+\s+/, ''));
      
      const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      const links = linkMatches.map(l => {
        const match = l.match(/\[([^\]]+)\]\(([^)]+)\)/);
        return match ? match[2] : '';
      }).filter(Boolean);
      
      const codeBlockMatches = content.match(/```/g) || [];
      const codeBlocks = Math.floor(codeBlockMatches.length / 2);
      
      return {
        wordCount,
        characterCount,
        readingTimeMinutes,
        headings,
        links,
        codeBlocks,
      };
    },
    
    extractPreview(content: string, maxLength = 150): string {
      const plainText = content
        .replace(/^#.*$/gm, '') // Remove headings
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]+`/g, '') // Remove inline code
        .replace(/[#*_~\[\]()]/g, '') // Remove markdown syntax
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();
      
      if (plainText.length <= maxLength) {
        return plainText;
      }
      
      return plainText.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
    },
    
    parseMarkdown(content: string): ParsedMarkdown {
      const lines = content.split('\n');
      
      // Extract title from first heading
      let title: string | null = null;
      const headings: Array<{ level: number; text: string }> = [];
      
      for (const line of lines) {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];
          headings.push({ level, text });
          if (!title && level === 1) {
            title = text;
          }
        }
      }
      
      const plainText = content
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/[#*_~\[\]()]/g, '')
        .replace(/\n+/g, ' ')
        .trim();
      
      return { title, headings, plainText };
    },
  };
}
