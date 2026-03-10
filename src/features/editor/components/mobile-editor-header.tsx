"use client";

import { ChevronLeft, MoreHorizontal, PanelRight, Cloud, CloudOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileEditorHeaderProps {
  noteTitle?: string;
  isSaved?: boolean;
  isSaving?: boolean;
  onBack?: () => void;
  onOpenMetadata?: () => void;
  onOpenMore?: () => void;
}

/**
 * MobileEditorHeader - Compact header for mobile editor view
 * Uses sheet-like navigation patterns
 */
export function MobileEditorHeader({
  noteTitle = "Untitled",
  isSaved = true,
  isSaving = false,
  onBack,
  onOpenMetadata,
  onOpenMore,
}: MobileEditorHeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-2 border-b border-border bg-surface-elevated/80 backdrop-blur-md safe-area-inset-top">
      {/* Left: Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 text-accent hover:text-accent/80 -ml-1"
        onClick={onBack}
        aria-label="Go back to notes list"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Notes</span>
      </Button>

      {/* Center: Title with save state */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-[40%]">
        <h1 className="text-sm font-semibold text-foreground truncate">
          {noteTitle}
        </h1>
        <MobileSaveIndicator isSaved={isSaved} isSaving={isSaving} />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 text-muted-foreground hover:text-foreground"
          onClick={onOpenMore}
          aria-label="More actions"
        >
          <MoreHorizontal className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 text-muted-foreground hover:text-foreground"
          onClick={onOpenMetadata}
          aria-label="Show note details"
        >
          <PanelRight className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}

interface MobileSaveIndicatorProps {
  isSaved: boolean;
  isSaving: boolean;
}

function MobileSaveIndicator({ isSaved, isSaving }: MobileSaveIndicatorProps) {
  if (isSaving) {
    return (
      <span className="flex items-center justify-center w-4 h-4 text-muted-foreground animate-pulse-subtle">
        <Cloud className="w-3.5 h-3.5" />
      </span>
    );
  }

  if (!isSaved) {
    return (
      <span className="flex items-center justify-center w-4 h-4 text-accent">
        <CloudOff className="w-3.5 h-3.5" />
      </span>
    );
  }

  // Show brief checkmark for "just saved" feedback
  return null;
}

export default MobileEditorHeader;
