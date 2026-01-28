import * as React from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsAccordionItemProps {
  value: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsAccordionItem({
  value,
  icon: Icon,
  title,
  description,
  children,
  className,
}: SettingsAccordionItemProps) {
  return (
    <AccordionItem
      value={value}
      className={cn(
        "border rounded-lg bg-card overflow-hidden data-[state=open]:ring-1 data-[state=open]:ring-border",
        className
      )}
    >
      <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors [&[data-state=open]]:bg-muted/30">
        <div className="flex items-center gap-3 text-left">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
