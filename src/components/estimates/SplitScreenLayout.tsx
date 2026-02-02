import React, { useState, useEffect } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Map, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { PlanPreviewPanel } from './takeoff/PlanPreviewPanel';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'estimate-split-screen-sizes';
const PLAN_COLLAPSED_KEY = 'estimate-plan-panel-collapsed';

interface SplitScreenLayoutProps {
  estimateId: string | null;
  businessId: string | null;
  activeScope?: string | null;
  children: React.ReactNode;
}

export function SplitScreenLayout({
  estimateId,
  businessId,
  activeScope,
  children,
}: SplitScreenLayoutProps) {
  const isMobile = useIsMobile();
  const [isPlanCollapsed, setIsPlanCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(PLAN_COLLAPSED_KEY);
    return stored === 'true';
  });
  const [defaultSizes, setDefaultSizes] = useState<number[]>([50, 50]);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Load saved sizes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const sizes = JSON.parse(stored);
        if (Array.isArray(sizes) && sizes.length === 2) {
          setDefaultSizes(sizes);
        }
      } catch (e) {
        // Ignore invalid stored value
      }
    }
  }, []);

  // Save sizes to localStorage
  const handleLayoutChange = (sizes: number[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
  };

  // Save collapsed state
  const togglePlanPanel = () => {
    const newState = !isPlanCollapsed;
    setIsPlanCollapsed(newState);
    localStorage.setItem(PLAN_COLLAPSED_KEY, String(newState));
  };

  // Mobile: Use a bottom sheet for plans
  if (isMobile) {
    return (
      <div className="relative h-full">
        {children}
        
        {/* Floating button to view plans */}
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="fixed bottom-20 right-4 z-50 shadow-lg gap-2"
            >
              <Map className="w-4 h-4" />
              View Plans
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] p-0">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <span className="font-medium text-sm">Plan Reference</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setMobileSheetOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <PlanPreviewPanel
                  estimateId={estimateId}
                  businessId={businessId}
                  activeScope={activeScope}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Desktop: Resizable split-screen
  return (
    <div className="h-full relative">
      {/* Collapse/expand toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-2 z-20 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm",
          isPlanCollapsed ? "left-2" : "left-[calc(50%-14px)]"
        )}
        onClick={togglePlanPanel}
        title={isPlanCollapsed ? "Show plans" : "Hide plans"}
      >
        {isPlanCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </Button>

      {isPlanCollapsed ? (
        // Show only calculator when collapsed
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      ) : (
        // Show split screen
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={handleLayoutChange}
          className="h-full"
        >
          {/* Left panel: Plan viewer */}
          <ResizablePanel
            defaultSize={defaultSizes[0]}
            minSize={25}
            maxSize={70}
            className="min-w-0"
          >
            <div className="h-full overflow-hidden bg-muted/20 border-r">
              <PlanPreviewPanel
                estimateId={estimateId}
                businessId={businessId}
                activeScope={activeScope}
              />
            </div>
          </ResizablePanel>

          {/* Resize handle */}
          <ResizableHandle withHandle />

          {/* Right panel: Calculator content */}
          <ResizablePanel
            defaultSize={defaultSizes[1]}
            minSize={30}
            className="min-w-0"
          >
            <div className="h-full overflow-y-auto">
              {children}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
