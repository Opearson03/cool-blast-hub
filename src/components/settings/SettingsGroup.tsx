import * as React from "react";
import { Accordion } from "@/components/ui/accordion";

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {title}
      </h2>
      <Accordion type="multiple" className="space-y-2">
        {children}
      </Accordion>
    </div>
  );
}
