"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { NotesSidebar } from "@/features/notes/components/notes-sidebar";
import { EditorPane, EditorPaneConfig } from "@/features/editor/components/editor-pane";
import { EditorToolbar } from "@/features/editor/components/editor-toolbar";
import { CommandPalette } from "@/features/command-palette/components/command-palette";
import { MobileNotesSheet } from "@/features/notes/components/mobile-notes-sheet";
import { MobileEditorHeader } from "@/features/editor/components/mobile-editor-header";
import { MetadataPanel } from "@/features/notes/components/metadata-panel";
import { useIsMobile } from "@/hooks/use-mobile";

// Sample note for the editor
const sampleNote: EditorPaneConfig = {
  id: "3",
  title: "Reflections on Q1 progress",
  content: `The first quarter has been an interesting journey of growth and learning. Here are some key observations:

## What went well

- **Deep work sessions**: Managed to protect 2-3 hour blocks for focused writing
- **Consistent publishing**: Hit my goal of one essay per week
- **Reading habit**: Finished 8 books, mostly non-fiction

## Areas for improvement

1. Better rest and recovery between intense work periods
2. More time for serendipitous exploration
3. Saying no to more opportunities

## Looking ahead

The second quarter will be about **consolidation** rather than expansion. I want to go deeper on fewer things rather than spreading myself thin.

> "The wisdom of life consists in the elimination of non-essentials." — Lin Yutang
`,
};

export default function Page() {
  const isMobile = useIsMobile();
  const [selectedNoteId, setSelectedNoteId] = useState("3");
  const [currentNote, setCurrentNote] = useState(sampleNote);
  const [isMetadataPanelOpen, setMetadataPanelOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced");
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId);
    if (isMobile) {
      setMobileView("editor");
    }
  };

  const handleTitleChange = (id: string, title: string) => {
    setCurrentNote((prev) => ({ ...prev, title }));
  };

  const handleContentChange = (id: string, content: string) => {
    setCurrentNote((prev) => ({ ...prev, content }));
  };

  const handleBackToList = () => {
    setMobileView("list");
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-dvh flex flex-col bg-background">
        <CommandPalette />
        
        {mobileView === "list" ? (
          <MobileNotesSheet
            selectedNoteId={selectedNoteId}
            onNoteSelect={handleNoteSelect}
          />
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <MobileEditorHeader
              title={currentNote.title}
              syncStatus={syncStatus}
              onBack={handleBackToList}
              onToggleMetadata={() => setMetadataPanelOpen(!isMetadataPanelOpen)}
            />
            <div className="flex-1 min-h-0">
              <EditorPane
                config={currentNote}
                onTitleChange={handleTitleChange}
                onContentChange={handleContentChange}
              />
            </div>
          </div>
        )}

        <MetadataPanel
          isOpen={isMetadataPanelOpen}
          onClose={() => setMetadataPanelOpen(false)}
          note={{
            title: currentNote.title,
            createdAt: "March 1, 2024",
            modifiedAt: "Just now",
            wordCount: currentNote.content.split(/\s+/).length,
            charCount: currentNote.content.length,
            folder: "Personal / Journal",
            tags: ["reflection", "quarterly-review"],
          }}
        />
      </div>
    );
  }

  // Desktop layout
  return (
    <SidebarProvider defaultOpen={!isSidebarCollapsed}>
      <div className="h-dvh flex w-full bg-background">
        <CommandPalette />
        
        <NotesSidebar
          selectedNoteId={selectedNoteId}
          onNoteSelect={handleNoteSelect}
          isCollapsed={isSidebarCollapsed}
        />

        <SidebarInset className="flex flex-col min-w-0 flex-1">
          <EditorToolbar
            syncStatus={syncStatus}
            isSidebarCollapsed={isSidebarCollapsed}
            isMetadataPanelOpen={isMetadataPanelOpen}
            onToggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
            onToggleMetadataPanel={() => setMetadataPanelOpen(!isMetadataPanelOpen)}
            editorMode={editorMode}
            onEditorModeChange={setEditorMode}
          />

          <div className="flex-1 flex min-h-0">
            <EditorPane
              config={{ ...currentNote, previewOnly: editorMode === "preview" }}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              className="flex-1"
            />

            <MetadataPanel
              isOpen={isMetadataPanelOpen}
              onClose={() => setMetadataPanelOpen(false)}
              note={{
                title: currentNote.title,
                createdAt: "March 1, 2024",
                modifiedAt: "Just now",
                wordCount: currentNote.content.split(/\s+/).length,
                charCount: currentNote.content.length,
                folder: "Personal / Journal",
                tags: ["reflection", "quarterly-review"],
              }}
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
