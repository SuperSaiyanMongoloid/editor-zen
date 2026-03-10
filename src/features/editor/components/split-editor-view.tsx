import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { EditorPane, type EditorPaneConfig } from "./editor-pane";

export type SplitMode = "edit-preview" | "dual-edit" | "single";

interface SplitEditorViewProps {
  /** Pane configurations. 1 = single, 2 = split. */
  panes: EditorPaneConfig[];
  /** Labels for each pane (e.g. ["Editor", "Preview"]) */
  labels?: string[];
  onTitleChange?: (paneId: string, title: string) => void;
  onContentChange?: (paneId: string, content: string) => void;
  className?: string;
}

/**
 * Extensible split editor view using resizable panels.
 * 
 * Usage patterns:
 * - 1 pane:  single editor (no split)
 * - 2 panes: side-by-side (markdown+preview, two notes, same note dual scroll)
 * - Future:  3+ panes supported by adding more configs
 */
export function SplitEditorView({
  panes,
  labels,
  onTitleChange,
  onContentChange,
  className,
}: SplitEditorViewProps) {
  if (panes.length === 1) {
    return (
      <EditorPane
        config={panes[0]}
        label={labels?.[0]}
        onTitleChange={onTitleChange}
        onContentChange={onContentChange}
        className={className}
      />
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className={className}>
      {panes.map((pane, i) => (
        <PanelSlot key={pane.id} isFirst={i === 0}>
          <EditorPane
            config={pane}
            label={labels?.[i]}
            onTitleChange={onTitleChange}
            onContentChange={onContentChange}
          />
        </PanelSlot>
      ))}
    </ResizablePanelGroup>
  );
}

/** Internal wrapper that adds ResizableHandle between panels */
function PanelSlot({
  children,
  isFirst,
}: {
  children: React.ReactNode;
  isFirst: boolean;
}) {
  return (
    <>
      {!isFirst && <ResizableHandle withHandle />}
      <ResizablePanel minSize={25} defaultSize={50}>
        {children}
      </ResizablePanel>
    </>
  );
}
