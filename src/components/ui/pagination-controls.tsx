import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(0)}
        disabled={currentPage === 0 || isLoading}
        className="h-8 w-8"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0 || isLoading}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground px-2">
        Page {currentPage + 1} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1 || isLoading}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage >= totalPages - 1 || isLoading}
        className="h-8 w-8"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
