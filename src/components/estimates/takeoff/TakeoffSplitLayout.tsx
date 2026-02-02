import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';

interface TakeoffSplitLayoutProps {
  children: React.ReactNode;
  panelContent: React.ReactNode | null;
  panelTitle?: string;
  onPanelClose?: () => void;
}

export function TakeoffSplitLayout({
  children,
  panelContent,
  panelTitle,
  onPanelClose,
}: TakeoffSplitLayoutProps) {
  const isMobile = useIsMobile();
  const hasPanel = !!panelContent;

  // On mobile, don't use split layout - the dialogs will render as modals
  if (isMobile || !hasPanel) {
    return <>{children}</>;
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Plan viewer panel */}
      <ResizablePanel defaultSize={65} minSize={40}>
        {children}
      </ResizablePanel>

      {/* Resize handle */}
      <ResizableHandle withHandle className="bg-border/50 hover:bg-border transition-colors" />

      {/* Dimension panel */}
      <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
        <div className="h-full flex flex-col bg-background border-l">
          {/* Panel header */}
          {panelTitle && (
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <h3 className="font-semibold text-sm">{panelTitle}</h3>
              {onPanelClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onPanelClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          
          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {panelContent}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
