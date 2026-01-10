import { ExclusionItem } from "@/lib/estimate-components/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, AlertCircle } from "lucide-react";
import { useState } from "react";

interface ExclusionsSummaryProps {
  autoExclusions: ExclusionItem[];
  customExclusions: ExclusionItem[];
  onAddCustom: (text: string) => void;
  onRemoveCustom: (id: string) => void;
}

export function ExclusionsSummary({
  autoExclusions,
  customExclusions,
  onAddCustom,
  onRemoveCustom,
}: ExclusionsSummaryProps) {
  const [newExclusion, setNewExclusion] = useState('');

  const handleAdd = () => {
    if (newExclusion.trim()) {
      onAddCustom(newExclusion.trim());
      setNewExclusion('');
    }
  };

  const allExclusions = [...autoExclusions, ...customExclusions];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Exclusions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Items not included in this quote
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto-generated exclusions */}
        {autoExclusions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Based on Selections
            </h4>
            <ul className="space-y-1">
              {autoExclusions.map((exclusion) => (
                <li
                  key={exclusion.id}
                  className="text-sm flex items-start gap-2 text-muted-foreground"
                >
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground flex-shrink-0" />
                  <span>{exclusion.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Custom exclusions */}
        {customExclusions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Custom Exclusions
            </h4>
            <ul className="space-y-1">
              {customExclusions.map((exclusion) => (
                <li
                  key={exclusion.id}
                  className="text-sm flex items-center gap-2"
                >
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-muted-foreground flex-shrink-0" />
                  <span className="flex-1">{exclusion.text}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onRemoveCustom(exclusion.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Add custom exclusion */}
        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="Add custom exclusion..."
            value={newExclusion}
            onChange={(e) => setNewExclusion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={!newExclusion.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Empty state */}
        {allExclusions.length === 0 && !newExclusion && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No exclusions yet. Add custom exclusions above or they will be auto-generated based on your selections.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
