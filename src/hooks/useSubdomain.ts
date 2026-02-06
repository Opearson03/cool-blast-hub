import { useMemo } from "react";

export function useSubdomain() {
  const subdomain = useMemo(() => {
    const hostname = window.location.hostname;
    
    // Check for staff subdomain
    if (hostname === "staff.pourhub.com.au" || hostname.startsWith("staff.")) {
      return "staff";
    }
    
    // Check for suppliers subdomain
    if (hostname === "suppliers.pourhub.com.au" || hostname.startsWith("suppliers.")) {
      return "suppliers";
    }
    
    // For local development, check for query param override
    if (hostname === "localhost" || hostname.includes("lovable.app")) {
      const params = new URLSearchParams(window.location.search);
      const subdomainParam = params.get("subdomain");
      if (subdomainParam === "staff") {
        return "staff";
      }
      if (subdomainParam === "suppliers") {
        return "suppliers";
      }
    }
    
    return null;
  }, []);

  return {
    subdomain,
    isStaffDomain: subdomain === "staff",
    isSupplierDomain: subdomain === "suppliers",
  };
}
