import { useMemo } from "react";
import { usePriceList } from "./usePriceList";
import { initialPiersData } from "@/components/estimates/calculators/PiersCalculator";
import { initialWafflePodData } from "@/components/estimates/calculators/WafflePodCalculator";
import { initialRetainingWallData } from "@/components/estimates/calculators/RetainingWallCalculator";
import { initialStripFootingsData } from "@/components/estimates/calculators/StripFootingsCalculator";
import { initialCrossoversData } from "@/components/estimates/calculators/CrossoversCalculator";
import { initialPathsSurroundsData } from "@/components/estimates/calculators/PathsSurroundsCalculator";
import { initialRaftSlabData } from "@/components/estimates/calculators/RaftSlabCalculator";
import { initialStandardSlabData } from "@/components/estimates/calculators/StandardSlabCalculator";
import { initialDrivewayData } from "@/components/estimates/calculators/DrivewayCalculator";
import { initialSuspendedSlabData } from "@/components/estimates/calculators/SuspendedSlabCalculator";

/**
 * Hook that returns initial calculator data populated with prices from the My Price List.
 * This ensures new estimates use the business's customized pricing.
 */
export function useEstimateInitialData() {
  const { getPrice, isLoading, priceListItems } = usePriceList();

  const initialScopeData = useMemo(() => {
    // Get prices from price list
    const concretePrice20 = getPrice("concrete", "20MPA").toString();
    const concretePrice25 = getPrice("concrete", "25MPA").toString();
    const concretePrice32 = getPrice("concrete", "32MPA").toString();
    const meshPriceSL72 = getPrice("mesh", "SL72").toString();
    const meshPriceSL82 = getPrice("mesh", "SL82").toString();
    const trenchMeshF72 = getPrice("trench_mesh", "F72").toString();
    const polyPrice = getPrice("consumables", "POLY").toString();
    const sealingPrice = getPrice("consumables", "SEALING").toString();
    const hourlyRate = getPrice("labour", "HOURLY").toString();
    const materialsMarkup = getPrice("markup", "MATERIALS").toString();
    const labourMarkup = getPrice("markup", "LABOUR").toString();
    const formworkPrice = getPrice("formwork", "EDGE_STD").toString();
    const suspendedFormwork = getPrice("formwork", "SUSPENDED").toString();
    const propsPrice = getPrice("equipment", "PROPS").toString();
    const rebarPricePerKg = getPrice("rebar", "N12").toString();
    
    // Pod prices
    const pod225Price = getPrice("pods", "POD_225").toString();

    return {
      // Piers Calculator - uses: concretePricePerM3, rebarPricePerKg, labourHourlyRate
      piers: {
        ...initialPiersData,
        concretePricePerM3: concretePrice32,
        rebarPricePerKg: rebarPricePerKg,
        labourHourlyRate: hourlyRate,
        materialsMarkupPercent: materialsMarkup,
        labourMarkupPercent: labourMarkup,
      },
      
      // Retaining Wall Calculator - uses: concretePricePerM3, meshPricePerSheet, rebarPricePerKg, labourHourlyRate
      retaining_wall_footings: {
        ...initialRetainingWallData,
        concretePricePerM3: concretePrice25,
        meshPricePerSheet: trenchMeshF72,
        rebarPricePerKg: rebarPricePerKg,
        labourHourlyRate: hourlyRate,
        materialsMarkupPercent: materialsMarkup,
        labourMarkupPercent: labourMarkup,
      },
      
      // Strip Footings Calculator - uses: concretePricePerM3, rebarPricePerKg, hourlyRate
      strip_footings: {
        ...initialStripFootingsData,
        concretePricePerM3: concretePrice32,
        rebarPricePerKg: rebarPricePerKg,
        hourlyRate: hourlyRate,
        materialsMarkupPercent: materialsMarkup,
        labourMarkupPercent: labourMarkup,
      },
      
      // Standard Slab Calculator - uses: concretePrice, meshPrice, polyPrice, hourlyRate
      standard_slab: {
        ...initialStandardSlabData,
        concretePrice: concretePrice32,
        meshPrice: meshPriceSL82,
        polyPrice: polyPrice,
        hourlyRate: hourlyRate,
        materialsMarkupPercent: materialsMarkup,
        labourMarkupPercent: labourMarkup,
      },
      
      // Raft Slab Calculator - uses: concretePrice, meshPrice, polyPrice, hourlyRate
      raft_slab: {
        ...initialRaftSlabData,
        concretePrice: concretePrice32,
        meshPrice: meshPriceSL82,
        polyPrice: polyPrice,
        hourlyRate: hourlyRate,
        materialsMarkupPercent: materialsMarkup,
        labourMarkupPercent: labourMarkup,
      },
      
      // Waffle Pod Calculator - uses: concretePricePerM3, meshPricePerSheet, polyPricePerM2, labourHourlyRate
      waffle_pod: {
        ...initialWafflePodData,
        concretePricePerM3: concretePrice25,
        meshPricePerSheet: meshPriceSL72,
        polyPricePerM2: polyPrice,
        podPriceEach: pod225Price,
        labourHourlyRate: hourlyRate,
        materialsMarkupPercent: materialsMarkup,
        labourMarkupPercent: labourMarkup,
      },
      
      // Suspended Slab Calculator - uses: concretePrice, formworkPricePerM2, propsPricePerM2, hourlyRate
      suspended_slab: {
        ...initialSuspendedSlabData,
        concretePrice: concretePrice32,
        formworkPricePerM2: suspendedFormwork,
        propsPricePerM2: propsPrice,
        hourlyRate: hourlyRate,
        materialsMarkupPercent: materialsMarkup,
        labourMarkupPercent: labourMarkup,
      },
      
      // Driveway (uses Standard Slab) - uses: concretePrice, meshPrice, polyPrice, hourlyRate
      driveway: {
        ...initialDrivewayData,
        concretePrice: concretePrice32,
        meshPrice: meshPriceSL82,
        polyPrice: polyPrice,
        hourlyRate: hourlyRate,
        materialsMarkupPercent: materialsMarkup,
        labourMarkupPercent: labourMarkup,
      },
      
      // Paths & Surrounds Calculator - uses: concretePricePerM3, meshPricePerSheet, formworkPricePerM, sealingPricePerM2, labourHourlyRate
      paths_surrounds: {
        ...initialPathsSurroundsData,
        concretePricePerM3: concretePrice25,
        meshPricePerSheet: meshPriceSL72,
        formworkPricePerM: formworkPrice,
        sealingPricePerM2: sealingPrice,
        labourHourlyRate: hourlyRate,
        materialsMarkupPercent: materialsMarkup,
        labourMarkupPercent: labourMarkup,
      },
      
      // Crossovers Calculator - uses: concretePricePerM3, meshPricePerSheet, formworkPricePerM, labourHourlyRate
      crossovers: {
        ...initialCrossoversData,
        concretePricePerM3: concretePrice32,
        meshPricePerSheet: meshPriceSL82,
        formworkPricePerM: formworkPrice,
        labourHourlyRate: hourlyRate,
        materialsMarkupPercent: materialsMarkup,
        labourMarkupPercent: labourMarkup,
      },
    };
  }, [getPrice, priceListItems]);

  return {
    initialScopeData,
    isLoading,
  };
}
