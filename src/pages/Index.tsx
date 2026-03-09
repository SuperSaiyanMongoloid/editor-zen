import { useState, useEffect } from "react";
import { EditorToolbar } from "@/features/editor/components/editor-toolbar";
import { EditorContainer, EditorTitleInput, EditorBody } from "@/features/editor/components/editor-container";
import { MetadataPanel } from "@/features/notes/components/metadata-panel";
import { MobileEditorHeader } from "@/features/editor/components/mobile-editor-header";
import { EmptyEditorState } from "@/features/editor/components/empty-editor-state";
import { NotesSidebar } from "@/features/notes/components/notes-sidebar";
import { MobileNotesSheet } from "@/features/notes/components/mobile-notes-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun } from "lucide-react";

const Index = () => {
  const [hasNote, setHasNote] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMetadataPanelOpen, setIsMetadataPanelOpen] = useState(true);
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");
  const [title, setTitle] = useState("Reflections on Q1 progress and adjustments");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState("3");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const simulateSave = () => {
    setIsSaved(false);
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
    }, 1500);
  };

  const toggleSidebar = () => {
    if (isSidebarOpen && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
    } else if (isSidebarCollapsed) {
      setIsSidebarOpen(false);
      setIsSidebarCollapsed(false);
    } else {
      setIsSidebarOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="desktop" className="w-full">
        {/* View Switcher */}
        <div className="sticky top-0 z-50 flex items-center justify-center gap-4 py-4 px-6 bg-surface border-b border-border">
          <span className="text-micro">View:</span>
          <TabsList className="h-9">
            <TabsTrigger value="desktop" className="text-sm px-4">Desktop</TabsTrigger>
            <TabsTrigger value="desktop-panel" className="text-sm px-4">Desktop + Panel</TabsTrigger>
            <TabsTrigger value="sidebar-collapsed" className="text-sm px-4">Collapsed Sidebar</TabsTrigger>
            <TabsTrigger value="mobile" className="text-sm px-4">Mobile</TabsTrigger>
            <TabsTrigger value="empty" className="text-sm px-4">Empty State</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 ml-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded bg-surface-sunken border border-border transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {isDark ? "Light" : "Dark"}
            </button>
            <button 
              onClick={simulateSave}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded bg-surface-sunken border border-border transition-colors"
            >
              Simulate save
            </button>
          </div>
        </div>

        {/* Desktop Default */}
        <TabsContent value="desktop" className="mt-0">
          <div className="flex h-[calc(100vh-65px)]">
            {/* Full Sidebar */}
            <NotesSidebar 
              selectedNoteId={selectedNoteId}
              onNoteSelect={setSelectedNoteId}
              onCreateNote={() => console.log("Create note")}
              onSearch={(q) => console.log("Search:", q)}
            />

            {/* Main editor area */}
            <div className="flex-1 flex flex-col">
              <EditorToolbar
                noteTitle={title}
                folderPath="Personal / Journal"
                isSaved={isSaved}
                isSaving={isSaving}
                editorMode={editorMode}
                isSidebarOpen={isSidebarOpen}
                isMetadataPanelOpen={false}
                canNavigatePrev={true}
                canNavigateNext={true}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onToggleMetadataPanel={() => setIsMetadataPanelOpen(!isMetadataPanelOpen)}
                onToggleEditorMode={() => setEditorMode(editorMode === "edit" ? "preview" : "edit")}
              />
              
              <EditorContainer>
                <EditorTitleInput 
                  value={title} 
                  onChange={setTitle}
                />
                <EditorBody>
                  <p className="mb-4">
                    The first quarter has been a period of significant learning. Looking back at my original goals, 
                    I can see both where I've made progress and where adjustments are needed.
                  </p>
                  <p className="mb-4">
                    <strong>Key observations:</strong>
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Morning routines have been consistently maintained</li>
                    <li>Deep work sessions averaging 3.5 hours per day</li>
                    <li>Reading goal is slightly behind schedule</li>
                    <li>Exercise consistency improved significantly</li>
                  </ul>
                  <p className="mb-4">
                    The shift to time-blocking has been particularly effective. I'm finding that 
                    protecting the first two hours of the day for creative work has compounded benefits 
                    that extend throughout the rest of the day.
                  </p>
                  <p>
                    For Q2, I want to focus on reducing context-switching and being more intentional 
                    about saying no to commitments that don't align with my core priorities.
                  </p>
                </EditorBody>
              </EditorContainer>
            </div>
          </div>
        </TabsContent>

        {/* Desktop with Metadata Panel */}
        <TabsContent value="desktop-panel" className="mt-0">
          <div className="flex h-[calc(100vh-65px)]">
            {/* Full Sidebar */}
            <NotesSidebar 
              selectedNoteId={selectedNoteId}
              onNoteSelect={setSelectedNoteId}
              onCreateNote={() => console.log("Create note")}
              onSearch={(q) => console.log("Search:", q)}
            />

            {/* Main editor area */}
            <div className="flex-1 flex flex-col">
              <EditorToolbar
                noteTitle={title}
                folderPath="Personal / Journal"
                isSaved={isSaved}
                isSaving={isSaving}
                editorMode={editorMode}
                isSidebarOpen={isSidebarOpen}
                isMetadataPanelOpen={true}
                canNavigatePrev={true}
                canNavigateNext={true}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onToggleMetadataPanel={() => setIsMetadataPanelOpen(!isMetadataPanelOpen)}
                onToggleEditorMode={() => setEditorMode(editorMode === "edit" ? "preview" : "edit")}
              />
              
              <div className="flex-1 flex min-h-0">
                <EditorContainer>
                  <EditorTitleInput 
                    value={title} 
                    onChange={setTitle}
                  />
                  <EditorBody>
                    <p className="mb-4">
                      The first quarter has been a period of significant learning. Looking back at my original goals, 
                      I can see both where I've made progress and where adjustments are needed.
                    </p>
                    <p className="mb-4">
                      <strong>Key observations:</strong>
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Morning routines have been consistently maintained</li>
                      <li>Deep work sessions averaging 3.5 hours per day</li>
                      <li>Reading goal is slightly behind schedule</li>
                      <li>Exercise consistency improved significantly</li>
                    </ul>
                    <p>
                      The shift to time-blocking has been particularly effective.
                    </p>
                  </EditorBody>
                </EditorContainer>

                <MetadataPanel
                  isOpen={true}
                  onClose={() => setIsMetadataPanelOpen(false)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Collapsed Sidebar */}
        <TabsContent value="sidebar-collapsed" className="mt-0">
          <div className="flex h-[calc(100vh-65px)]">
            {/* Collapsed Sidebar */}
            <NotesSidebar 
              selectedNoteId={selectedNoteId}
              onNoteSelect={setSelectedNoteId}
              onCreateNote={() => console.log("Create note")}
              isCollapsed={true}
            />

            {/* Main editor area */}
            <div className="flex-1 flex flex-col">
              <EditorToolbar
                noteTitle={title}
                folderPath="Personal / Journal"
                isSaved={isSaved}
                isSaving={isSaving}
                editorMode={editorMode}
                isSidebarOpen={false}
                isMetadataPanelOpen={false}
                canNavigatePrev={true}
                canNavigateNext={true}
                onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onToggleMetadataPanel={() => setIsMetadataPanelOpen(!isMetadataPanelOpen)}
                onToggleEditorMode={() => setEditorMode(editorMode === "edit" ? "preview" : "edit")}
              />
              
              <EditorContainer>
                <EditorTitleInput 
                  value={title} 
                  onChange={setTitle}
                />
                <EditorBody>
                  <p className="mb-4">
                    The first quarter has been a period of significant learning. Looking back at my original goals, 
                    I can see both where I've made progress and where adjustments are needed.
                  </p>
                  <p className="mb-4">
                    <strong>Key observations:</strong>
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Morning routines have been consistently maintained</li>
                    <li>Deep work sessions averaging 3.5 hours per day</li>
                    <li>Reading goal is slightly behind schedule</li>
                    <li>Exercise consistency improved significantly</li>
                  </ul>
                  <p className="mb-4">
                    The shift to time-blocking has been particularly effective. I'm finding that 
                    protecting the first two hours of the day for creative work has compounded benefits 
                    that extend throughout the rest of the day.
                  </p>
                  <p>
                    For Q2, I want to focus on reducing context-switching and being more intentional 
                    about saying no to commitments that don't align with my core priorities.
                  </p>
                </EditorBody>
              </EditorContainer>
            </div>
          </div>
        </TabsContent>

        {/* Mobile */}
        <TabsContent value="mobile" className="mt-0">
          <div className="max-w-[390px] mx-auto border-x border-border h-[calc(100vh-65px)] flex flex-col bg-background">
            <MobileEditorHeader
              noteTitle={title}
              isSaved={isSaved}
              isSaving={isSaving}
              onBack={() => console.log("Back")}
              onOpenMetadata={() => console.log("Open metadata")}
              onOpenMore={() => console.log("Open more")}
            />
            
            <EditorContainer>
              <EditorTitleInput 
                value={title} 
                onChange={setTitle}
              />
              <EditorBody>
                <p className="mb-4">
                  The first quarter has been a period of significant learning. Looking back at my original goals, 
                  I can see both where I've made progress and where adjustments are needed.
                </p>
                <p className="mb-4">
                  <strong>Key observations:</strong>
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Morning routines have been consistently maintained</li>
                  <li>Deep work sessions averaging 3.5 hours per day</li>
                </ul>
              </EditorBody>
            </EditorContainer>
          </div>
        </TabsContent>

        {/* Empty State */}
        <TabsContent value="empty" className="mt-0">
          <div className="flex h-[calc(100vh-65px)]">
            {/* Sidebar with no notes */}
            <NotesSidebar 
              folders={[]}
              selectedNoteId={undefined}
              onCreateNote={() => console.log("Create note")}
              onSearch={(q) => console.log("Search:", q)}
            />

            {/* Empty state */}
            <div className="flex-1 flex flex-col">
              <EditorToolbar
                noteTitle=""
                folderPath=""
                isSaved={true}
                editorMode="edit"
                isSidebarOpen={true}
                isMetadataPanelOpen={false}
                canNavigatePrev={false}
                canNavigateNext={false}
              />
              
              <EmptyEditorState
                onCreateNote={() => console.log("Create note")}
                onOpenSearch={() => console.log("Open search")}
                onOpenCommandPalette={() => console.log("Open command palette")}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
