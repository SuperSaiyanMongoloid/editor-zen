import { FileText, Plus, Search, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyEditorStateProps {
  onCreateNote?: () => void;
  onOpenSearch?: () => void;
  onOpenCommandPalette?: () => void;
}

/**
 * EmptyEditorState - Shown when no note is selected
 * Provides calm, helpful guidance without being intrusive
 */
export function EmptyEditorState({
  onCreateNote,
  onOpenSearch,
  onOpenCommandPalette,
}: EmptyEditorStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-sm text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface mb-6">
          <FileText className="w-7 h-7 text-muted-foreground" />
        </div>

        {/* Message */}
        <h2 className="text-title text-foreground mb-2">
          No note selected
        </h2>
        <p className="text-caption mb-8">
          Select a note from the sidebar, or use one of the shortcuts below.
        </p>

        {/* Quick actions */}
        <div className="space-y-2">
          <QuickAction
            icon={<Plus className="w-4 h-4" />}
            label="Create a new note"
            shortcut="⌘N"
            onClick={onCreateNote}
          />
          <QuickAction
            icon={<Search className="w-4 h-4" />}
            label="Search notes"
            shortcut="⌘K"
            onClick={onOpenSearch}
          />
          <QuickAction
            icon={<Command className="w-4 h-4" />}
            label="Open command palette"
            shortcut="⌘P"
            onClick={onOpenCommandPalette}
          />
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  onClick?: () => void;
}

function QuickAction({ icon, label, shortcut, onClick }: QuickActionProps) {
  return (
    <button
      className={cn(
        "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg",
        "bg-surface text-sm text-foreground",
        "transition-all duration-150 ease-out",
        "hover:bg-secondary hover:shadow-sm hover:scale-[1.01] hover:-translate-y-0.5",
        "active:scale-[0.99] active:translate-y-0 active:shadow-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "group"
      )}
      onClick={onClick}
    >
      <span className="flex items-center gap-3">
        <span className={cn(
          "text-muted-foreground transition-all duration-150",
          "group-hover:text-foreground group-hover:scale-110"
        )}>
          {icon}
        </span>
        <span>{label}</span>
      </span>
      <kbd className={cn(
        "kbd transition-all duration-150",
        "group-hover:bg-secondary group-hover:border-border"
      )}>{shortcut}</kbd>
    </button>
  );
}

export default EmptyEditorState;
