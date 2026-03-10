import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EditorContainerProps {
  children?: ReactNode;
  className?: string;
}

/**
 * EditorContainer provides the main writing surface with proper max-width,
 * centered content, and comfortable reading/writing margins.
 */
export function EditorContainer({ children, className }: EditorContainerProps) {
  return (
    <main 
      className={cn(
        "flex-1 flex flex-col min-h-0 bg-background overflow-hidden",
        className
      )}
    >
      <div className="flex-1 overflow-y-auto">
        <article className="max-w-2xl mx-auto px-6 py-10 md:px-12 md:py-16">
          {children}
        </article>
      </div>
    </main>
  );
}

/**
 * EditorTitleInput - The main title editing area
 */
interface EditorTitleInputProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function EditorTitleInput({ 
  value, 
  onChange, 
  placeholder = "Untitled",
  readOnly = false 
}: EditorTitleInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(
        "w-full text-display text-foreground bg-transparent",
        "border-none outline-none resize-none",
        "placeholder:text-muted-foreground/50",
        "focus:outline-none",
        "mb-6"
      )}
      aria-label="Note title"
    />
  );
}

/**
 * EditorBody - The main content editing area
 */
interface EditorBodyProps {
  children?: ReactNode;
}

export function EditorBody({ children }: EditorBodyProps) {
  return (
    <div className="text-body text-foreground leading-relaxed">
      {children}
    </div>
  );
}

export default EditorContainer;
