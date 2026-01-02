import { useState, useRef, useCallback, ReactNode } from "react";
import { usePlatform } from "@/hooks/usePlatform";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className = "" }: PullToRefreshProps) {
  const { isNative } = usePlatform();
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isNative || refreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only start pull-to-refresh if at top of scroll
    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isNative, refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isNative || !isPulling.current || refreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isPulling.current = false;
      setPulling(false);
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      e.preventDefault();
      const distance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(distance);
      setPulling(true);
    }
  }, [isNative, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isNative || !isPulling.current) return;

    isPulling.current = false;

    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setRefreshing(false);
        setPulling(false);
        setPullDistance(0);
      }
    } else {
      setPulling(false);
      setPullDistance(0);
    }
  }, [isNative, pullDistance, refreshing, onRefresh]);

  // On web, just render children without pull-to-refresh
  if (!isNative) {
    return <div className={className}>{children}</div>;
  }

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const rotation = refreshing ? 0 : progress * 360;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: pulling ? "none" : "auto" }}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none z-10 transition-opacity duration-200"
        style={{
          top: pullDistance - 50,
          opacity: pulling || refreshing ? 1 : 0,
        }}
      >
        <div
          className={`p-2 rounded-full bg-primary/10 ${refreshing ? "animate-spin" : ""}`}
          style={{
            transform: refreshing ? undefined : `rotate(${rotation}deg)`,
          }}
        >
          <RefreshCw 
            className={`w-5 h-5 text-primary ${progress >= 1 ? "text-primary" : "text-muted-foreground"}`} 
          />
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pulling ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
