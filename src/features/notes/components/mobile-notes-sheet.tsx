"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  FileText,
  Star,
  Clock,
  Archive,
  Trash2,
  ChevronRight,
  Folder,
  X,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  preview: string;
  modifiedAt: string;
  isPinned?: boolean;
  folder?: string;
}

interface MobileNotesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteSelect?: (noteId: string) => void;
  onCreateNote?: () => void;
  selectedNoteId?: string;
}

// Sample notes data
const sampleNotes: Note[] = [
  { id: "3", title: "Reflections on Q1 progress", preview: "The first quarter has been...", modifiedAt: "Just now", isPinned: true, folder: "Journal" },
  { id: "1", title: "Morning thoughts", preview: "Today I woke up thinking about...", modifiedAt: "2h ago", folder: "Personal" },
  { id: "5", title: "Project ideas", preview: "Brainstorming session notes", modifiedAt: "5h ago", folder: "Work" },
  { id: "2", title: "Reading list 2024", preview: "Books I want to read this year", modifiedAt: "1d ago", folder: "Personal" },
  { id: "6", title: "Meeting notes - Mar 8", preview: "Discussed roadmap priorities", modifiedAt: "1d ago", folder: "Work" },
  { id: "4", title: "Weekly review - Week 10", preview: "What went well this week", modifiedAt: "3d ago", folder: "Journal" },
];

const quickFilters = [
  { id: "all", name: "All Notes", icon: <FileText className="w-4 h-4" />, count: 24 },
  { id: "starred", name: "Starred", icon: <Star className="w-4 h-4" />, count: 3 },
  { id: "recent", name: "Recent", icon: <Clock className="w-4 h-4" />, count: 12 },
];

export function MobileNotesSheet({
  isOpen,
  onClose,
  onNoteSelect,
  onCreateNote,
  selectedNoteId = "3",
}: MobileNotesSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredNotes = sampleNotes.filter(note => {
    if (searchQuery) {
      return note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             note.preview.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (activeFilter === "starred") return note.isPinned;
    return true;
  });

  const handleNoteSelect = (noteId: string) => {
    onNoteSelect?.(noteId);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[92vh] bg-background">
        {/* Header */}
        <DrawerHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">Notes</DrawerTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 text-accent hover:text-accent/80"
                onClick={() => {
                  onCreateNote?.();
                  onClose();
                }}
              >
                <Plus className="w-5 h-5" />
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9">
                  <X className="w-5 h-5" />
                </Button>
              </DrawerClose>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-surface-sunken border-border"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            {quickFilters.map((filter) => (
              <button
                key={filter.id}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap",
                  "transition-all duration-150 ease-out",
                  "hover:scale-105 active:scale-95",
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.icon}
                <span>{filter.name}</span>
                <span className={cn(
                  "text-xs",
                  activeFilter === filter.id ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </DrawerHeader>

        {/* Notes List */}
        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-3 space-y-1">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-sunken flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No notes found</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              filteredNotes.map((note, index) => (
                <MobileNoteCard
                  key={note.id}
                  note={note}
                  isSelected={note.id === selectedNoteId}
                  onClick={() => handleNoteSelect(note.id)}
                  style={{ animationDelay: `${index * 30}ms` }}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-3 safe-area-inset-bottom">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filteredNotes.length} notes</span>
            <button className="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors">
              <span>Browse folders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface MobileNoteCardProps {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

function MobileNoteCard({ note, isSelected, onClick, style }: MobileNoteCardProps) {
  return (
    <button
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-xl text-left",
        "transition-all duration-150 ease-out animate-fade-in",
        "hover:scale-[1.01] active:scale-[0.99]",
        isSelected
          ? "bg-sidebar-accent shadow-sm ring-1 ring-accent/20"
          : "bg-surface hover:bg-secondary/50 hover:shadow-xs"
      )}
      onClick={onClick}
      style={style}
    >
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
        "transition-all duration-150",
        isSelected ? "bg-accent/10" : "bg-surface-sunken"
      )}>
        {note.isPinned ? (
          <Star className="w-4.5 h-4.5 text-accent fill-accent" />
        ) : (
          <FileText className={cn(
            "w-4.5 h-4.5",
            isSelected ? "text-accent" : "text-muted-foreground"
          )} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "text-sm truncate",
            isSelected ? "font-semibold text-foreground" : "font-medium text-foreground"
          )}>
            {note.title}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {note.preview}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground/70 bg-surface-sunken px-1.5 py-0.5 rounded">
            {note.folder}
          </span>
          <span className="text-[10px] text-muted-foreground/70">
            {note.modifiedAt}
          </span>
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className={cn(
        "w-4 h-4 flex-shrink-0 mt-3 transition-all duration-150",
        isSelected ? "text-accent" : "text-muted-foreground/50"
      )} />
    </button>
  );
}

export default MobileNotesSheet;
