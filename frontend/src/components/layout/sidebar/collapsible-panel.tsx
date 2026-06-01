import { ChevronDown } from "lucide-react";
import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CollapsiblePanelProps } from "@/types/ui";

function CollapsiblePanel({
  title,
  icon,
  actions,
  children,
  defaultOpen = true,
  titleColor = "text-zinc-500 dark:text-zinc-400",
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col border-b border-zinc-100 last:border-b-0 dark:border-zinc-800/60"
    >
      <CollapsibleTrigger asChild>
        <div className="flex h-12 cursor-pointer items-center justify-between bg-zinc-50/20 px-4 transition-colors select-none hover:bg-zinc-50/60 dark:bg-zinc-950/20 dark:hover:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className={`text-xs font-semibold tracking-wider uppercase ${titleColor}`}>
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {actions && (
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                {actions}
              </div>
            )}
            <ChevronDown
              className={`h-4 w-4 text-zinc-400 transition-transform duration-300 dark:text-zinc-500 ${
                isOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent forceMount>
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="p-4 pt-3">{children}</div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { CollapsiblePanel };
