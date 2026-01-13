import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, SkipForward, Pencil, Trash2 } from 'lucide-react';
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
  const getScopeStatus = (scopeId: string): ScopeMarkupStatus => {
    const markup = markups.find(m => m.scope_id === scopeId);
    if (markup) {
      return {
        scope_id: scopeId,
        label: scopes.find(s => s.id === scopeId)?.label || scopeId,
        status: 'marked',
        area_sqm: markup.area_sqm,
        markup_id: markup.id
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

  const completedCount = scopes.filter(s => {
    const status = getScopeStatus(s.id);
    return status.status === 'marked' || status.status === 'skipped';
  }).length;

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
          const isActive = activeScope === scope.id;
          
          return (
            <div
              key={scope.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg border transition-all',
                isActive && 'border-primary bg-primary/5',
                status.status === 'marked' && !isActive && 'border-green-500/30 bg-green-500/5',
                status.status === 'skipped' && !isActive && 'border-muted opacity-60',
                status.status === 'unmarked' && !isActive && 'border-border'
              )}
            >
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
                    {formatArea(status.area_sqm)}
                  </p>
                )}
                {status.status === 'skipped' && (
                  <p className="text-xs text-muted-foreground">Enter manually</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {status.status === 'marked' && status.markup_id && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onEditMarkup(status.markup_id!)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => onDeleteMarkup(status.markup_id!)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
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
