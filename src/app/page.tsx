"use client";

import { useState, useEffect, useCallback } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { NotesSidebar } from "@/features/notes/components/notes-sidebar";
import { MobileNotesSheet } from "@/features/notes/components/mobile-notes-sheet";
import { EditorToolbar } from "@/features/editor/components/editor-toolbar";
import { EditorContainer, EditorTitleInput } from "@/features/editor/components/editor-container";
import { MarkdownEditor } from "@/features/editor/components/markdown-editor";
import { MobileEditorHeader } from "@/features/editor/components/mobile-editor-header";
import { EmptyEditorState } from "@/features/editor/components/empty-editor-state";
import { MetadataPanel } from "@/features/notes/components/metadata-panel";
import { CommandPalette } from "@/features/command-palette/components/command-palette";
import { useIsMobile } from "@/hooks/use-mobile";

// Sample data
const sampleFolders = [
  { id: "1", name: "Personal", parentId: null },
  { id: "2", name: "Work", parentId: null },
  { id: "3", name: "Projects", parentId: "2" },
];

const sampleNotes = [
  {
    id: "1",
    title: "Welcome to Editor Zen",
    content: "# Welcome to Editor Zen\n\nA calm, focused writing environment...",
    folderId: "1",
    isPinned: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "Getting Started",
    content: "# Getting Started\n\nUse keyboard shortcuts for quick navigation...",
    folderId: "1",
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    title: "Project Notes",
    content: "# Project Notes\n\nKey milestones and deliverables...",
    folderId: "3",
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function Home() {
  const isMobile = useIsMobile();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>("1");
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");
  const [isMetadataPanelOpen, setIsMetadataPanelOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notes, setNotes] = useState(sampleNotes);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced");

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  // Keyboard shortcuts
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
  }, []);

  const handleSelectNote = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
    if (isMobile) {
      setMobileView("editor");
    }
  }, [isMobile]);

  const handleCreateNote = useCallback(() => {
    const newNote = {
      id: `${Date.now()}`,
      title: "Untitled",
      content: "",
      folderId: null,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    if (isMobile) {
      setMobileView("editor");
    }
  }, [isMobile]);

  const handleTitleChange = useCallback((title: string) => {
    if (!selectedNoteId) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNoteId ? { ...n, title, updatedAt: new Date() } : n
      )
    );
    setSyncStatus("syncing");
    setTimeout(() => setSyncStatus("synced"), 1000);
  }, [selectedNoteId]);

  const handleContentChange = useCallback((content: string) => {
    if (!selectedNoteId) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNoteId ? { ...n, content, updatedAt: new Date() } : n
      )
    );
    setSyncStatus("syncing");
    setTimeout(() => setSyncStatus("synced"), 1000);
  }, [selectedNoteId]);

  const handleTogglePin = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, isPinned: !n.isPinned } : n
      )
    );
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
  }, [selectedNoteId]);

  // Mobile view
  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh bg-background">
        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          notes={notes}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
        />

        {mobileView === "list" ? (
          <MobileNotesSheet
            notes={notes}
            folders={sampleFolders}
            selectedNoteId={selectedNoteId}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
            onTogglePin={handleTogglePin}
            onDeleteNote={handleDeleteNote}
          />
        ) : (
          <div className="flex flex-col h-full">
            <MobileEditorHeader
              note={selectedNote}
              syncStatus={syncStatus}
              onBack={() => setMobileView("list")}
              onToggleMetadata={() => setIsMetadataPanelOpen(true)}
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
            note={selectedNote}
            isOpen={isMetadataPanelOpen}
            onClose={() => setIsMetadataPanelOpen(false)}
          />
        )}
      </div>
    );
  }

  // Desktop view
  return (
    <SidebarProvider>
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        notes={notes}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
      />

      <NotesSidebar
        notes={notes}
        folders={sampleFolders}
        selectedNoteId={selectedNoteId}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onTogglePin={handleTogglePin}
        onDeleteNote={handleDeleteNote}
      />

      <SidebarInset className="flex flex-col h-dvh">
        <EditorToolbar
          syncStatus={syncStatus}
          onToggleMetadata={() => setIsMetadataPanelOpen(!isMetadataPanelOpen)}
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
              note={selectedNote}
              isOpen={isMetadataPanelOpen}
              onClose={() => setIsMetadataPanelOpen(false)}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
