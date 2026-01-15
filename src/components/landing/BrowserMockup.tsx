import { useState } from "react";

interface BrowserMockupProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  showCursor?: boolean;
}

export function BrowserMockup({ 
  src, 
  alt, 
  title = "pourhub.com.au",
  className = "",
  showCursor = false
}: BrowserMockupProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative rounded-xl overflow-hidden shadow-2xl border border-border group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-charcoal border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/60" />
          <div className="w-3 h-3 rounded-full bg-warning/60" />
          <div className="w-3 h-3 rounded-full bg-success/60" />
        </div>
        
        {/* URL bar */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-charcoal-dark rounded-md px-3 py-1.5 max-w-xs w-full">
            <svg className="w-3 h-3 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-muted-foreground font-mono truncate">{title}</span>
          </div>
        </div>
        
        <div className="w-12" /> {/* Spacer for symmetry */}
      </div>
      
      {/* Screenshot content */}
      <div className="relative overflow-hidden">
        <img 
          src={src}
          alt={alt}
          className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Animated cursor */}
        {showCursor && isHovered && (
          <div 
            className="absolute w-6 h-6 pointer-events-none animate-cursor-move"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='white' stroke='black' stroke-width='1' d='M5.5 3.21V20.79L12 14l6.5 6.79V3.21L12 9.79 5.5 3.21z' transform='rotate(-30 12 12)'/%3E%3C/svg%3E")`,
            }}
          />
        )}
      </div>
    </div>
  );
}
