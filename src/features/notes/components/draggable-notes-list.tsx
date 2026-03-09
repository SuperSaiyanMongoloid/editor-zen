import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FileText,
  Folder,
  GripVertical,
  Star,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  preview: string;
  modifiedAt: string;
  isPinned?: boolean;
  folderId: string;
}

interface FolderData {
  id: string;
  name: string;
  notes: Note[];
}

interface DraggableNotesListProps {
  initialFolders?: FolderData[];
  selectedNoteId?: string;
  onNoteSelect?: (noteId: string) => void;
  onNoteMoved?: (noteId: string, fromFolder: string, toFolder: string) => void;
  onNotesReordered?: (folderId: string, noteIds: string[]) => void;
}

const defaultFolders: FolderData[] = [
  {
    id: "personal",
    name: "Personal",
    notes: [
      { id: "1", title: "Morning thoughts", preview: "Today I woke up...", modifiedAt: "2h ago", folderId: "personal" },
      { id: "2", title: "Reading list 2024", preview: "Books I want to read", modifiedAt: "1d ago", folderId: "personal" },
    ],
  },
  {
    id: "work",
    name: "Work",
    notes: [
      { id: "3", title: "Project ideas", preview: "Brainstorming notes", modifiedAt: "5h ago", isPinned: true, folderId: "work" },
      { id: "4", title: "Meeting notes", preview: "Discussed roadmap", modifiedAt: "1d ago", folderId: "work" },
    ],
  },
  {
    id: "journal",
    name: "Journal",
    notes: [
      { id: "5", title: "Q1 Reflections", preview: "The first quarter...", modifiedAt: "Just now", folderId: "journal" },
      { id: "6", title: "Weekly review", preview: "What went well", modifiedAt: "3d ago", folderId: "journal" },
    ],
  },
];

export function DraggableNotesList({
  initialFolders = defaultFolders,
  selectedNoteId = "3",
  onNoteSelect,
  onNoteMoved,
  onNotesReordered,
}: DraggableNotesListProps) {
  const [folders, setFolders] = useState<FolderData[]>(initialFolders);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(initialFolders.map(f => f.id))
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  const findNote = (noteId: string): { note: Note; folder: FolderData } | null => {
    for (const folder of folders) {
      const note = folder.notes.find(n => n.id === noteId);
      if (note) return { note, folder };
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const result = findNote(active.id as string);
    if (result) {
      setActiveNote(result.note);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveNote(null);
    setOverId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source note and folder
    const sourceResult = findNote(activeId);
    if (!sourceResult) return;

    const { note: activeNoteData, folder: sourceFolder } = sourceResult;

    // Check if dropping on a folder
    const targetFolder = folders.find(f => f.id === overId);
    if (targetFolder && targetFolder.id !== sourceFolder.id) {
      // Move note to different folder
      setFolders(prev => {
        return prev.map(folder => {
          if (folder.id === sourceFolder.id) {
            return {
              ...folder,
              notes: folder.notes.filter(n => n.id !== activeId),
            };
          }
          if (folder.id === targetFolder.id) {
            return {
              ...folder,
              notes: [...folder.notes, { ...activeNoteData, folderId: targetFolder.id }],
            };
          }
          return folder;
        });
      });
      
      onNoteMoved?.(activeId, sourceFolder.id, targetFolder.id);
      toast.success(`Moved "${activeNoteData.title}" to ${targetFolder.name}`);
      return;
    }

    // Check if dropping on another note (reorder within same folder or move)
    const overResult = findNote(overId);
    if (overResult) {
      const { folder: overFolder } = overResult;

      if (sourceFolder.id === overFolder.id) {
        // Reorder within same folder
        setFolders(prev => {
          return prev.map(folder => {
            if (folder.id === sourceFolder.id) {
              const oldIndex = folder.notes.findIndex(n => n.id === activeId);
              const newIndex = folder.notes.findIndex(n => n.id === overId);
              const newNotes = arrayMove(folder.notes, oldIndex, newIndex);
              onNotesReordered?.(folder.id, newNotes.map(n => n.id));
              return { ...folder, notes: newNotes };
            }
            return folder;
          });
        });
      } else {
        // Move to different folder, insert at position
        setFolders(prev => {
          return prev.map(folder => {
            if (folder.id === sourceFolder.id) {
              return {
                ...folder,
                notes: folder.notes.filter(n => n.id !== activeId),
              };
            }
            if (folder.id === overFolder.id) {
              const insertIndex = folder.notes.findIndex(n => n.id === overId);
              const newNotes = [...folder.notes];
              newNotes.splice(insertIndex, 0, { ...activeNoteData, folderId: overFolder.id });
              return { ...folder, notes: newNotes };
            }
            return folder;
          });
        });
        
        onNoteMoved?.(activeId, sourceFolder.id, overFolder.id);
        toast.success(`Moved "${activeNoteData.title}" to ${overFolder.name}`);
      }
    }
  };

  const allNoteIds = folders.flatMap(f => f.notes.map(n => n.id));

  return (
    <div className="w-72 border-r border-border bg-sidebar flex flex-col h-full">
      <header className="flex items-center justify-between h-12 px-4 border-b border-border">
        <h2 className="text-sm font-semibold text-sidebar-foreground">
          Notes <span className="text-muted-foreground font-normal">(drag to reorder)</span>
        </h2>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto p-2">
          {folders.map(folder => (
            <DroppableFolder
              key={folder.id}
              folder={folder}
              isExpanded={expandedFolders.has(folder.id)}
              onToggle={() => toggleFolder(folder.id)}
              isOver={overId === folder.id}
              selectedNoteId={selectedNoteId}
              onNoteSelect={onNoteSelect}
            />
          ))}
        </div>

        <DragOverlay>
          {activeNote ? (
            <DragOverlayNote note={activeNote} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <footer className="border-t border-border p-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <span>{allNoteIds.length} notes</span>
          <span>Drag to reorder</span>
        </div>
      </footer>
    </div>
  );
}

// Droppable Folder Component
interface DroppableFolderProps {
  folder: FolderData;
  isExpanded: boolean;
  onToggle: () => void;
  isOver: boolean;
  selectedNoteId?: string;
  onNoteSelect?: (noteId: string) => void;
}

function DroppableFolder({
  folder,
  isExpanded,
  onToggle,
  isOver,
  selectedNoteId,
  onNoteSelect,
}: DroppableFolderProps) {
  const { setNodeRef, isOver: isOverFolder } = useSortable({
    id: folder.id,
    data: { type: "folder", folder },
  });

  const showDropIndicator = isOver || isOverFolder;

  return (
    <div ref={setNodeRef} className="mb-2">
      {/* Folder Header */}
      <button
        className={cn(
          "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm",
          "text-sidebar-foreground",
          "transition-all duration-150 ease-out",
          "hover:bg-sidebar-accent",
          showDropIndicator && "bg-accent/20 ring-2 ring-accent ring-offset-1 ring-offset-sidebar"
        )}
        onClick={onToggle}
      >
        <span className={cn(
          "text-muted-foreground transition-transform duration-200",
          isExpanded && "rotate-90"
        )}>
          <ChevronRight className="w-4 h-4" />
        </span>
        <Folder className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1 text-left font-medium">{folder.name}</span>
        <span className="text-xs text-muted-foreground">{folder.notes.length}</span>
      </button>

      {/* Notes */}
      {isExpanded && (
        <SortableContext
          items={folder.notes.map(n => n.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="ml-4 mt-1 space-y-1">
            {folder.notes.map(note => (
              <SortableNoteItem
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId}
                onClick={() => onNoteSelect?.(note.id)}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

// Sortable Note Item
interface SortableNoteItemProps {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
}

function SortableNoteItem({ note, isSelected, onClick }: SortableNoteItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id, data: { type: "note", note } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2 px-2 py-2 rounded-lg text-left group",
        "transition-all duration-150 ease-out",
        isDragging && "opacity-50 scale-[1.02] shadow-lg z-50",
        isSelected
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
          : "hover:bg-sidebar-accent/50"
      )}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <button
        className={cn(
          "flex-shrink-0 p-0.5 rounded cursor-grab text-muted-foreground/50",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:text-muted-foreground hover:bg-secondary",
          "active:cursor-grabbing"
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {/* Note Icon */}
      <FileText className={cn(
        "w-4 h-4 mt-0.5 flex-shrink-0",
        isSelected ? "text-sidebar-accent-foreground" : "text-muted-foreground"
      )} />

      {/* Content */}
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
        <span className="text-xs text-muted-foreground/70 mt-0.5 block">
          {note.modifiedAt}
        </span>
      </div>
    </div>
  );
}

// Drag Overlay Note (ghost while dragging)
function DragOverlayNote({ note }: { note: Note }) {
  return (
    <div className={cn(
      "flex items-start gap-2 px-3 py-2 rounded-lg",
      "bg-popover border border-border shadow-elevated",
      "text-sm"
    )}>
      <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {note.isPinned && (
            <Star className="w-3 h-3 text-accent fill-accent" />
          )}
          <span className="font-medium truncate">{note.title}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {note.preview}
        </p>
      </div>
    </div>
  );
}

export default DraggableNotesList;
