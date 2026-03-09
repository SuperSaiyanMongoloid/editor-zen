import { X, Calendar, Clock, FileText, Hash, List, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface OutlineItem {
  id: string;
  title: string;
  level: number;
}

interface MetadataPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  // Note metadata
  modifiedAt?: string;
  createdAt?: string;
  wordCount?: number;
  characterCount?: number;
  readingTime?: string;
  folder?: string;
  tags?: string[];
  outline?: OutlineItem[];
  onTagClick?: (tag: string) => void;
  onOutlineItemClick?: (id: string) => void;
}

export function MetadataPanel({
  isOpen = true,
  onClose,
  modifiedAt = "Today at 2:34 PM",
  createdAt = "Mar 5, 2024",
  wordCount = 847,
  characterCount = 4521,
  readingTime = "4 min read",
  folder = "Personal / Journal",
  tags = ["reflection", "work", "goals"],
  outline = [
    { id: "1", title: "Introduction", level: 1 },
    { id: "2", title: "Key observations", level: 1 },
    { id: "3", title: "Morning routine", level: 2 },
    { id: "4", title: "Work session", level: 2 },
    { id: "5", title: "Reflections", level: 1 },
    { id: "6", title: "Tomorrow's focus", level: 1 },
  ],
  onTagClick,
  onOutlineItemClick,
}: MetadataPanelProps) {
  if (!isOpen) return null;

  return (
    <aside 
      className={cn(
        "w-72 border-l border-border bg-surface-elevated/50 flex flex-col",
        "animate-slide-in-right"
      )}
      aria-label="Note metadata"
    >
      {/* Header */}
      <header className="flex items-center justify-between h-12 px-4 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">Details</h2>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close metadata panel"
        >
          <X className="w-4 h-4" />
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Stats section */}
          <MetadataSection title="Statistics">
            <div className="grid grid-cols-2 gap-3">
              <StatItem icon={<FileText />} label="Words" value={wordCount.toLocaleString()} />
              <StatItem icon={<Clock />} label="Reading" value={readingTime} />
              <StatItem icon={<Hash />} label="Characters" value={characterCount.toLocaleString()} />
            </div>
          </MetadataSection>

          <Separator />

          {/* Dates section */}
          <MetadataSection title="Dates">
            <div className="space-y-2">
              <DateItem label="Modified" value={modifiedAt} />
              <DateItem label="Created" value={createdAt} />
            </div>
          </MetadataSection>

          <Separator />

          {/* Location section */}
          <MetadataSection title="Location">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <FolderOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{folder}</span>
            </div>
          </MetadataSection>

          <Separator />

          {/* Tags section */}
          <MetadataSection title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={cn(
                    "cursor-pointer transition-colors duration-fast",
                    "hover:bg-accent-muted hover:text-accent-foreground"
                  )}
                  onClick={() => onTagClick?.(tag)}
                >
                  #{tag}
                </Badge>
              ))}
              <button
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs",
                  "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  "transition-colors duration-fast"
                )}
                aria-label="Add tag"
              >
                + Add
              </button>
            </div>
          </MetadataSection>

          <Separator />

          {/* Outline section */}
          <MetadataSection title="Outline">
            <nav className="space-y-0.5" aria-label="Document outline">
              {outline.map((item) => (
                <OutlineItemButton
                  key={item.id}
                  item={item}
                  onClick={() => onOutlineItemClick?.(item.id)}
                />
              ))}
            </nav>
          </MetadataSection>
        </div>
      </ScrollArea>
    </aside>
  );
}

// --- Sub-components ---

interface MetadataSectionProps {
  title: string;
  children: React.ReactNode;
}

function MetadataSection({ title, children }: MetadataSectionProps) {
  return (
    <section>
      <h3 className="text-micro mb-3">{title}</h3>
      {children}
    </section>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 h-4 text-muted-foreground flex-shrink-0">
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="text-foreground font-medium">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

interface DateItemProps {
  label: string;
  value: string;
}

function DateItem({ label, value }: DateItemProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

interface OutlineItemButtonProps {
  item: OutlineItem;
  onClick?: () => void;
}

function OutlineItemButton({ item, onClick }: OutlineItemButtonProps) {
  return (
    <button
      className={cn(
        "w-full text-left text-sm py-1.5 px-2 rounded transition-colors duration-fast",
        "text-muted-foreground hover:text-foreground hover:bg-secondary",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      )}
      style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
      onClick={onClick}
    >
      <span className="flex items-center gap-2">
        <List className="w-3 h-3 flex-shrink-0 opacity-50" />
        <span className="truncate">{item.title}</span>
      </span>
    </button>
  );
}

export default MetadataPanel;
