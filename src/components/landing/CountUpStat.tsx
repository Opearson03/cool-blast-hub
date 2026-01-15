import { useEffect, useState, useRef } from "react";

interface CountUpStatProps {
  end: number;
  suffix?: string;
  prefix?: string;
  label: string;
  duration?: number;
  codeComment?: string;
}

export function CountUpStat({ 
  end, 
  suffix = "", 
  prefix = "",
  label,
  duration = 2000,
  codeComment
}: CountUpStatProps) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress >= 1) {
        clearInterval(timer);
        setCount(end);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration, hasStarted]);

  return (
    <div 
      ref={containerRef}
      className="text-center p-6 rounded-xl bg-card/50 border border-border backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group"
    >
      <div className="text-4xl md:text-5xl font-bold text-primary mb-2 font-mono">
        {prefix}{count}{suffix}
      </div>
      <div className="text-foreground font-medium mb-2">{label}</div>
      {codeComment && (
        <div className="text-xs font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {codeComment}
        </div>
      )}
    </div>
  );
}
