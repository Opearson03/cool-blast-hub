import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { DirectoryFilters } from "@/components/directory/DirectoryFilters";
import { DirectoryCard } from "@/components/directory/DirectoryCard";
import { usePublicDirectoryProfiles } from "@/hooks/usePublicDirectory";

export default function SubcontractorDirectory() {
  const { data: profiles, isLoading } = usePublicDirectoryProfiles();
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const filtered = useMemo(() => {
    if (!profiles) return [];
    let list = profiles;

    if (tradeFilter !== "all") {
      list = list.filter((p) => p.trade_types?.includes(tradeFilter));
    }
    if (availabilityFilter === "available") {
      list = list.filter((p) => p.availability_status === "available");
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.first_name?.toLowerCase().includes(q) ||
          p.last_name?.toLowerCase().includes(q) ||
          p.base_postcode?.toLowerCase().includes(q) ||
          p.legal_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [profiles, search, tradeFilter, availabilityFilter]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="lg" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Subcontractor Directory</h1>
              <p className="text-muted-foreground text-sm">Find verified trades for your next project</p>
            </div>
          </div>
          <Button asChild>
            <Link to="/sub-contractors/signup">Join the Directory</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <DirectoryFilters
          search={search}
          onSearchChange={setSearch}
          tradeFilter={tradeFilter}
          onTradeFilterChange={setTradeFilter}
          availabilityFilter={availabilityFilter}
          onAvailabilityFilterChange={setAvailabilityFilter}
        />

        {/* Result count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">No subcontractors match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <DirectoryCard key={p.id} profile={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
