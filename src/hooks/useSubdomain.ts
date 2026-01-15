import { useMemo } from "react";

export function useSubdomain() {
  const subdomain = useMemo(() => {
    const hostname = window.location.hostname;
    
    // Check for staff subdomain
    if (hostname === "staff.pourhub.com.au" || hostname.startsWith("staff.")) {
      return "staff";
    }
    
    // For local development, check for query param override
    if (hostname === "localhost" || hostname.includes("lovable.app")) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("subdomain") === "staff") {
        return "staff";
      }
    }
    
    return null;
  }, []);

  return {
    subdomain,
    isStaffDomain: subdomain === "staff",
  };
}
