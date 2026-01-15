import { useEffect, useState, useRef } from "react";

interface TerminalLine {
  type: 'command' | 'output' | 'success' | 'info';
  text: string;
  delay?: number;
}

interface TerminalWindowProps {
  lines: TerminalLine[];
  title?: string;
  className?: string;
}

export function TerminalWindow({ lines, title = "Terminal", className = "" }: TerminalWindowProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let currentLine = 0;
    const showNextLine = () => {
      if (currentLine < lines.length) {
        setVisibleLines(currentLine + 1);
        currentLine++;
        const delay = lines[currentLine - 1]?.delay || 300;
        setTimeout(showNextLine, delay);
      }
    };

    showNextLine();
  }, [lines, hasStarted]);

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command':
        return 'text-primary';
      case 'success':
        return 'text-green-400';
      case 'info':
        return 'text-cyan-400';
      default:
        return 'text-foreground/80';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-charcoal-dark rounded-lg border border-border overflow-hidden shadow-2xl ${className}`}
    >
      {/* Window controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-charcoal/50">
        <div className="w-3 h-3 rounded-full bg-destructive/60" />
        <div className="w-3 h-3 rounded-full bg-warning/60" />
        <div className="w-3 h-3 rounded-full bg-success/60" />
        <span className="ml-3 text-xs text-muted-foreground font-mono">{title}</span>
      </div>

      <div className="p-4 font-mono text-sm min-h-[200px]">
        {lines.slice(0, visibleLines).map((line, i) => (
          <div 
            key={i} 
            className={`${getLineColor(line.type)} animate-fade-in`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {line.type === 'command' && (
              <span className="text-green-400 mr-2">$</span>
            )}
            {line.text}
          </div>
        ))}
        
        {/* Blinking cursor */}
        {visibleLines < lines.length && hasStarted && (
          <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
        )}
      </div>
    </div>
  );
}
