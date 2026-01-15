import { useEffect, useState, useRef } from "react";

const techStack = [
  { name: "React", color: "#61DAFB" },
  { name: "TypeScript", color: "#3178C6" },
  { name: "Tailwind CSS", color: "#06B6D4" },
  { name: "Supabase", color: "#3ECF8E" },
  { name: "Vite", color: "#646CFF" },
];

export function TechStackBar() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="py-12 border-y border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4">
        <p className="text-center text-muted-foreground text-sm mb-6 font-mono">
          {'// Built with modern technologies'}
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
          {techStack.map((tech, index) => (
            <div
              key={tech.name}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:border-primary/50 transition-all duration-300 ${
                isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
              }`}
              style={{ 
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'backwards'
              }}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: tech.color }}
              />
              <span className="text-sm font-medium text-foreground">
                {tech.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
