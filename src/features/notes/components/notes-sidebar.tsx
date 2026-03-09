import { useState } from "react";
import { 
  Search, 
  Plus, 
  ChevronRight, 
  ChevronDown,
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
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
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
          />
          {searchQuery && (
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
            <div className="space-y-0.5">
              {quickAccessItems.map(item => (
                <QuickAccessItem 
                  key={item.id} 
                  icon={item.icon} 
                  name={item.name} 
                  count={item.count} 
                />
              ))}
            </div>
          </div>

          {/* Folders */}
          <div>
            <div className="px-2 mb-2">
              <span className="text-micro">Folders</span>
            </div>
            <div className="space-y-0.5">
              {folders.map(folder => (
                <FolderTree
                  key={folder.id}
                  folder={folder}
                  selectedNoteId={selectedNoteId}
                  expandedFolders={expandedFolders}
                  onToggleFolder={toggleFolder}
                  onNoteSelect={onNoteSelect}
                  depth={0}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <footer className="border-t border-border p-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <span>24 notes</span>
          <span>Last sync: 2m ago</span>
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
  onClick?: () => void;
}

function QuickAccessItem({ icon, name, count, isActive, onClick }: QuickAccessItemProps) {
  return (
    <button
      className={cn(
        "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm",
        "text-sidebar-foreground/80 hover:text-sidebar-foreground",
        "hover:bg-sidebar-accent transition-colors duration-fast",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
      onClick={onClick}
    >
      <span className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span>{name}</span>
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </button>
  );
}

interface FolderTreeProps {
  folder: FolderItem;
  selectedNoteId?: string;
  expandedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  onNoteSelect?: (id: string) => void;
  depth: number;
}

function FolderTree({ 
  folder, 
  selectedNoteId, 
  expandedFolders, 
  onToggleFolder, 
  onNoteSelect,
  depth 
}: FolderTreeProps) {
  const isExpanded = expandedFolders.has(folder.id);
  const hasChildren = (folder.notes.length > 0) || (folder.subfolders && folder.subfolders.length > 0);

  return (
    <div>
      {/* Folder header */}
      <button
        className={cn(
          "w-full flex items-center gap-1 px-2 py-1.5 rounded-md text-sm group",
          "text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-fast"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onToggleFolder(folder.id)}
      >
        <span className="text-muted-foreground transition-transform duration-fast">
          {hasChildren && (
            isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
        <Folder className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1 text-left truncate">{folder.name}</span>
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {folder.notes.length + (folder.subfolders?.reduce((acc, sf) => acc + sf.notes.length, 0) || 0)}
        </span>
      </button>

      {/* Folder contents */}
      {isExpanded && (
        <div className="animate-fade-in">
          {/* Notes in this folder */}
          {folder.notes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={note.id === selectedNoteId}
              onClick={() => onNoteSelect?.(note.id)}
              depth={depth + 1}
            />
          ))}

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
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NoteItemProps {
  note: Note;
  isSelected?: boolean;
  onClick?: () => void;
  depth: number;
}

function NoteItem({ note, isSelected, onClick, depth }: NoteItemProps) {
  return (
    <button
      className={cn(
        "w-full flex items-start gap-2 px-2 py-2 rounded-md text-left group",
        "transition-colors duration-fast",
        isSelected 
          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
      onClick={onClick}
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
          "w-6 h-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
          "text-muted-foreground hover:text-foreground"
        )}
        onClick={(e) => {
          e.stopPropagation();
          // Open note menu
        }}
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </Button>
    </button>
  );
}

export default NotesSidebar;
