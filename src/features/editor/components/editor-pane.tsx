import { useState } from "react";
import { cn } from "@/lib/utils";
import { MarkdownEditor } from "./markdown-editor";
import { EditorContainer, EditorTitleInput } from "./editor-container";

export interface EditorPaneConfig {
  id: string;
  title: string;
  content: string;
  /** If true, pane is read-only preview */
  previewOnly?: boolean;
}

interface EditorPaneProps {
  config: EditorPaneConfig;
  onTitleChange?: (id: string, title: string) => void;
  onContentChange?: (id: string, content: string) => void;
  className?: string;
  /** Visual label shown at top of pane */
  label?: string;
}

/**
 * A self-contained editor pane with its own title, content, and scroll position.
 * Designed to be composed inside SplitEditorView for side-by-side editing.
 */
export function EditorPane({
  config,
  onTitleChange,
  onContentChange,
  className,
  label,
}: EditorPaneProps) {
  const [title, setTitle] = useState(config.title);
  const [content, setContent] = useState(config.content);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    onTitleChange?.(config.id, val);
  };

  return (
    <div className={cn("flex flex-col h-full min-w-0", className)}>
      {label && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border bg-surface-sunken shrink-0">
          <span className="text-micro">{label}</span>
        </div>
      )}
      <EditorContainer className="flex-1 min-h-0">
        <EditorTitleInput
          value={title}
          onChange={config.previewOnly ? undefined : handleTitleChange}
          readOnly={config.previewOnly}
        />
        <MarkdownEditor
          initialContent={content}
          onChange={(val) => {
            setContent(val);
            onContentChange?.(config.id, val);
          }}
          previewOnly={config.previewOnly}
        />
      </EditorContainer>
    </div>
  );
}
