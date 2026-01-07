// ============= SHARED CALCULATOR CONSTANTS =============

export const MPA_STRENGTHS = [
  { value: "20", label: "20 MPa" },
  { value: "25", label: "25 MPa" },
  { value: "32", label: "32 MPa" },
  { value: "40", label: "40 MPa" },
  { value: "50", label: "50 MPa" },
  { value: "65", label: "65 MPa" },
];

export const MESH_TYPES = [
  { id: "SL62", label: "SL62 (6.0mm)", area: 14.4, defaultPrice: 45 },
  { id: "SL72", label: "SL72 (7.0mm)", area: 14.4, defaultPrice: 55 },
  { id: "SL82", label: "SL82 (8.0mm)", area: 14.4, defaultPrice: 70 },
  { id: "SL92", label: "SL92 (9.0mm)", area: 14.4, defaultPrice: 90 },
  { id: "SL102", label: "SL102 (10.0mm)", area: 14.4, defaultPrice: 110 },
];

export const TRENCH_MESH_TYPES = [
  { id: "F62", label: "F62 Trench Mesh", kgPerM: 1.58, defaultPrice: 12 },
  { id: "F72", label: "F72 Trench Mesh", kgPerM: 2.16, defaultPrice: 18 },
  { id: "F82", label: "F82 Trench Mesh", kgPerM: 2.84, defaultPrice: 24 },
  { id: "F92", label: "F92 Trench Mesh", kgPerM: 3.60, defaultPrice: 32 },
  { id: "L8TM300", label: "L8TM300 (8mm)", kgPerM: 3.2, defaultPrice: 12 },
  { id: "L11TM300", label: "L11TM300 (11mm)", kgPerM: 5.9, defaultPrice: 18 },
  { id: "L12TM400", label: "L12TM400 (12mm)", kgPerM: 7.1, defaultPrice: 22 },
];

export const REBAR_SIZES = [
  { id: "N10", label: "N10 (10mm)", kgPerM: 0.617, defaultPrice: 1.85 },
  { id: "N12", label: "N12 (12mm)", kgPerM: 0.888, defaultPrice: 2.20 },
  { id: "N16", label: "N16 (16mm)", kgPerM: 1.58, defaultPrice: 3.50 },
  { id: "N20", label: "N20 (20mm)", kgPerM: 2.47, defaultPrice: 5.20 },
  { id: "N24", label: "N24 (24mm)", kgPerM: 3.55, defaultPrice: 7.50 },
  { id: "N28", label: "N28 (28mm)", kgPerM: 4.83, defaultPrice: 10.20 },
  { id: "N32", label: "N32 (32mm)", kgPerM: 6.31, defaultPrice: 13.30 },
  { id: "N36", label: "N36 (36mm)", kgPerM: 7.99, defaultPrice: 16.85 },
];

export const LIGATURE_SIZES = [
  { id: "R6", label: "R6 (6mm)", kgPerM: 0.222, defaultPrice: 0.50 },
  { id: "R8", label: "R8 (8mm)", kgPerM: 0.395, defaultPrice: 0.75 },
  { id: "R10", label: "R10 (10mm)", kgPerM: 0.617, defaultPrice: 1.00 },
  { id: "R12", label: "R12 (12mm)", kgPerM: 0.888, defaultPrice: 1.50 },
];

export const SLAB_THICKNESS_OPTIONS = [
  { value: "85", label: "85mm" },
  { value: "100", label: "100mm" },
  { value: "125", label: "125mm" },
  { value: "150", label: "150mm" },
  { value: "175", label: "175mm" },
  { value: "200", label: "200mm" },
  { value: "225", label: "225mm" },
  { value: "250", label: "250mm" },
  { value: "300", label: "300mm" },
  { value: "350", label: "350mm" },
];

export const POD_SIZES = [
  { value: "1090x1090x110", label: "1090 × 1090 × 110mm" },
  { value: "1090x1090x150", label: "1090 × 1090 × 150mm" },
  { value: "1090x1090x225", label: "1090 × 1090 × 225mm" },
  { value: "1090x1090x300", label: "1090 × 1090 × 300mm" },
];

export const POLY_LAYER_OPTIONS = [
  { value: "1", label: "1 Layer" },
  { value: "2", label: "2 Layers" },
];

export const REBAR_SPACING_OPTIONS = [
  { value: "100", label: "100mm" },
  { value: "150", label: "150mm" },
  { value: "200", label: "200mm" },
  { value: "250", label: "250mm" },
  { value: "300", label: "300mm" },
];

// Rebar weight lookup (kg/m)
export const REBAR_WEIGHT: Record<string, number> = {
  "R6": 0.222,
  "R8": 0.395,
  "R10": 0.617,
  "R12": 0.888,
  "N10": 0.617,
  "N12": 0.888,
  "N16": 1.58,
  "N20": 2.47,
  "N24": 3.55,
  "N28": 4.83,
  "N32": 6.31,
  "N36": 7.99,
};

// Standard mesh sheet area (6m × 2.4m)
export const MESH_SHEET_AREA = 14.4;

// Currency formatter for AU dollars
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(amount);
};

// Common additional cost item interface
export interface AdditionalCostItem {
  id: string;
  description: string;
  cost: string;
}
