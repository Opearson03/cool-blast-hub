interface FloatingBadgeProps {
  text: string;
  icon?: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export function FloatingBadge({ 
  text, 
  icon, 
  position = 'top-right',
  className = ""
}: FloatingBadgeProps) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div 
      className={`
        absolute ${positionClasses[position]} z-10
        flex items-center gap-2 px-3 py-1.5
        bg-card/80 backdrop-blur-md border border-border/50
        rounded-full shadow-lg
        animate-float
        ${className}
      `}
    >
      {icon && <span className="text-primary">{icon}</span>}
      <span className="text-xs font-mono text-foreground">{text}</span>
    </div>
  );
}
