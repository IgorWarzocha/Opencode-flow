import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  className,
  icon,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("border-b border-border/50 last:border-0", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 px-2 text-xs font-medium hover:bg-accent/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span>{title}</span>
        </div>
        <ChevronDown
          className={cn("h-3 w-3 text-muted-foreground transition-transform duration-200", {
            "transform rotate-180": isOpen,
          })}
        />
      </button>
      {isOpen && (
        <div className="pb-2 animate-in slide-in-from-top-1 fade-in duration-200">{children}</div>
      )}
    </div>
  );
}
