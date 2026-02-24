import { useState, useMemo } from "react";
import { Users, Info } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DirectoryFilters } from "@/components/directory/DirectoryFilters";
import { DirectoryCard } from "@/components/directory/DirectoryCard";
import { usePublicDirectoryProfiles } from "@/hooks/usePublicDirectory";
import { useDirectoryByPostcode } from "@/hooks/useDirectoryByPostcode";

export default function SubcontractorDirectory() {
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [postcodeFilter, setPostcodeFilter] = useState("");

  const isPostcodeActive = /^\d{4}$/.test(postcodeFilter.trim());

  const { data: allProfiles, isLoading: allLoading } = usePublicDirectoryProfiles();
  const { data: nearbyProfiles, isLoading: nearbyLoading, isError: nearbyError } = useDirectoryByPostcode(postcodeFilter);

  const isLoading = isPostcodeActive ? nearbyLoading : allLoading;
  const baseProfiles = isPostcodeActive && nearbyProfiles?.length ? nearbyProfiles : null;
  const showFallback = isPostcodeActive && !nearbyLoading && (!nearbyProfiles || nearbyProfiles.length === 0) && !nearbyError;

  const profiles = baseProfiles ?? allProfiles;

  const filtered = useMemo(() => {
    if (!profiles) return [];
    let list = [...profiles];

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
          p.legal_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [profiles, search, tradeFilter, availabilityFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Subcontractor Directory</h1>
        <p className="text-muted-foreground text-sm">Find verified trades for your next project</p>

        <DirectoryFilters
          search={search}
          onSearchChange={setSearch}
          tradeFilter={tradeFilter}
          onTradeFilterChange={setTradeFilter}
          availabilityFilter={availabilityFilter}
          onAvailabilityFilterChange={setAvailabilityFilter}
          postcodeFilter={postcodeFilter}
          onPostcodeFilterChange={setPostcodeFilter}
        />

        {showFallback && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>No subcontractors found near postcode {postcodeFilter}. Showing all results instead.</span>
          </div>
        )}

        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {isPostcodeActive && baseProfiles ? ` near ${postcodeFilter}` : ""}
          </p>
        )}

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
              <DirectoryCard
                key={p.id}
                profile={p}
                distanceKm={"distance_km" in p ? (p as any).distance_km : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
