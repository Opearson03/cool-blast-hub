import { useState } from "react";
import { AnimatedCodeBlock } from "./AnimatedCodeBlock";

interface CodeShowcaseProps {
  title: string;
  description: string;
  code: string;
  visualization: React.ReactNode;
  reversed?: boolean;
}

export function CodeShowcase({ 
  title, 
  description, 
  code, 
  visualization,
  reversed = false 
}: CodeShowcaseProps) {
  return (
    <div className={`grid lg:grid-cols-2 gap-8 items-center ${reversed ? 'lg:flex-row-reverse' : ''}`}>
      <div className={reversed ? 'lg:order-2' : ''}>
        <h3 className="text-2xl font-bold text-foreground mb-4">
          {title}
        </h3>
        <p className="text-muted-foreground mb-6">
          {description}
        </p>
        <AnimatedCodeBlock code={code} className="shadow-xl" />
      </div>
      
      <div className={`${reversed ? 'lg:order-1' : ''} flex items-center justify-center`}>
        {visualization}
      </div>
    </div>
  );
}

// 3D Slab visualization for volume calculator
export function SlabVisualization() {
  const [dimensions, setDimensions] = useState({ length: 5, width: 4, thickness: 100 });
  
  return (
    <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
      {/* 3D Slab representation */}
      <div className="relative" style={{ perspective: '800px' }}>
        <div 
          className="relative bg-gradient-to-br from-concrete to-muted border-2 border-border rounded-sm shadow-2xl transition-all duration-500"
          style={{
            width: `${dimensions.length * 30}px`,
            height: `${dimensions.width * 30}px`,
            transform: 'rotateX(60deg) rotateZ(-45deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Depth effect */}
          <div 
            className="absolute top-full left-0 w-full bg-gradient-to-b from-charcoal-light to-charcoal border-x-2 border-b-2 border-border origin-top"
            style={{
              height: `${dimensions.thickness / 5}px`,
              transform: 'rotateX(-90deg)',
            }}
          />
          <div 
            className="absolute top-0 left-full h-full bg-gradient-to-r from-charcoal-light to-charcoal border-y-2 border-r-2 border-border origin-left"
            style={{
              width: `${dimensions.thickness / 5}px`,
              transform: 'rotateY(90deg)',
            }}
          />
        </div>
      </div>
      
      {/* Dimension labels */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs font-mono text-muted-foreground">
        <span>{dimensions.length}m × {dimensions.width}m × {dimensions.thickness}mm</span>
        <span className="text-primary font-bold">
          = {((dimensions.length * dimensions.width * dimensions.thickness) / 1000).toFixed(1)}m³
        </span>
      </div>
      
      {/* Animated dimension controls */}
      <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-4">
        {['length', 'width', 'thickness'].map((dim) => (
          <button
            key={dim}
            onClick={() => setDimensions(prev => ({
              ...prev,
              [dim]: dim === 'thickness' 
                ? (prev.thickness === 100 ? 150 : prev.thickness === 150 ? 200 : 100)
                : (prev[dim as keyof typeof prev] === 5 ? 6 : prev[dim as keyof typeof prev] === 6 ? 4 : 5)
            }))}
            className="text-xs px-2 py-1 rounded bg-card border border-border hover:border-primary/50 transition-colors font-mono"
          >
            {dim}
          </button>
        ))}
      </div>
    </div>
  );
}

// Drag demo visualization
export function DragDemoVisualization() {
  const [position, setPosition] = useState({ x: 0, day: 'Mon' });
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  
  const handleDrag = (day: string) => {
    setPosition({ x: days.indexOf(day) * 60, day });
  };
  
  return (
    <div className="relative w-full max-w-md p-6 bg-card/50 rounded-xl border border-border">
      <div className="text-sm font-medium text-muted-foreground mb-4 font-mono">
        {'// Drag to reschedule'}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {days.map((day) => (
          <div 
            key={day}
            className={`text-center text-xs font-medium py-2 rounded-lg transition-colors cursor-pointer ${
              position.day === day ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => handleDrag(day)}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Draggable pour card */}
      <div 
        className="absolute bottom-16 transition-all duration-300 ease-out"
        style={{ left: `calc(${position.x}px + 24px + 10%)` }}
      >
        <div className="bg-primary/20 border border-primary/50 rounded-lg px-3 py-2 shadow-lg cursor-grab active:cursor-grabbing">
          <div className="text-xs font-medium text-primary">Driveway Pour</div>
          <div className="text-xs text-muted-foreground">32 MPa • 8:00 AM</div>
        </div>
      </div>
      
      <div className="mt-12 text-xs text-muted-foreground text-center font-mono">
        Click days to see drag effect →
      </div>
    </div>
  );
}
