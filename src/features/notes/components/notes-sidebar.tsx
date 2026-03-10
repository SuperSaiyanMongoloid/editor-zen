"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { 
  Search, 
  Plus, 
  ChevronRight, 
  FileText, 
  Folder,
  Star,
  Clock,
  Archive,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  preview: string;
  modifiedAt: string;
  isPinned?: boolean;
}

interface FolderItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  notes: Note[];
  subfolders?: FolderItem[];
  isExpanded?: boolean;
}

interface NotesSidebarProps {
  folders?: FolderItem[];
  selectedNoteId?: string;
  onNoteSelect?: (noteId: string) => void;
  onCreateNote?: () => void;
  onSearch?: (query: string) => void;
  isCollapsed?: boolean;
}

// Navigation item types for keyboard navigation
type NavItem = 
  | { type: 'quickAccess'; id: string; name: string }
  | { type: 'folder'; id: string; name: string }
  | { type: 'note'; id: string; title: string; folderId: string };

// Sample data
const defaultFolders: FolderItem[] = [
  {
    id: "personal",
    name: "Personal",
    notes: [
      { id: "1", title: "Morning thoughts", preview: "Today I woke up thinking about...", modifiedAt: "2h ago" },
      { id: "2", title: "Reading list 2024", preview: "Books I want to read this year", modifiedAt: "1d ago" },
    ],
    subfolders: [
      {
        id: "journal",
        name: "Journal",
        notes: [
          { id: "3", title: "Reflections on Q1 progress", preview: "The first quarter has been...", modifiedAt: "Just now", isPinned: true },
          { id: "4", title: "Weekly review - Week 10", preview: "What went well this week", modifiedAt: "3d ago" },
        ],
      },
    ],
    isExpanded: true,
  },
  {
    id: "work",
    name: "Work",
    notes: [
      { id: "5", title: "Project ideas", preview: "Brainstorming session notes", modifiedAt: "5h ago" },
      { id: "6", title: "Meeting notes - Mar 8", preview: "Discussed roadmap priorities", modifiedAt: "1d ago" },
    ],
    isExpanded: false,
  },
];

const quickAccessItems = [
  { id: "starred", name: "Starred", icon: <Star className="w-4 h-4" />, count: 3 },
  { id: "recent", name: "Recent", icon: <Clock className="w-4 h-4" />, count: 12 },
  { id: "archive", name: "Archive", icon: <Archive className="w-4 h-4" />, count: 8 },
  { id: "trash", name: "Trash", icon: <Trash2 className="w-4 h-4" />, count: 2 },
];

export function NotesSidebar({
  folders = defaultFolders,
  selectedNoteId = "3",
  onNoteSelect,
  onCreateNote,
  onSearch,
  isCollapsed = false,
}: NotesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(folders.filter(f => f.isExpanded).map(f => f.id))
  );
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [typeaheadBuffer, setTypeaheadBuffer] = useState("");
  const typeaheadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  // Build flat navigation list for keyboard navigation
  const navItems = useMemo(() => {
    const items: NavItem[] = [];
    
    // Quick access items
    quickAccessItems.forEach(item => {
      items.push({ type: 'quickAccess', id: item.id, name: item.name });
    });
    
    // Folders and notes
    const addFolderItems = (folder: FolderItem) => {
      items.push({ type: 'folder', id: folder.id, name: folder.name });
      
      if (expandedFolders.has(folder.id)) {
        folder.notes.forEach(note => {
          items.push({ type: 'note', id: note.id, title: note.title, folderId: folder.id });
        });
        
        folder.subfolders?.forEach(subfolder => {
          addFolderItems(subfolder);
        });
      }
    };
    
    folders.forEach(folder => addFolderItems(folder));
    
    return items;
  }, [folders, expandedFolders]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0) {
      const element = itemRefs.current.get(focusedIndex);
      element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex]);

  // Get item label for typeahead matching
  const getItemLabel = useCallback((item: NavItem): string => {
    if (item.type === 'note') return item.title;
    return item.name;
  }, []);

  // Typeahead search handler
  const handleTypeahead = useCallback((char: string) => {
    // Clear existing timeout
    if (typeaheadTimeoutRef.current) {
      clearTimeout(typeaheadTimeoutRef.current);
    }

    // Add character to buffer
    const newBuffer = typeaheadBuffer + char.toLowerCase();
    setTypeaheadBuffer(newBuffer);

    // Find matching item starting from current position
    const startIndex = focusedIndex >= 0 ? focusedIndex : 0;
    
    // Search from current position to end, then wrap to beginning
    for (let offset = 0; offset < navItems.length; offset++) {
      const index = (startIndex + offset) % navItems.length;
      const item = navItems[index];
      const label = getItemLabel(item).toLowerCase();
      
      // Skip current item for single char (allows cycling through same-letter items)
      if (offset === 0 && newBuffer.length === 1 && focusedIndex >= 0) continue;
      
      if (label.startsWith(newBuffer)) {
        setFocusedIndex(index);
        break;
      }
    }

    // Clear buffer after 800ms of no typing
    typeaheadTimeoutRef.current = setTimeout(() => {
      setTypeaheadBuffer("");
    }, 800);
  }, [typeaheadBuffer, focusedIndex, navItems, getItemLabel]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typeaheadTimeoutRef.current) {
        clearTimeout(typeaheadTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (navItems.length === 0) return;

    // Handle typeahead for printable characters
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      handleTypeahead(e.key);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < navItems.length - 1 ? prev + 1 : 0
        );
        setTypeaheadBuffer(""); // Clear buffer on arrow navigation
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : navItems.length - 1
        );
        setTypeaheadBuffer("");
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < navItems.length) {
          const item = navItems[focusedIndex];
          if (item.type === 'note') {
            onNoteSelect?.(item.id);
          } else if (item.type === 'folder') {
            toggleFolder(item.id);
          }
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (focusedIndex >= 0) {
          const item = navItems[focusedIndex];
          if (item.type === 'folder' && !expandedFolders.has(item.id)) {
            toggleFolder(item.id);
          }
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (focusedIndex >= 0) {
          const item = navItems[focusedIndex];
          if (item.type === 'folder' && expandedFolders.has(item.id)) {
            toggleFolder(item.id);
          }
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        setTypeaheadBuffer("");
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(navItems.length - 1);
        setTypeaheadBuffer("");
        break;
      case 'Escape':
        e.preventDefault();
        setFocusedIndex(-1);
        setTypeaheadBuffer("");
        containerRef.current?.blur();
        break;
      case 'Backspace':
        // Allow clearing typeahead buffer
        e.preventDefault();
        setTypeaheadBuffer(prev => prev.slice(0, -1));
        break;
    }
  }, [navItems, focusedIndex, expandedFolders, onNoteSelect, toggleFolder, handleTypeahead]);

  // Register item ref
  const registerRef = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      itemRefs.current.set(index, element);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  // Get current nav index for an item
  const getNavIndex = useCallback((type: NavItem['type'], id: string) => {
    return navItems.findIndex(item => item.type === type && item.id === id);
  }, [navItems]);

  if (isCollapsed) {
    return (
      <aside className="w-14 border-r border-border bg-sidebar flex flex-col items-center py-3 gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-9 h-9" onClick={onCreateNote}>
              <Plus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">New note</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Search className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Search</TooltipContent>
        </Tooltip>
        <div className="w-8 h-px bg-border my-1" />
        {quickAccessItems.map(item => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground">
                {item.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.name}</TooltipContent>
          </Tooltip>
        ))}
      </aside>
    );
  }

  return (
    <aside 
      ref={containerRef}
      className="w-64 border-r border-border bg-sidebar flex flex-col outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={() => {
        if (focusedIndex === -1) setFocusedIndex(0);
      }}
      onBlur={(e) => {
        // Only clear focus if focus leaves the sidebar entirely
        if (!containerRef.current?.contains(e.relatedTarget)) {
          setFocusedIndex(-1);
        }
      }}
      role="tree"
      aria-label="Notes navigation"
    >
      {/* Header */}
      <header className="flex items-center justify-between h-12 px-3 border-b border-border">
        <h2 className="text-sm font-semibold text-sidebar-foreground">Notes</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              onClick={onCreateNote}
              tabIndex={-1}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>New note</span>
            <kbd className="kbd ml-2">⌘N</kbd>
          </TooltipContent>
        </Tooltip>
      </header>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9 bg-surface-sunken border-border text-sm placeholder:text-muted-foreground/60"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                containerRef.current?.focus();
                setFocusedIndex(0);
              }
            }}
          />
          {!searchQuery && (
            <kbd className="kbd absolute right-2 top-1/2 -translate-y-1/2">⌘K</kbd>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pb-4">
          {/* Quick Access */}
          <div className="mb-4">
            <div className="px-2 mb-2">
              <span className="text-micro">Quick Access</span>
            </div>
            <div className="space-y-0.5" role="group" aria-label="Quick access">
              {quickAccessItems.map(item => {
                const navIndex = getNavIndex('quickAccess', item.id);
                return (
                  <QuickAccessItem 
                    key={item.id} 
                    icon={item.icon} 
                    name={item.name} 
                    count={item.count}
                    isFocused={focusedIndex === navIndex}
                    onClick={() => {
                      setFocusedIndex(navIndex);
                    }}
                    ref={(el) => registerRef(navIndex, el)}
                  />
                );
              })}
            </div>
          </div>

          {/* Folders */}
          <div>
            <div className="px-2 mb-2">
              <span className="text-micro">Folders</span>
            </div>
            <div className="space-y-0.5" role="group" aria-label="Folders">
              {folders.map(folder => (
                <FolderTree
                  key={folder.id}
                  folder={folder}
                  selectedNoteId={selectedNoteId}
                  expandedFolders={expandedFolders}
                  onToggleFolder={toggleFolder}
                  onNoteSelect={(id) => {
                    onNoteSelect?.(id);
                    const idx = getNavIndex('note', id);
                    setFocusedIndex(idx);
                  }}
                  depth={0}
                  focusedIndex={focusedIndex}
                  getNavIndex={getNavIndex}
                  registerRef={registerRef}
                  setFocusedIndex={setFocusedIndex}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <footer className="border-t border-border p-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          {typeaheadBuffer ? (
            <span className="flex items-center gap-1.5 text-accent animate-fade-in">
              <span className="font-mono bg-accent/10 px-1.5 py-0.5 rounded">
                {typeaheadBuffer}
              </span>
              <span className="text-muted-foreground">searching...</span>
            </span>
          ) : (
            <span>24 notes</span>
          )}
          <span className="flex items-center gap-1.5">
            <kbd className="kbd text-[10px] px-1">↑↓</kbd>
            <span>navigate</span>
          </span>
        </div>
      </footer>
    </aside>
  );
}

// --- Sub-components ---

interface QuickAccessItemProps {
  icon: React.ReactNode;
  name: string;
  count?: number;
  isActive?: boolean;
  isFocused?: boolean;
  onClick?: () => void;
}

const QuickAccessItem = React.forwardRef<HTMLButtonElement, QuickAccessItemProps>(
  ({ icon, name, count, isActive, isFocused, onClick }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "w-full flex items-center justify-between px-2 py-1.5 text-sm group",
          "text-sidebar-foreground/80",
          "transition-colors duration-150 ease-out",
          "hover:text-sidebar-foreground hover:bg-sidebar-accent",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
          isFocused && "ring-2 ring-ring ring-offset-1 ring-offset-sidebar bg-sidebar-accent/50"
        )}
        onClick={onClick}
        tabIndex={-1}
        role="treeitem"
      >
        <span className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span>{name}</span>
        </span>
        {count !== undefined && (
          <span className={cn(
            "text-xs text-muted-foreground transition-all duration-150",
            "group-hover:text-sidebar-foreground"
          )}>{count}</span>
        )}
      </button>
    );
  }
);
QuickAccessItem.displayName = "QuickAccessItem";



interface FolderTreeProps {
  folder: FolderItem;
  selectedNoteId?: string;
  expandedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  onNoteSelect?: (id: string) => void;
  depth: number;
  focusedIndex: number;
  getNavIndex: (type: NavItem['type'], id: string) => number;
  registerRef: (index: number, element: HTMLElement | null) => void;
  setFocusedIndex: (index: number) => void;
}

function FolderTree({ 
  folder, 
  selectedNoteId, 
  expandedFolders, 
  onToggleFolder, 
  onNoteSelect,
  depth,
  focusedIndex,
  getNavIndex,
  registerRef,
  setFocusedIndex,
}: FolderTreeProps) {
  const isExpanded = expandedFolders.has(folder.id);
  const hasChildren = (folder.notes?.length > 0) || (folder.subfolders?.length > 0);
  const folderNavIndex = getNavIndex('folder', folder.id);
  const isFolderFocused = focusedIndex === folderNavIndex;

  return (
    <div role="treeitem" aria-expanded={isExpanded}>
      {/* Folder header */}
      <button
        ref={(el) => registerRef(folderNavIndex, el)}
        className={cn(
          "w-full flex items-center gap-1 px-2 py-1.5 text-sm group",
          "text-sidebar-foreground",
          "transition-colors duration-150 ease-out",
          "hover:bg-sidebar-accent",
          isFolderFocused && "ring-2 ring-ring ring-offset-1 ring-offset-sidebar bg-sidebar-accent/50"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          onToggleFolder(folder.id);
          setFocusedIndex(folderNavIndex);
        }}
        tabIndex={-1}
      >
        <span className={cn(
          "text-muted-foreground transition-transform duration-200 ease-out",
          isExpanded && "rotate-90"
        )}>
          {hasChildren && <ChevronRight className="w-3.5 h-3.5" />}
        </span>
        <Folder className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1 text-left truncate">{folder.name}</span>
        <span className={cn(
          "text-xs text-muted-foreground transition-all duration-150",
          "opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0"
        )}>
          {folder.notes.length + (folder.subfolders?.reduce((acc, sf) => acc + sf.notes.length, 0) || 0)}
        </span>
      </button>

      {/* Folder contents */}
      {isExpanded && (
        <div className="animate-fade-in" role="group">
          {/* Notes in this folder */}
          {folder.notes.map(note => {
            const noteNavIndex = getNavIndex('note', note.id);
            return (
              <NoteItem
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId}
                isFocused={focusedIndex === noteNavIndex}
                onClick={() => onNoteSelect?.(note.id)}
                depth={depth + 1}
                ref={(el) => registerRef(noteNavIndex, el)}
              />
            );
          })}

          {/* Subfolders */}
          {folder.subfolders?.map(subfolder => (
            <FolderTree
              key={subfolder.id}
              folder={subfolder}
              selectedNoteId={selectedNoteId}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onNoteSelect={onNoteSelect}
              depth={depth + 1}
              focusedIndex={focusedIndex}
              getNavIndex={getNavIndex}
              registerRef={registerRef}
              setFocusedIndex={setFocusedIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  isFocused?: boolean;
  onClick: () => void;
  depth: number;
}

const NoteItem = React.forwardRef<HTMLButtonElement, NoteItemProps>(
  ({ note, isSelected, isFocused, onClick, depth }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "w-full flex items-start gap-2 px-2 py-2 text-left group",
          "transition-colors duration-150 ease-out",
          isSelected 
            ? "bg-sidebar-accent text-sidebar-accent-foreground" 
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          isFocused && "ring-2 ring-ring ring-offset-1 ring-offset-sidebar"
        )}
        style={{ paddingLeft: `${depth * 12 + 24}px` }}
        onClick={onClick}
        tabIndex={-1}
        role="treeitem"
      >
        <FileText className={cn(
          "w-4 h-4 mt-0.5 flex-shrink-0",
          isSelected ? "text-sidebar-accent-foreground" : "text-muted-foreground"
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {note.isPinned && (
              <Star className="w-3 h-3 text-accent fill-accent flex-shrink-0" />
            )}
            <span className={cn(
              "text-sm truncate",
              isSelected && "font-medium"
            )}>
              {note.title}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {note.preview}
          </p>
          <span className="text-xs text-muted-foreground/70 mt-1 block">
            {note.modifiedAt}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-6 h-6 flex-shrink-0 transition-opacity duration-150",
            "opacity-0 group-hover:opacity-100",
            "text-muted-foreground hover:text-foreground"
          )}
          onClick={(e) => {
            e.stopPropagation();
            // Open note menu
          }}
          tabIndex={-1}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </Button>
      </button>
    );
  }
);
NoteItem.displayName = "NoteItem";

export default NotesSidebar;
