import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TRADE_TYPES = [
  "Concreter",
  "Steel Fixer",
  "Formworker",
  "Concrete Finisher",
  "Concrete Pump Operator",
  "Concrete Cutter",
  "Labourer",
];

interface DirectoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  tradeFilter: string;
  onTradeFilterChange: (value: string) => void;
  availabilityFilter: string;
  onAvailabilityFilterChange: (value: string) => void;
}

export function DirectoryFilters({
  search,
  onSearchChange,
  tradeFilter,
  onTradeFilterChange,
  availabilityFilter,
  onAvailabilityFilterChange,
}: DirectoryFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, postcode, or business…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={tradeFilter} onValueChange={onTradeFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="All Trades" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Trades</SelectItem>
          {TRADE_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={availabilityFilter} onValueChange={onAvailabilityFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="available">Available Only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
