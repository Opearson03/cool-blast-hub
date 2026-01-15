import { useState } from "react";
import { LucideIcon } from "lucide-react";

interface InteractiveFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  codeSnippet?: string;
  animation?: 'pulse' | 'bounce' | 'spin' | 'counter';
  counterValue?: number;
}

export function InteractiveFeatureCard({
  icon: Icon,
  title,
  description,
  codeSnippet,
  animation,
  counterValue = 0
}: InteractiveFeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [counter, setCounter] = useState(counterValue);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (animation === 'counter') {
      setCounter(prev => prev + 1);
    }
  };

  const getAnimationClass = () => {
    if (!isHovered) return '';
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'bounce':
        return 'animate-bounce';
      case 'spin':
        return 'animate-spin';
      default:
        return '';
    }
  };

  return (
    <div 
      className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 overflow-hidden cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Icon with animation */}
      <div className={`relative text-primary mb-4 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
        <Icon className={`w-10 h-10 ${getAnimationClass()}`} />
        
        {/* Counter badge for counter animation */}
        {animation === 'counter' && counter > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-scale-in">
            {counter}
          </span>
        )}
      </div>
      
      <h3 className="relative text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      
      <p className="relative text-muted-foreground text-sm mb-4">
        {description}
      </p>
      
      {/* Code snippet reveal on hover */}
      {codeSnippet && (
        <div className={`relative overflow-hidden transition-all duration-300 ${isHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <pre className="text-xs font-mono bg-charcoal-dark rounded-lg p-3 text-primary/80 overflow-x-auto">
            {codeSnippet}
          </pre>
        </div>
      )}
      
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
