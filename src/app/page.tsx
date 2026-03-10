"use client";

import { useEffect, useCallback, useMemo } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { NotesSidebar } from "@/features/notes/components/notes-sidebar";
import { MobileNotesSheet } from "@/features/notes/components/mobile-notes-sheet";
import { EditorToolbar } from "@/features/editor/components/editor-toolbar";
import {
  EditorContainer,
  EditorTitleInput,
} from "@/features/editor/components/editor-container";
import { MarkdownEditor } from "@/features/editor/components/markdown-editor";
import { MobileEditorHeader } from "@/features/editor/components/mobile-editor-header";
import { EmptyEditorState } from "@/features/editor/components/empty-editor-state";
import { MetadataPanel } from "@/features/notes/components/metadata-panel";
import { CommandPalette } from "@/features/command-palette/components/command-palette";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useAppState,
  useAppActions,
  useSelectedNote,
  useNotes,
  useFolders,
  useUIState,
} from "@/contexts/app-context";

export default function Home() {
  const isMobile = useIsMobile();

  // App state from context
  const { notes, searchQuery } = useNotes();
  const { folders, folderTree, expandedFolders, toggle: toggleFolder } = useFolders();
  const { note: selectedNote, noteId: selectedNoteId, select: selectNote } = useSelectedNote();
  const { createNote, refreshNotes, search: setSearchQuery } = useNotes();
  const { updateNote, toggleNotePin, deleteNote } = useAppActions();
  const {
    syncStatus,
    isMetadataPanelOpen,
    isCommandPaletteOpen,
    mobileView,
    setMobileView,
    setMetadataPanelOpen,
    setCommandPaletteOpen,
  } = useUIState();

  // Transform folders for sidebar format
  const sidebarFolders = useMemo(() => {
    // Get notes grouped by folder
    const notesByFolder = new Map<string | null, typeof notes>();
    notes.forEach(note => {
      const folderId = note.folderId;
      if (!notesByFolder.has(folderId)) {
        notesByFolder.set(folderId, []);
      }
      notesByFolder.get(folderId)!.push(note);
    });

    // Build folder tree with notes
    const buildFolderWithNotes = (folder: typeof folders[0]): {
      id: string;
      name: string;
      notes: { id: string; title: string; preview: string; modifiedAt: string; isPinned?: boolean }[];
      subfolders?: ReturnType<typeof buildFolderWithNotes>[];
      isExpanded?: boolean;
    } => {
      const folderNotes = notesByFolder.get(folder.id) || [];
      const children = folders.filter(f => f.parentId === folder.id);
      
      return {
        id: folder.id,
        name: folder.name,
        notes: folderNotes.map(n => ({
          id: n.id,
          title: n.title,
          preview: n.preview,
          modifiedAt: formatRelativeTime(n.updatedAt),
          isPinned: n.isPinned,
        })),
        subfolders: children.length > 0 ? children.map(buildFolderWithNotes) : undefined,
        isExpanded: expandedFolders.has(folder.id as any),
      };
    };

    const rootFolders = folders.filter(f => f.parentId === null);
    return rootFolders.map(buildFolderWithNotes);
  }, [folders, notes, expandedFolders]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        handleCreateNote();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setCommandPaletteOpen]);

  // Note Actions
  const handleSelectNote = useCallback(
    async (noteId: string) => {
      await selectNote(noteId);
      if (isMobile) {
        setMobileView("editor");
      }
    },
    [isMobile, selectNote, setMobileView]
  );

  const handleCreateNote = useCallback(async () => {
    const note = await createNote();
    if (isMobile) {
      setMobileView("editor");
    }
  }, [isMobile, createNote, setMobileView]);

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!selectedNoteId) return;
      updateNote(selectedNoteId, { title });
    },
    [selectedNoteId, updateNote]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (!selectedNoteId) return;
      updateNote(selectedNoteId, { content });
    },
    [selectedNoteId, updateNote]
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh bg-background">
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />

        {mobileView === "list" ? (
          <MobileNotesSheet
            isOpen={true}
            onClose={() => setMobileView("editor")}
            selectedNoteId={selectedNoteId || undefined}
            onNoteSelect={handleSelectNote}
            onCreateNote={handleCreateNote}
          />
        ) : (
          <div className="flex flex-col h-full">
            <MobileEditorHeader
              noteTitle={selectedNote?.title || "Untitled"}
              isSaved={syncStatus === "synced"}
              isSaving={syncStatus === "syncing"}
              onBack={() => setMobileView("list")}
              onOpenMetadata={() => setMetadataPanelOpen(true)}
            />

            {selectedNote ? (
              <EditorContainer className="flex-1">
                <EditorTitleInput
                  value={selectedNote.title}
                  onChange={handleTitleChange}
                />

                <MarkdownEditor
                  initialContent={selectedNote.content}
                  onChange={handleContentChange}
                />
              </EditorContainer>
            ) : (
              <EmptyEditorState onCreateNote={handleCreateNote} />
            )}
          </div>
        )}

        {selectedNote && (
          <MetadataPanel
            isOpen={isMetadataPanelOpen}
            onClose={() => setMetadataPanelOpen(false)}
            createdAt={formatDate(selectedNote.createdAt)}
            modifiedAt={formatDate(selectedNote.updatedAt)}
            wordCount={selectedNote.wordCount}
            characterCount={selectedNote.characterCount}
            readingTime={`${selectedNote.readingTimeMinutes} min read`}
          />
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <SidebarProvider>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <NotesSidebar
        folders={sidebarFolders}
        selectedNoteId={selectedNoteId || undefined}
        onNoteSelect={handleSelectNote}
        onCreateNote={handleCreateNote}
        onSearch={setSearchQuery}
      />

      <SidebarInset className="flex flex-col h-dvh">
        <EditorToolbar
          noteTitle={selectedNote?.title}
          isSaved={syncStatus === "synced"}
          isSaving={syncStatus === "syncing"}
          isMetadataPanelOpen={isMetadataPanelOpen}
          onToggleMetadataPanel={() =>
            setMetadataPanelOpen(!isMetadataPanelOpen)
          }
        />

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            {selectedNote ? (
              <EditorContainer className="h-full">
                <EditorTitleInput
                  value={selectedNote.title}
                  onChange={handleTitleChange}
                />

                <MarkdownEditor
                  initialContent={selectedNote.content}
                  onChange={handleContentChange}
                />
              </EditorContainer>
            ) : (
              <EmptyEditorState onCreateNote={handleCreateNote} />
            )}
          </div>

          {selectedNote && isMetadataPanelOpen && (
            <MetadataPanel
              isOpen={isMetadataPanelOpen}
              onClose={() => setMetadataPanelOpen(false)}
              createdAt={formatDate(selectedNote.createdAt)}
              modifiedAt={formatDate(selectedNote.updatedAt)}
              wordCount={selectedNote.wordCount}
              characterCount={selectedNote.characterCount}
              readingTime={`${selectedNote.readingTimeMinutes} min read`}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Helper functions
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
