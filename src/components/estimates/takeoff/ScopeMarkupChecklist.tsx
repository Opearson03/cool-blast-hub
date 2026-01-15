import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, SkipForward, Pencil, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TakeoffMarkup, ScopeMarkupStatus } from '@/types/takeoff';

interface ScopeMarkupChecklistProps {
  scopes: { id: string; label: string }[];
  markups: TakeoffMarkup[];
  skippedScopes: Set<string>;
  activeScope: string | null;
  onMarkArea: (scopeId: string) => void;
  onSkipScope: (scopeId: string) => void;
  onEditMarkup: (markupId: string) => void;
  onDeleteMarkup: (markupId: string) => void;
  isCalibrated: boolean;
}

export function ScopeMarkupChecklist({
  scopes,
  markups,
  skippedScopes,
  activeScope,
  onMarkArea,
  onSkipScope,
  onEditMarkup,
  onDeleteMarkup,
  isCalibrated
}: ScopeMarkupChecklistProps) {
  const getScopeMarkups = (scopeId: string) => {
    return markups.filter(m => m.scope_id === scopeId);
  };

  const getScopeStatus = (scopeId: string): ScopeMarkupStatus & { pierCount?: number; totalLength?: number } => {
    const scopeMarkups = getScopeMarkups(scopeId);
    if (scopeMarkups.length > 0) {
      // Check if this is a pier/point scope (has point-type markups)
      const pointMarkup = scopeMarkups.find(m => m.shape_type === 'point');
      if (pointMarkup) {
        const totalCount = scopeMarkups.reduce((sum, m) => sum + (m.pier_quantity || 0), 0);
        return {
          scope_id: scopeId,
          label: scopes.find(s => s.id === scopeId)?.label || scopeId,
          status: 'marked',
          area_sqm: null,
          pierCount: totalCount,
          markup_id: scopeMarkups[0].id
        };
      }
      
      // Check if this is a linear scope (has polyline-type markups)
      const polylineMarkup = scopeMarkups.find(m => m.shape_type === 'polyline');
      if (polylineMarkup) {
        const totalLength = scopeMarkups.reduce((sum, m) => sum + (m.length_m || 0), 0);
        return {
          scope_id: scopeId,
          label: scopes.find(s => s.id === scopeId)?.label || scopeId,
          status: 'marked',
          area_sqm: null,
          totalLength,
          markup_id: scopeMarkups[0].id
        };
      }
      
      // Sum all areas for this scope (polygon/rectangle markups)
      const totalArea = scopeMarkups.reduce((sum, m) => sum + (m.area_sqm || 0), 0);
      return {
        scope_id: scopeId,
        label: scopes.find(s => s.id === scopeId)?.label || scopeId,
        status: 'marked',
        area_sqm: totalArea,
        markup_id: scopeMarkups[0].id
      };
    }
    if (skippedScopes.has(scopeId)) {
      return {
        scope_id: scopeId,
        label: scopes.find(s => s.id === scopeId)?.label || scopeId,
        status: 'skipped',
        area_sqm: null
      };
    }
    return {
      scope_id: scopeId,
      label: scopes.find(s => s.id === scopeId)?.label || scopeId,
      status: 'unmarked',
      area_sqm: null
    };
  };

  const formatArea = (area: number | null): string => {
    if (area === null) return '--';
    return `${area.toFixed(1)} m²`;
  };

  const formatLength = (length: number | null): string => {
    if (length === null) return '--';
    return `${length.toFixed(1)} m`;
  };

  const formatPierCount = (count: number | undefined): string => {
    if (!count) return '--';
    return `${count} pier${count !== 1 ? 's' : ''}`;
  };

  // Count based on whether scope has at least one markup or is skipped
  const completedCount = scopes.filter(s => {
    const status = getScopeStatus(s.id);
    return status.status === 'marked' || status.status === 'skipped';
  }).length;
  
  // Total markup count for all scopes
  const totalMarkupCount = markups.length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Scope Areas</CardTitle>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{scopes.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 overflow-y-auto max-h-[400px]">
        {scopes.map((scope) => {
          const status = getScopeStatus(scope.id);
          const scopeMarkups = getScopeMarkups(scope.id);
          const isActive = activeScope === scope.id;
          
          return (
            <div
              key={scope.id}
              className={cn(
                'rounded-lg border transition-all',
                isActive && 'border-primary bg-primary/5',
                status.status === 'marked' && !isActive && 'border-green-500/30 bg-green-500/5',
                status.status === 'skipped' && !isActive && 'border-muted opacity-60',
                status.status === 'unmarked' && !isActive && 'border-border'
              )}
            >
              {/* Scope header */}
              <div className="flex items-center gap-3 p-2">
                {/* Status icon */}
                <div className="shrink-0">
                  {status.status === 'marked' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : status.status === 'skipped' ? (
                    <SkipForward className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Scope info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{status.label}</p>
                  {status.status === 'marked' && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                      {status.pierCount 
                        ? formatPierCount(status.pierCount)
                        : status.totalLength 
                          ? `${scopeMarkups.length} section${scopeMarkups.length !== 1 ? 's' : ''} • ${formatLength(status.totalLength)}`
                          : `${scopeMarkups.length} area${scopeMarkups.length !== 1 ? 's' : ''} • ${formatArea(status.area_sqm)}`
                      }
                    </p>
                  )}
                  {status.status === 'skipped' && (
                    <p className="text-xs text-muted-foreground">Enter manually</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {status.status === 'marked' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => onMarkArea(scope.id)}
                      disabled={!isCalibrated}
                      title="Add another area"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  )}
                  {status.status === 'unmarked' && (
                    <>
                      <Button
                        variant={isCalibrated ? 'default' : 'secondary'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onMarkArea(scope.id)}
                        disabled={!isCalibrated}
                      >
                        Mark
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => onSkipScope(scope.id)}
                      >
                        Skip
                      </Button>
                    </>
                  )}
                  {status.status === 'skipped' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onMarkArea(scope.id)}
                      disabled={!isCalibrated}
                    >
                      Mark
                    </Button>
                  )}
                </div>
              </div>
              
              {scopeMarkups.length > 0 && (
                <div className="border-t px-2 pb-2 pt-1 space-y-1">
                  {scopeMarkups.map((markup, idx) => {
                    // Determine display format based on shape type
                    const isPolyline = markup.shape_type === 'polyline';
                    const isPoint = markup.shape_type === 'point';
                    const displayLabel = isPoint 
                      ? `${markup.pier_quantity || 1} item${(markup.pier_quantity || 1) !== 1 ? 's' : ''}`
                      : isPolyline
                        ? formatLength(markup.length_m || null)
                        : formatArea(markup.area_sqm);
                    const defaultName = isPolyline ? `Section ${idx + 1}` : `Area ${idx + 1}`;
                    
                    return (
                      <div 
                        key={markup.id}
                        className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-muted/50"
                      >
                        <span className="flex-1 truncate font-medium">
                          {markup.name || defaultName}
                        </span>
                        <span className="text-muted-foreground font-mono">
                          {displayLabel}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onEditMarkup(markup.id)}
                          title="Select"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => onDeleteMarkup(markup.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {!isCalibrated && (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-center pt-2">
            Calibrate the scale first to enable area marking
          </p>
        )}
      </CardContent>
    </Card>
  );
}
