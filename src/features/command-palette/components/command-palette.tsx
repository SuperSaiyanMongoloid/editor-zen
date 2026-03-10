"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import {
  FileText,
  Plus,
  Search,
  Settings,
  Moon,
  Sun,
  Folder,
  Star,
  Clock,
  Archive,
  Trash2,
  Download,
  Upload,
  Copy,
  Share,
  Tag,
  Hash,
  ChevronRight,
  Keyboard,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string, data?: unknown) => void;
  isDark?: boolean;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  group: string;
  action: string;
  keywords?: string[];
}

const commands: CommandItem[] = [
  // Notes
  { id: "new-note", label: "New Note", description: "Create a new note", icon: <Plus className="w-4 h-4" />, shortcut: "⌘N", group: "Notes", action: "create-note", keywords: ["create", "add"] },
  { id: "search-notes", label: "Search Notes", description: "Search all notes", icon: <Search className="w-4 h-4" />, shortcut: "⌘F", group: "Notes", action: "search-notes", keywords: ["find"] },
  { id: "starred", label: "View Starred", description: "Show starred notes", icon: <Star className="w-4 h-4" />, group: "Notes", action: "view-starred", keywords: ["favorites", "pinned"] },
  { id: "recent", label: "Recent Notes", description: "Show recently edited", icon: <Clock className="w-4 h-4" />, group: "Notes", action: "view-recent" },
  { id: "archive", label: "View Archive", description: "Show archived notes", icon: <Archive className="w-4 h-4" />, group: "Notes", action: "view-archive" },
  { id: "trash", label: "View Trash", description: "Show deleted notes", icon: <Trash2 className="w-4 h-4" />, group: "Notes", action: "view-trash" },
  
  // Navigation
  { id: "go-folder", label: "Go to Folder...", description: "Navigate to a folder", icon: <Folder className="w-4 h-4" />, shortcut: "⌘G", group: "Navigation", action: "go-folder" },
  { id: "go-note", label: "Go to Note...", description: "Jump to a specific note", icon: <FileText className="w-4 h-4" />, shortcut: "⌘P", group: "Navigation", action: "go-note" },
  { id: "go-tag", label: "Browse Tags...", description: "Filter by tag", icon: <Tag className="w-4 h-4" />, group: "Navigation", action: "go-tag" },
  
  // Actions
  { id: "duplicate", label: "Duplicate Note", description: "Create a copy of current note", icon: <Copy className="w-4 h-4" />, shortcut: "⌘D", group: "Actions", action: "duplicate-note" },
  { id: "share", label: "Share Note", description: "Share or publish note", icon: <Share className="w-4 h-4" />, group: "Actions", action: "share-note" },
  { id: "export", label: "Export...", description: "Export note as PDF, Markdown", icon: <Download className="w-4 h-4" />, shortcut: "⌘E", group: "Actions", action: "export-note" },
  { id: "import", label: "Import...", description: "Import notes from file", icon: <Upload className="w-4 h-4" />, group: "Actions", action: "import-note" },
  { id: "add-tag", label: "Add Tag...", description: "Tag current note", icon: <Hash className="w-4 h-4" />, shortcut: "⌘T", group: "Actions", action: "add-tag" },
  
  // Settings
  { id: "toggle-theme", label: "Toggle Theme", description: "Switch light/dark mode", icon: <Moon className="w-4 h-4" />, shortcut: "⌘⇧D", group: "Settings", action: "toggle-theme" },
  { id: "settings", label: "Settings", description: "Open preferences", icon: <Settings className="w-4 h-4" />, shortcut: "⌘,", group: "Settings", action: "open-settings" },
  { id: "shortcuts", label: "Keyboard Shortcuts", description: "View all shortcuts", icon: <Keyboard className="w-4 h-4" />, shortcut: "⌘/", group: "Settings", action: "view-shortcuts" },
  { id: "help", label: "Help & Support", description: "Get help", icon: <HelpCircle className="w-4 h-4" />, group: "Settings", action: "open-help" },
  { id: "logout", label: "Sign Out", description: "Log out of your account", icon: <LogOut className="w-4 h-4" />, group: "Settings", action: "logout" },
];

// Recent notes for quick access
const recentNotes = [
  { id: "3", title: "Reflections on Q1 progress", folder: "Journal" },
  { id: "1", title: "Morning thoughts", folder: "Personal" },
  { id: "5", title: "Project ideas", folder: "Work" },
];

export function CommandPalette({ isOpen, onClose, onAction, isDark }: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const handleSelect = useCallback((action: string, data?: unknown) => {
    onAction?.(action, data);
    onClose();
    setSearch("");
  }, [onAction, onClose]);

  if (!isOpen) return null;

  const groupedCommands = commands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Command Dialog */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
        <Command
          className={cn(
            "w-full max-w-xl rounded-xl border border-border bg-popover shadow-elevated overflow-hidden pointer-events-auto",
            "animate-scale-in"
          )}
          loop
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-border px-4">
            <Search className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex-1 h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
            <kbd className="kbd text-[10px]">ESC</kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Recent Notes - Only show when no search */}
            {!search && (
              <Command.Group heading="Recent Notes">
                {recentNotes.map((note) => (
                  <Command.Item
                    key={note.id}
                    value={`recent-${note.title}`}
                    onSelect={() => handleSelect("open-note", { noteId: note.id })}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                      "text-sm text-foreground",
                      "transition-colors duration-100",
                      "aria-selected:bg-accent/10 aria-selected:text-accent-foreground",
                      "hover:bg-secondary"
                    )}
                  >
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{note.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{note.folder}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Command Groups */}
            {Object.entries(groupedCommands).map(([group, items]) => (
              <Command.Group key={group} heading={group}>
                {items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${item.keywords?.join(" ") || ""}`}
                    onSelect={() => handleSelect(item.action)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                      "text-sm text-foreground",
                      "transition-colors duration-100",
                      "aria-selected:bg-accent/10 aria-selected:text-accent-foreground",
                      "hover:bg-secondary"
                    )}
                  >
                    <span className="flex-shrink-0 text-muted-foreground">
                      {item.id === "toggle-theme" && isDark 
                        ? <Sun className="w-4 h-4" /> 
                        : item.icon
                      }
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="kbd text-[10px] flex-shrink-0">{item.shortcut}</kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="kbd text-[10px] px-1">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="kbd text-[10px] px-1">↵</kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="kbd text-[10px] px-1">⌘K</kbd>
              to open
            </span>
          </div>
        </Command>
      </div>
    </>
  );
}

// Hook for global ⌘K shortcut
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}

export default CommandPalette;
