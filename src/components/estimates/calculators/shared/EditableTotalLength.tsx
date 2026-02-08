import { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";

interface EditableTotalLengthProps {
  totalLength: number;
  onCommit: (value: number) => void;
  className?: string;
}

/**
 * A controlled-but-locally-buffered numeric input for "Total Length".
 *
 * Problem it solves: when the parent stores totalLength as a computed
 * aggregate (sum of segments) and formats it with .toFixed(2), every
 * keystroke causes the displayed value to reformat (e.g. "5" → "5.00"),
 * which jumps the cursor and makes the field feel broken.
 *
 * Solution: while the user is actively editing (focus), this component
 * keeps the raw text in local state so the parent never reformats it.
 * On blur / Enter the parsed number is pushed to the parent.
 */
export function EditableTotalLength({
  totalLength,
  onCommit,
  className,
}: EditableTotalLengthProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState("");
  const committedRef = useRef(false);

  const displayValue = isEditing
    ? localValue
    : totalLength > 0
      ? totalLength.toFixed(2)
      : "";

  const handleFocus = useCallback(() => {
    setLocalValue(totalLength > 0 ? totalLength.toFixed(2) : "");
    setIsEditing(true);
    committedRef.current = false;
  }, [totalLength]);

  const commit = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    setIsEditing(false);

    const parsed = parseFloat(localValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onCommit(parsed);
    }
    // If empty or invalid, just revert to the displayed value (no-op)
  }, [localValue, onCommit]);

  const handleBlur = useCallback(() => {
    commit();
  }, [commit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
        (e.target as HTMLInputElement).blur();
      }
    },
    [commit],
  );

  return (
    <Input
      type="number"
      inputMode="decimal"
      value={displayValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      min={0}
      step={0.1}
      className={className}
    />
  );
}
