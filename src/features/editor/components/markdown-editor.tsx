import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MarkdownEditorProps {
  initialContent?: string;
  placeholder?: string;
  className?: string;
  onChange?: (content: string) => void;
  /** If true, always show rendered preview without editing */
  previewOnly?: boolean;
}

type FormatAction = {
  wrap: [string, string];
  label: string;
};

const FORMAT_ACTIONS: Record<string, FormatAction> = {
  b: { wrap: ["**", "**"], label: "Bold" },
  i: { wrap: ["*", "*"], label: "Italic" },
  e: { wrap: ["`", "`"], label: "Code" },
  d: { wrap: ["~~", "~~"], label: "Strikethrough" },
  k: { wrap: ["[", "](url)"], label: "Link" },
};

/**
 * Inline markdown editor with keyboard shortcuts for formatting.
 * Ctrl/⌘+B (bold), Ctrl/⌘+I (italic), Ctrl/⌘+E (code),
 * Ctrl/⌘+D (strikethrough), Ctrl/⌘+K (link)
 */
export function MarkdownEditor({
  initialContent = "",
  placeholder = "Start writing with markdown…",
  className,
  onChange,
  previewOnly = false,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [content]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  // Apply markdown formatting around selection
  const applyFormat = useCallback((action: FormatAction) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const [before, after] = action.wrap;

    // Check if already wrapped — toggle off
    const preBefore = content.slice(Math.max(0, start - before.length), start);
    const postAfter = content.slice(end, end + after.length);
    if (preBefore === before && postAfter === after) {
      const newContent =
        content.slice(0, start - before.length) + selected + content.slice(end + after.length);
      setContent(newContent);
      requestAnimationFrame(() => {
        el.selectionStart = start - before.length;
        el.selectionEnd = end - before.length;
        el.focus();
      });
      return;
    }

    const replacement = `${before}${selected || "text"}${after}`;
    const newContent = content.slice(0, start) + replacement + content.slice(end);
    setContent(newContent);

    requestAnimationFrame(() => {
      if (selected) {
        el.selectionStart = start + before.length;
        el.selectionEnd = start + before.length + selected.length;
      } else {
        // Select placeholder "text"
        el.selectionStart = start + before.length;
        el.selectionEnd = start + before.length + 4;
      }
      el.focus();
    });

    toast.success(`${action.label} applied`, { duration: 1000 });
  }, [content]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    const key = e.key.toLowerCase();
    const action = FORMAT_ACTIONS[key];
    if (action) {
      e.preventDefault();
      applyFormat(action);
    }
  }, [applyFormat]);

  // Parse inline markdown to React elements
  const renderInlineMarkdown = (text: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    const patterns: Array<{
      regex: RegExp;
      render: (match: RegExpMatchArray) => React.ReactNode;
    }> = [
      {
        regex: /\*\*\*(.*?)\*\*\*/,
        render: (m) => (
          <strong key={key++} className="font-semibold italic text-foreground">{m[1]}</strong>
        ),
      },
      {
        regex: /\*\*(.*?)\*\*/,
        render: (m) => (
          <strong key={key++} className="font-semibold text-foreground">{m[1]}</strong>
        ),
      },
      {
        regex: /\*(.*?)\*/,
        render: (m) => (
          <em key={key++} className="italic text-foreground">{m[1]}</em>
        ),
      },
      {
        regex: /`(.*?)`/,
        render: (m) => (
          <code key={key++} className="px-1.5 py-0.5 rounded text-sm font-mono bg-surface-sunken text-accent-foreground">
            {m[1]}
          </code>
        ),
      },
      {
        regex: /~~(.*?)~~/,
        render: (m) => (
          <s key={key++} className="line-through text-muted-foreground">{m[1]}</s>
        ),
      },
      {
        regex: /\[([^\]]+)\]\(([^)]+)\)/,
        render: (m) => (
          <a key={key++} href={m[2]} className="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noopener noreferrer">
            {m[1]}
          </a>
        ),
      },
    ];

    while (remaining.length > 0) {
      let earliestMatch: { index: number; match: RegExpMatchArray; pattern: (typeof patterns)[0] } | null = null;

      for (const pattern of patterns) {
        const match = remaining.match(pattern.regex);
        if (match && match.index !== undefined) {
          if (!earliestMatch || match.index < earliestMatch.index) {
            earliestMatch = { index: match.index, match, pattern };
          }
        }
      }

      if (earliestMatch) {
        if (earliestMatch.index > 0) {
          tokens.push(<span key={key++}>{remaining.slice(0, earliestMatch.index)}</span>);
        }
        tokens.push(earliestMatch.pattern.render(earliestMatch.match));
        remaining = remaining.slice(earliestMatch.index + earliestMatch.match[0].length);
      } else {
        tokens.push(<span key={key++}>{remaining}</span>);
        break;
      }
    }

    return tokens;
  };

  const renderLine = (line: string, index: number): React.ReactNode => {
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      return <hr key={index} className="my-4 border-border" />;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const styles: Record<number, string> = {
        1: "text-2xl font-semibold mt-6 mb-3",
        2: "text-xl font-semibold mt-5 mb-2",
        3: "text-lg font-medium mt-4 mb-2",
        4: "text-base font-medium mt-3 mb-1",
        5: "text-sm font-medium mt-2 mb-1",
        6: "text-sm font-medium mt-2 mb-1 text-muted-foreground",
      };
      return (
        <div key={index} className={cn(styles[level], "text-foreground")}>
          <span className="text-muted-foreground/40 font-mono text-xs mr-2 select-none">{headingMatch[1]}</span>
          {renderInlineMarkdown(text)}
        </div>
      );
    }

    if (line.startsWith("> ")) {
      return (
        <div key={index} className="pl-4 border-l-2 border-primary/30 text-muted-foreground italic my-1">
          {renderInlineMarkdown(line.slice(2))}
        </div>
      );
    }

    const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)/);
    if (ulMatch) {
      const indent = Math.floor(ulMatch[1].length / 2);
      return (
        <div key={index} className="flex items-start gap-2 my-0.5" style={{ paddingLeft: indent * 20 }}>
          <span className="text-muted-foreground/50 select-none mt-0.5">•</span>
          <span>{renderInlineMarkdown(ulMatch[3])}</span>
        </div>
      );
    }

    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (olMatch) {
      const indent = Math.floor(olMatch[1].length / 2);
      return (
        <div key={index} className="flex items-start gap-2 my-0.5" style={{ paddingLeft: indent * 20 }}>
          <span className="text-muted-foreground/50 select-none mt-0.5 font-mono text-sm min-w-[1.2em] text-right">{olMatch[2]}.</span>
          <span>{renderInlineMarkdown(olMatch[3])}</span>
        </div>
      );
    }

    const checkMatch = line.match(/^(\s*)- \[([ xX])\]\s+(.*)/);
    if (checkMatch) {
      const checked = checkMatch[2] !== " ";
      return (
        <div key={index} className="flex items-start gap-2 my-0.5">
          <span className={cn("select-none mt-0.5", checked ? "text-primary" : "text-muted-foreground/50")}>
            {checked ? "☑" : "☐"}
          </span>
          <span className={cn(checked && "line-through text-muted-foreground")}>
            {renderInlineMarkdown(checkMatch[3])}
          </span>
        </div>
      );
    }

    if (line.trim() === "") {
      return <div key={index} className="h-4" />;
    }

    return (
      <div key={index} className="my-0.5 leading-relaxed">
        {renderInlineMarkdown(line)}
      </div>
    );
  };

  const lines = content.split("\n");
  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);
  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <div className={cn("relative w-full", className)}>
      {/* Rendered preview (visible when not focused) */}
      {!isFocused && content.length > 0 && (
        <div
          className="text-body text-foreground cursor-text min-h-[200px]"
          onClick={() => {
            setIsFocused(true);
            setTimeout(() => textareaRef.current?.focus(), 0);
          }}
        >
          {lines.map((line, i) => renderLine(line, i))}
        </div>
      )}

      {/* Textarea (visible when focused or empty) */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          "w-full resize-none bg-transparent text-body text-foreground",
          "border-none outline-none leading-relaxed font-mono",
          "placeholder:text-muted-foreground/40",
          (!isFocused && content.length > 0) && "absolute inset-0 opacity-0 pointer-events-none"
        )}
        style={{ minHeight: "200px" }}
        aria-label="Markdown editor"
      />

      {/* Format hints with shortcuts */}
      {isFocused && (
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
          {[
            { label: "Bold", syntax: "**text**", shortcut: `${modKey}+B` },
            { label: "Italic", syntax: "*text*", shortcut: `${modKey}+I` },
            { label: "Code", syntax: "`code`", shortcut: `${modKey}+E` },
            { label: "Strike", syntax: "~~text~~", shortcut: `${modKey}+D` },
            { label: "Link", syntax: "[text](url)", shortcut: `${modKey}+K` },
            { label: "Heading", syntax: "# ..." },
            { label: "List", syntax: "- item" },
            { label: "Quote", syntax: "> text" },
          ].map((hint) => (
            <span key={hint.label} className="text-micro text-muted-foreground/60 flex items-center gap-1">
              <span className="font-mono text-muted-foreground/40">{hint.syntax}</span>
              {hint.shortcut && (
                <kbd className="text-[10px] px-1 py-0.5 rounded bg-surface-sunken border border-border text-muted-foreground/50">
                  {hint.shortcut}
                </kbd>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
