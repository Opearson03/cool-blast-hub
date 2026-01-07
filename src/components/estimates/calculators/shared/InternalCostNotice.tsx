import { EyeOff } from "lucide-react";

export function InternalCostNotice() {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
      <EyeOff className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
      <p className="text-sm text-amber-700 dark:text-amber-400">
        <strong>Internal costs only</strong> — Client sees final quoted amount only.
      </p>
    </div>
  );
}
