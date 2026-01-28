import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid3X3, Check, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WafflePodFloatingInputProps {
  /** Number of pods marked on plans (click-based) */
  markedPodCount: number;
  /** Manual count override (if user entered manually) */
  manualPodCount: number | null;
  /** Selected pod depth */
  podDepth: string;
  /** Callback when pod depth changes */
  onPodDepthChange: (depth: string) => void;
  /** Callback when user enters a manual count */
  onManualCountChange: (count: number | null) => void;
  /** Callback to clear marked points (when switching to manual) */
  onClearMarkedPoints: () => void;
  /** Callback when done counting */
  onDone: () => void;
  /** Callback to cancel counting */
  onCancel: () => void;
}

const POD_THICKNESS_OPTIONS = [
  { value: '225', label: '225mm' },
  { value: '275', label: '275mm' },
  { value: '325', label: '325mm' },
  { value: '375', label: '375mm' },
];

export function WafflePodFloatingInput({
  markedPodCount,
  manualPodCount,
  podDepth,
  onPodDepthChange,
  onManualCountChange,
  onClearMarkedPoints,
  onDone,
  onCancel,
}: WafflePodFloatingInputProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Determine if we're in manual mode (user has typed a value)
  const isManualMode = manualPodCount !== null;
  const effectiveCount = isManualMode ? manualPodCount : markedPodCount;
  
  // Sync input with manual count
  useEffect(() => {
    if (manualPodCount !== null) {
      setInputValue(String(manualPodCount));
    } else {
      setInputValue('');
    }
  }, [manualPodCount]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      // User entered a valid number - switch to manual mode
      onManualCountChange(numValue);
      // Clear the marked points since we're using manual count
      if (markedPodCount > 0) {
        onClearMarkedPoints();
      }
    } else if (value === '') {
      // User cleared the input - go back to markup mode
      onManualCountChange(null);
    }
  };
  
  const handleSwitchToMarkup = () => {
    // Clear manual count to return to markup mode
    setInputValue('');
    onManualCountChange(null);
  };

  return (
    <Card className="border border-primary/20 bg-card/95 backdrop-blur shadow-md w-56 flex flex-col">
      {/* Collapsible header - matches ScopeMarkupChecklist */}
      <CardHeader 
        className="p-2 cursor-pointer hover:bg-muted/50 transition-colors shrink-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Grid3X3 className="h-3.5 w-3.5 text-primary" />
            <CardTitle className="text-xs font-semibold">Pods</CardTitle>
            {effectiveCount > 0 && (
              <Badge variant="default" className="text-[10px] px-1.5 h-4 font-medium">
                {effectiveCount}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      
      {/* Content - matches ScopeMarkupChecklist spacing */}
      <CardContent className={cn(
        "pt-0 px-2 pb-2",
        !isExpanded && "hidden"
      )}>
        <div className="space-y-2">
          {/* Pod count input/display */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor="pod-count-input" className="text-[10px] text-muted-foreground mb-0.5 block">
                {isManualMode ? 'Manual' : 'Count or mark'}
              </Label>
              <Input
                id="pod-count-input"
                ref={inputRef}
                type="number"
                min="1"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={markedPodCount > 0 ? `${markedPodCount}` : 'Enter...'}
                className="h-7 text-xs"
              />
            </div>
            
            {/* Show marked count badge when not in manual mode */}
            {!isManualMode && markedPodCount > 0 && (
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-muted-foreground">Marked</span>
                <Badge variant="secondary" className="text-sm px-2">
                  {markedPodCount}
                </Badge>
              </div>
            )}
            
            {/* Show switch button when in manual mode */}
            {isManualMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSwitchToMarkup}
                className="h-7 w-7 p-0"
                title="Switch to marking on plans"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Pod depth selector */}
          <div className="flex items-center gap-1.5">
            <Label htmlFor="pod-depth-float" className="text-[10px] text-muted-foreground whitespace-nowrap">
              Depth:
            </Label>
            <Select value={podDepth} onValueChange={onPodDepthChange}>
              <SelectTrigger id="pod-depth-float" className="h-6 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {POD_THICKNESS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Helper text - more compact */}
          <p className={cn(
            "text-[10px] border-l pl-1.5",
            isManualMode 
              ? "text-amber-600 dark:text-amber-400 border-amber-500/50" 
              : "text-muted-foreground border-primary/30"
          )}>
            {isManualMode 
              ? "Manual count active" 
              : "Tap pods or type count"}
          </p>
          
          {/* Action buttons */}
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex-1 h-6 text-[10px] px-2"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onDone}
              disabled={effectiveCount === 0}
              className="flex-1 h-6 text-[10px] px-2"
            >
              <Check className="h-2.5 w-2.5 mr-0.5" />
              Done
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
