import { useEffect, useState, useRef } from "react";

interface AnimatedCodeBlockProps {
  code: string;
  language?: string;
  typingSpeed?: number;
  showLineNumbers?: boolean;
  className?: string;
}

const syntaxHighlight = (code: string): JSX.Element[] => {
  const lines = code.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Simple syntax highlighting
    const highlighted = line
      .replace(/(\/\/.*)$/g, '<span class="text-muted-foreground/60">$1</span>') // comments
      .replace(/\b(const|let|var|function|return|export|import|from|interface|type|async|await|if|else)\b/g, '<span class="text-purple-400">$1</span>') // keywords
      .replace(/\b(string|number|boolean|any|void|null|undefined|true|false)\b/g, '<span class="text-cyan-400">$1</span>') // types
      .replace(/'([^']*)'/g, '<span class="text-green-400">\'$1\'</span>') // single quote strings
      .replace(/"([^"]*)"/g, '<span class="text-green-400">"$1"</span>') // double quote strings
      .replace(/`([^`]*)`/g, '<span class="text-green-400">`$1`</span>') // template strings
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-400">$1</span>') // numbers
      .replace(/(\w+)(?=\s*\()/g, '<span class="text-yellow-400">$1</span>') // function calls
      .replace(/(\w+)(?=:)/g, '<span class="text-primary">$1</span>'); // object keys

    return (
      <div key={lineIndex} className="table-row">
        <span 
          className="whitespace-pre"
          dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }}
        />
      </div>
    );
  });
};

export function AnimatedCodeBlock({ 
  code, 
  typingSpeed = 20,
  showLineNumbers = true,
  className = ""
}: AnimatedCodeBlockProps) {
  const [displayedCode, setDisplayedCode] = useState("");
  const [isComplete, setIsComplete] = useState(false);
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

    let index = 0;
    const timer = setInterval(() => {
      if (index < code.length) {
        setDisplayedCode(code.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, typingSpeed);

    return () => clearInterval(timer);
  }, [code, typingSpeed, hasStarted]);

  const lines = displayedCode.split('\n');

  return (
    <div 
      ref={containerRef}
      className={`relative bg-charcoal-dark rounded-lg border border-border overflow-hidden ${className}`}
    >
      {/* Window controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-charcoal/50">
        <div className="w-3 h-3 rounded-full bg-destructive/60" />
        <div className="w-3 h-3 rounded-full bg-warning/60" />
        <div className="w-3 h-3 rounded-full bg-success/60" />
        <span className="ml-3 text-xs text-muted-foreground font-mono">pourhub.ts</span>
      </div>
      
      <div className="p-4 font-mono text-sm overflow-x-auto">
        <div className="table">
          {lines.map((line, i) => (
            <div key={i} className="table-row group">
              {showLineNumbers && (
                <span className="table-cell pr-4 text-muted-foreground/40 select-none text-right w-8">
                  {i + 1}
                </span>
              )}
              <span 
                className="table-cell whitespace-pre text-foreground"
                dangerouslySetInnerHTML={{ 
                  __html: syntaxHighlight(line)[0]?.props?.children?.props?.dangerouslySetInnerHTML?.__html || line || '&nbsp;'
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Blinking cursor */}
        {!isComplete && (
          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}
