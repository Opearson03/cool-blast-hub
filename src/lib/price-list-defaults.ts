// Default price list items for concrete construction estimates
// These are industry-standard Australian prices

export interface PriceListItem {
  category: string;
  item_code: string;
  item_name: string;
  unit: string;
  default_price: number;
}

export const PRICE_LIST_CATEGORIES = [
  { id: 'concrete', label: 'Concrete' },
  { id: 'mesh', label: 'Steel Mesh' },
  { id: 'trench_mesh', label: 'Trench Mesh' },
  { id: 'rebar', label: 'Rebar' },
  { id: 'ligatures', label: 'Ligatures' },
  { id: 'formwork', label: 'Formwork' },
  { id: 'consumables', label: 'Consumables' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'labour', label: 'Labour' },
  { id: 'markup', label: 'Markup' },
  { id: 'pods', label: 'Waffle Pods' },
] as const;

export type PriceListCategory = typeof PRICE_LIST_CATEGORIES[number]['id'];

export const DEFAULT_PRICE_LIST: PriceListItem[] = [
  // Concrete (per m³)
  { category: 'concrete', item_code: '20MPA', item_name: '20 MPa Concrete', unit: '/m³', default_price: 280 },
  { category: 'concrete', item_code: '25MPA', item_name: '25 MPa Concrete', unit: '/m³', default_price: 290 },
  { category: 'concrete', item_code: '32MPA', item_name: '32 MPa Concrete', unit: '/m³', default_price: 300 },
  { category: 'concrete', item_code: '40MPA', item_name: '40 MPa Concrete', unit: '/m³', default_price: 310 },
  { category: 'concrete', item_code: '50MPA', item_name: '50 MPa Concrete', unit: '/m³', default_price: 320 },
  { category: 'concrete', item_code: '65MPA', item_name: '65 MPa Concrete', unit: '/m³', default_price: 350 },

  // Steel Mesh (per sheet - 6m x 2.4m)
  { category: 'mesh', item_code: 'SL62', item_name: 'SL62 Mesh (6.0mm)', unit: '/sheet', default_price: 45 },
  { category: 'mesh', item_code: 'SL72', item_name: 'SL72 Mesh (6.75mm)', unit: '/sheet', default_price: 55 },
  { category: 'mesh', item_code: 'SL82', item_name: 'SL82 Mesh (8.0mm)', unit: '/sheet', default_price: 75 },
  { category: 'mesh', item_code: 'SL92', item_name: 'SL92 Mesh (9.0mm)', unit: '/sheet', default_price: 95 },
  { category: 'mesh', item_code: 'SL102', item_name: 'SL102 Mesh (10.0mm)', unit: '/sheet', default_price: 110 },

  // Trench Mesh (per metre)
  { category: 'trench_mesh', item_code: 'F62', item_name: 'F62 Trench Mesh', unit: '/m', default_price: 12 },
  { category: 'trench_mesh', item_code: 'F72', item_name: 'F72 Trench Mesh', unit: '/m', default_price: 15 },
  { category: 'trench_mesh', item_code: 'F82', item_name: 'F82 Trench Mesh', unit: '/m', default_price: 18 },
  { category: 'trench_mesh', item_code: 'F92', item_name: 'F92 Trench Mesh', unit: '/m', default_price: 22 },
  { category: 'trench_mesh', item_code: 'L8TM300', item_name: 'L8TM300 Trench Mesh', unit: '/m', default_price: 25 },
  { category: 'trench_mesh', item_code: 'L11TM300', item_name: 'L11TM300 Trench Mesh', unit: '/m', default_price: 28 },
  { category: 'trench_mesh', item_code: 'L12TM400', item_name: 'L12TM400 Trench Mesh', unit: '/m', default_price: 32 },

  // Rebar (per kg)
  { category: 'rebar', item_code: 'N10', item_name: 'N10 Rebar (10mm)', unit: '/kg', default_price: 1.85 },
  { category: 'rebar', item_code: 'N12', item_name: 'N12 Rebar (12mm)', unit: '/kg', default_price: 1.85 },
  { category: 'rebar', item_code: 'N16', item_name: 'N16 Rebar (16mm)', unit: '/kg', default_price: 1.85 },
  { category: 'rebar', item_code: 'N20', item_name: 'N20 Rebar (20mm)', unit: '/kg', default_price: 1.85 },
  { category: 'rebar', item_code: 'N24', item_name: 'N24 Rebar (24mm)', unit: '/kg', default_price: 1.85 },
  { category: 'rebar', item_code: 'N28', item_name: 'N28 Rebar (28mm)', unit: '/kg', default_price: 1.85 },
  { category: 'rebar', item_code: 'N32', item_name: 'N32 Rebar (32mm)', unit: '/kg', default_price: 1.85 },
  { category: 'rebar', item_code: 'N36', item_name: 'N36 Rebar (36mm)', unit: '/kg', default_price: 1.85 },

  // Ligatures (per kg)
  { category: 'ligatures', item_code: 'R6', item_name: 'R6 Ligature', unit: '/kg', default_price: 2.20 },
  { category: 'ligatures', item_code: 'R8', item_name: 'R8 Ligature', unit: '/kg', default_price: 2.20 },
  { category: 'ligatures', item_code: 'R10', item_name: 'R10 Ligature', unit: '/kg', default_price: 2.20 },
  { category: 'ligatures', item_code: 'R12', item_name: 'R12 Ligature', unit: '/kg', default_price: 2.20 },

  // Formwork
  { category: 'formwork', item_code: 'EDGE_STD', item_name: 'Standard Edge Formwork', unit: '/m', default_price: 12 },
  { category: 'formwork', item_code: 'EDGE_100', item_name: '100mm Edge Form', unit: '/m', default_price: 12 },
  { category: 'formwork', item_code: 'EDGE_150', item_name: '150mm Edge Form', unit: '/m', default_price: 15 },
  { category: 'formwork', item_code: 'EDGE_200', item_name: '200mm Edge Form', unit: '/m', default_price: 18 },
  { category: 'formwork', item_code: 'EDGE_250', item_name: '250mm Edge Form', unit: '/m', default_price: 22 },
  { category: 'formwork', item_code: 'EDGE_300', item_name: '300mm Edge Form', unit: '/m', default_price: 25 },
  { category: 'formwork', item_code: 'SUSPENDED', item_name: 'Suspended Slab Formwork', unit: '/m²', default_price: 85 },

  // Consumables
  { category: 'consumables', item_code: 'POLY', item_name: 'Poly Membrane (200um)', unit: '/m²', default_price: 2.50 },
  { category: 'consumables', item_code: 'SEALING', item_name: 'Concrete Sealing', unit: '/m²', default_price: 8 },
  { category: 'consumables', item_code: 'CURING', item_name: 'Curing Compound', unit: '/m²', default_price: 3.50 },
  { category: 'consumables', item_code: 'CHAIRS', item_name: 'Bar Chairs', unit: '/m²', default_price: 2 },
  { category: 'consumables', item_code: 'TIE_WIRE', item_name: 'Tie Wire', unit: '/kg', default_price: 4.50 },

  // Equipment
  { category: 'equipment', item_code: 'PUMP', item_name: 'Concrete Pump Hire', unit: '/job', default_price: 1500 },
  { category: 'equipment', item_code: 'PROPS', item_name: 'Props (Suspended Slab)', unit: '/m²', default_price: 35 },
  { category: 'equipment', item_code: 'VIBRATOR', item_name: 'Concrete Vibrator', unit: '/day', default_price: 85 },
  { category: 'equipment', item_code: 'POWER_FLOAT', item_name: 'Power Float', unit: '/day', default_price: 150 },

  // Waffle Pods
  { category: 'pods', item_code: 'POD_225', item_name: '225mm Waffle Pod', unit: '/each', default_price: 8.50 },
  { category: 'pods', item_code: 'POD_275', item_name: '275mm Waffle Pod', unit: '/each', default_price: 10.50 },
  { category: 'pods', item_code: 'POD_325', item_name: '325mm Waffle Pod', unit: '/each', default_price: 12.50 },
  { category: 'pods', item_code: 'POD_375', item_name: '375mm Waffle Pod', unit: '/each', default_price: 14.50 },
  { category: 'pods', item_code: 'POD_425', item_name: '425mm Waffle Pod', unit: '/each', default_price: 16.50 },

  // Labour
  { category: 'labour', item_code: 'HOURLY', item_name: 'Standard Labour Rate', unit: '/hr', default_price: 85 },
  { category: 'labour', item_code: 'FORMWORK_LABOUR', item_name: 'Formwork Labour', unit: '/m', default_price: 15 },
  { category: 'labour', item_code: 'POUR_LABOUR', item_name: 'Pour & Finish Labour', unit: '/m²', default_price: 35 },
  { category: 'labour', item_code: 'STEEL_LABOUR', item_name: 'Steel Fixing Labour', unit: '/kg', default_price: 0.85 },

  // Markup Percentages
  { category: 'markup', item_code: 'MATERIALS', item_name: 'Materials Markup', unit: '%', default_price: 15 },
  { category: 'markup', item_code: 'LABOUR', item_name: 'Labour Markup', unit: '%', default_price: 20 },
  { category: 'markup', item_code: 'EQUIPMENT', item_name: 'Equipment Markup', unit: '%', default_price: 10 },
];

// CSV headers for import/export
export const CSV_HEADERS = ['category', 'item_code', 'item_name', 'unit', 'default_price', 'custom_price', 'notes'];

// Generate CSV content from price list
export function generatePriceListCSV(items: Array<PriceListItem & { custom_price?: number | null; notes?: string | null }>): string {
  const rows = [CSV_HEADERS.join(',')];
  
  for (const item of items) {
    const row = [
      item.category,
      item.item_code,
      `"${item.item_name}"`,
      item.unit,
      item.default_price.toString(),
      item.custom_price?.toString() || '',
      item.notes ? `"${item.notes.replace(/"/g, '""')}"` : '',
    ];
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
}

// Parse CSV content to price list items
export function parsePriceListCSV(csvContent: string): Array<Partial<PriceListItem> & { custom_price?: number | null; notes?: string | null }> {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Skip header row
  const dataLines = lines.slice(1);
  const items: Array<Partial<PriceListItem> & { custom_price?: number | null; notes?: string | null }> = [];
  
  for (const line of dataLines) {
    // Handle quoted values
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length >= 5) {
      items.push({
        category: values[0],
        item_code: values[1],
        item_name: values[2],
        unit: values[3],
        default_price: parseFloat(values[4]) || 0,
        custom_price: values[5] ? parseFloat(values[5]) : null,
        notes: values[6] || null,
      });
    }
  }
  
  return items;
}
