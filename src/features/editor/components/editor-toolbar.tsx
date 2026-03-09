import { ChevronLeft, ChevronRight, PanelLeft, PanelRight, MoreHorizontal, Cloud, CloudOff, Edit3, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  noteTitle?: string;
  folderPath?: string;
  isSaved?: boolean;
  isSaving?: boolean;
  editorMode?: "edit" | "preview";
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
  isSidebarOpen?: boolean;
  isMetadataPanelOpen?: boolean;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onToggleSidebar?: () => void;
  onToggleMetadataPanel?: () => void;
  onToggleEditorMode?: () => void;
  onOpenMore?: () => void;
}

export function EditorToolbar({
  noteTitle = "Untitled",
  folderPath = "Notes",
  isSaved = true,
  isSaving = false,
  editorMode = "edit",
  canNavigatePrev = false,
  canNavigateNext = false,
  isSidebarOpen = true,
  isMetadataPanelOpen = false,
  onNavigatePrev,
  onNavigateNext,
  onToggleSidebar,
  onToggleMetadataPanel,
  onToggleEditorMode,
  onOpenMore,
}: EditorToolbarProps) {
  return (
    <header className="flex items-center justify-between h-12 px-3 border-b border-border bg-surface-elevated/50 backdrop-blur-sm">
      {/* Left section: Navigation & Sidebar toggle */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<PanelLeft className="w-4 h-4" />}
          tooltip={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          shortcut="⌘\\"
          isActive={isSidebarOpen}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        />
        
        <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />
        
        <div className="flex items-center">
          <ToolbarButton
            icon={<ChevronLeft className="w-4 h-4" />}
            tooltip="Previous note"
            shortcut="⌘["
            onClick={onNavigatePrev}
            disabled={!canNavigatePrev}
            aria-label="Go to previous note"
          />
          <ToolbarButton
            icon={<ChevronRight className="w-4 h-4" />}
            tooltip="Next note"
            shortcut="⌘]"
            onClick={onNavigateNext}
            disabled={!canNavigateNext}
            aria-label="Go to next note"
          />
        </div>
      </div>

      {/* Center section: Note identity */}
      <div className="flex-1 flex items-center justify-center min-w-0 px-4">
        <div className="flex flex-col items-center min-w-0">
          {/* Breadcrumb */}
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {folderPath}
          </span>
          {/* Title with save state */}
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-foreground truncate max-w-[300px]">
              {noteTitle}
            </h1>
            <SaveStateIndicator isSaved={isSaved} isSaving={isSaving} />
          </div>
        </div>
      </div>

      {/* Right section: Mode toggle & Metadata panel */}
      <div className="flex items-center gap-1">
        <EditorModeToggle 
          mode={editorMode} 
          onToggle={onToggleEditorMode} 
        />
        
        <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />
        
        <ToolbarButton
          icon={<MoreHorizontal className="w-4 h-4" />}
          tooltip="More actions"
          shortcut="⌘."
          onClick={onOpenMore}
          aria-label="More actions"
        />
        
        <ToolbarButton
          icon={<PanelRight className="w-4 h-4" />}
          tooltip={isMetadataPanelOpen ? "Hide metadata" : "Show metadata"}
          shortcut="⌘I"
          isActive={isMetadataPanelOpen}
          onClick={onToggleMetadataPanel}
          aria-label="Toggle metadata panel"
        />
      </div>
    </header>
  );
}

// --- Sub-components ---

interface ToolbarButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  shortcut?: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}

function ToolbarButton({
  icon,
  tooltip,
  shortcut,
  isActive = false,
  disabled = false,
  onClick,
  "aria-label": ariaLabel,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-8 h-8 rounded-md transition-all duration-fast",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-secondary active:bg-secondary/80",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:opacity-40 disabled:pointer-events-none",
            isActive && "bg-secondary text-foreground"
          )}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        <span>{tooltip}</span>
        {shortcut && <kbd className="kbd">{shortcut}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

interface SaveStateIndicatorProps {
  isSaved: boolean;
  isSaving: boolean;
}

function SaveStateIndicator({ isSaved, isSaving }: SaveStateIndicatorProps) {
  if (isSaving) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-muted-foreground animate-pulse-subtle">
            <Cloud className="w-3 h-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>Saving...</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (!isSaved) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-accent">
            <CloudOff className="w-3 h-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>Unsaved changes</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return null; // Saved state is the default, no indicator needed
}

interface EditorModeToggleProps {
  mode: "edit" | "preview";
  onToggle?: () => void;
}

function EditorModeToggle({ mode, onToggle }: EditorModeToggleProps) {
  return (
    <div className="flex items-center p-0.5 bg-surface-sunken rounded-md">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "flex items-center justify-center w-7 h-6 rounded transition-all duration-fast",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              mode === "edit"
                ? "bg-surface-elevated text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={mode === "preview" ? onToggle : undefined}
            aria-label="Edit mode"
            aria-pressed={mode === "edit"}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>Edit mode</span>
          <kbd className="kbd ml-2">⌘E</kbd>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "flex items-center justify-center w-7 h-6 rounded transition-all duration-fast",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              mode === "preview"
                ? "bg-surface-elevated text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={mode === "edit" ? onToggle : undefined}
            aria-label="Preview mode"
            aria-pressed={mode === "preview"}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>Preview mode</span>
          <kbd className="kbd ml-2">⌘P</kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export default EditorToolbar;
