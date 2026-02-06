// Default price list items for concrete construction estimates
// Sourced from Pour Hub master price list CSV

export interface PriceListItem {
  category: string;
  item_code: string;
  item_name: string;
  unit: string;
  default_price: number;
}

export const PRICE_LIST_CATEGORIES = [
  { id: 'demolition', label: 'Demolition' },
  { id: 'labour', label: 'Labour' },
  { id: 'excavation', label: 'Excavation & Plant' },
  { id: 'concrete', label: 'Concrete Supply' },
  { id: 'pumping', label: 'Concrete Pumping' },
  { id: 'rebar', label: 'Rebar' },
  { id: 'mesh', label: 'Steel Mesh' },
  { id: 'trench_mesh', label: 'Trench Mesh' },
  { id: 'dowel', label: 'Dowels' },
  { id: 'consumables', label: 'Consumables' },
  { id: 'joints_expansion', label: 'Expansion Joints' },
  { id: 'joints_key', label: 'Key Joints' },
  { id: 'joint_foam', label: 'Joint Foam' },
  { id: 'joint_caulking', label: 'Joint Caulking' },
  { id: 'joint_saw_cutting', label: 'Saw Cutting' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'materials', label: 'Materials' },
  { id: 'formwork', label: 'Formwork' },
  { id: 'waffle_pods', label: 'Waffle Pods' },
] as const;

export type PriceListCategory = typeof PRICE_LIST_CATEGORIES[number]['id'];

export const DEFAULT_PRICE_LIST: PriceListItem[] = [
  // Demolition
  { category: 'demolition', item_code: 'DEMOLITION', item_name: 'Concrete Demolition (incl. labour & disposal)', unit: '/m³', default_price: 2400 },
  { category: 'demolition', item_code: 'DEMO_BREAK', item_name: 'Concrete Breaking Labour', unit: '/m³', default_price: 150 },
  { category: 'demolition', item_code: 'TIP_RATE', item_name: 'Concrete Tip/Disposal', unit: '/t', default_price: 400 },
  { category: 'demolition', item_code: 'ROCK_BREAKER', item_name: 'Rock Breaker Attachment', unit: '/day', default_price: 200 },
  // Labour
  { category: 'labour', item_code: 'LABOUR HR', item_name: 'Labour Hour Charge', unit: '/h', default_price: 75 },
  { category: 'labour', item_code: 'LABOUR LEAD', item_name: 'Labour Lead Hour', unit: '/h', default_price: 95 },
  { category: 'labour', item_code: 'LABOUR PREP HR', item_name: 'Labour Prep Hour', unit: '/h', default_price: 75 },
  { category: 'labour', item_code: 'LABOUR PREP LEAD', item_name: 'Labour Prep Lead Hour', unit: '/h', default_price: 95 },
  { category: 'labour', item_code: 'LABOUR PLACE HR', item_name: 'Labour Place Hour', unit: '/h', default_price: 75 },
  { category: 'labour', item_code: 'LABOUR PLACE LEAD', item_name: 'Labour Place Lead Hour', unit: '/h', default_price: 95 },
  // Excavation & Plant
  { category: 'excavation', item_code: 'EXC 1.4T', item_name: 'Excavator 1.4 T With Operator', unit: '/h', default_price: 140 },
  { category: 'excavation', item_code: 'EXC 3.2T', item_name: 'Excavator 3.2 T With Operator', unit: '/h', default_price: 150 },
  { category: 'excavation', item_code: 'EXC 4T', item_name: 'Excavator 4 T With Operator', unit: '/h', default_price: 160 },
  { category: 'excavation', item_code: 'EXC 6T', item_name: 'Excavator 6 T With Operator', unit: '/h', default_price: 180 },
  { category: 'excavation', item_code: 'EXC 9T', item_name: 'Excavator 9 T', unit: '/h', default_price: 200 },
  { category: 'excavation', item_code: 'FLOAT', item_name: 'Float Charge to Site', unit: '/item', default_price: 150 },
  { category: 'excavation', item_code: 'AUGER DRIVE', item_name: 'Additional Cost For Auger Driver', unit: '/day', default_price: 100 },
  { category: 'excavation', item_code: 'AUGER HIRE', item_name: 'Additonal Charge Auger Hire', unit: '/day', default_price: 100 },
  { category: 'excavation', item_code: 'POSI TRACK', item_name: 'Posi Track With Operator', unit: '/h', default_price: 150 },
  { category: 'excavation', item_code: 'EXC_M3', item_name: 'Excavation Rate per m³', unit: '/m³', default_price: 60 },
  { category: 'excavation', item_code: 'SPOTTER', item_name: 'Labour Charge Excavation Spotter', unit: '/h', default_price: 75 },

  // Concrete Supply
  { category: 'concrete', item_code: '15MPA', item_name: '15 Mpa Readymix Concrete', unit: '/m3', default_price: 200 },
  { category: 'concrete', item_code: '20MPA', item_name: '20 Mpa Readymix Concrete', unit: '/m3', default_price: 220 },
  { category: 'concrete', item_code: '25MPA', item_name: '25 Mpa Readymix Concrete', unit: '/m3', default_price: 235 },
  { category: 'concrete', item_code: '32MPA', item_name: '32 Mpa Readymix Concrete', unit: '/m3', default_price: 245 },
  { category: 'concrete', item_code: '40MPA', item_name: '40 Mpa Readymix Concrete', unit: '/m3', default_price: 265 },
  { category: 'concrete', item_code: '25MPA EXP', item_name: '25 Mpa Exposed Aggregate Mix', unit: '/m3', default_price: 290 },
  { category: 'concrete', item_code: '32MPA EXP', item_name: '32 Mpa Exposed Aggregate Mix', unit: '/m3', default_price: 310 },
  { category: 'concrete', item_code: '25MPA COL', item_name: '25 Mpa Colour Mix', unit: '/m3', default_price: 280 },
  { category: 'concrete', item_code: '32MPA COL', item_name: '32 Mpa Colour Mix', unit: '/m3', default_price: 300 },
  { category: 'concrete', item_code: '40MPA COL', item_name: '40 Mpa Colour Mix', unit: '/m3', default_price: 320 },
  { category: 'concrete', item_code: 'WAITING', item_name: 'Concrete Supply Waiting Time Charge', unit: '/min', default_price: 4 },
  { category: 'concrete', item_code: 'TESTING', item_name: 'Concrete Testing Per 50m3', unit: '/item', default_price: 850 },

  // Concrete Pumping
  { category: 'pumping', item_code: 'LINE PUMP', item_name: 'Line Pump', unit: '/h', default_price: 180 },
  { category: 'pumping', item_code: '20M BOOM', item_name: '20M Boom Pump', unit: '/h', default_price: 220 },
  { category: 'pumping', item_code: '32M BOOM', item_name: '32M Boom Pump', unit: '/h', default_price: 220 },
  { category: 'pumping', item_code: '36M BOOM', item_name: '36M Boom Pump', unit: '/h', default_price: 230 },
  { category: 'pumping', item_code: '38M BOOM', item_name: '38M Boom Pump', unit: '/h', default_price: 230 },
  { category: 'pumping', item_code: '42M BOOM', item_name: '42M Boom Pump', unit: '/h', default_price: 240 },
  { category: 'pumping', item_code: '48M BOOM', item_name: '48M Boom Pump', unit: '/h', default_price: 270 },
  { category: 'pumping', item_code: '56M BOOM', item_name: '56M Boom Pump', unit: '/h', default_price: 350 },
  { category: 'pumping', item_code: 'PUMP M3', item_name: 'Concrete Pumping Charge / M3', unit: '/m3', default_price: 8 },
  { category: 'pumping', item_code: 'PUMP WASH', item_name: 'Concrete Pumping Offsite Washout', unit: '/each', default_price: 250 },
  { category: 'pumping', item_code: 'PUMP LAB', item_name: 'Additional Man /h', unit: '/h', default_price: 95 },
  { category: 'pumping', item_code: 'PRIMER', item_name: 'Primer Charge', unit: '/each', default_price: 20 },

  // Rebar - Stock
  { category: 'rebar', item_code: 'N10 STOCK', item_name: 'N10 Rebar (10mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'N12 STOCK', item_name: 'N12 Rebar (12mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'N16 STOCK', item_name: 'N16 Rebar (16mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'N20 STOCK', item_name: 'N20 Rebar (20mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'N24 STOCK', item_name: 'N24 Rebar (24mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'N28 STOCK', item_name: 'N28 Rebar (28mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'N32 STOCK', item_name: 'N32 Rebar (32mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'N36 STOCK', item_name: 'N36 Rebar (36mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'N40 STOCK', item_name: 'N40 Rebar (40mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'R10 STOCK', item_name: 'R10 Rebar (10mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'R12 STOCK', item_name: 'R12 Rebar (12mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'R16 STOCK', item_name: 'R16 Rebar (16mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'R20 STOCK', item_name: 'R20 Rebar (20mm) Stock', unit: '/tonne', default_price: 2100 },
  { category: 'rebar', item_code: 'R24 STOCK', item_name: 'R24 Rebar (24mm) Stock', unit: '/tonne', default_price: 2100 },
  
  // Rebar - Cut & Bend
  { category: 'rebar', item_code: 'N10 CB', item_name: 'N10 Rebar (10mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'N12 CB', item_name: 'N12 Rebar (12mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'N16 CB', item_name: 'N16 Rebar (16mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'N20 CB', item_name: 'N20 Rebar (20mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'N24 CB', item_name: 'N24 Rebar (24mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'N28 CB', item_name: 'N28 Rebar (28mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'N32 CB', item_name: 'N32 Rebar (32mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'N36 CB', item_name: 'N36 Rebar (36mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'N40 CB', item_name: 'N40 Rebar (40mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'R10 CB', item_name: 'R10 Rebar (10mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'R12 CB', item_name: 'R12 Rebar (12mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'R16 CB', item_name: 'R16 Rebar (16mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'R20 CB', item_name: 'R20 Rebar (20mm) Cut & Bend', unit: '/tonne', default_price: 2240 },
  { category: 'rebar', item_code: 'R24 CB', item_name: 'R24 Rebar (24mm) Cut & Bend', unit: '/tonne', default_price: 2240 },

  // Steel Mesh
  { category: 'mesh', item_code: 'SL62', item_name: '6000mm x 2400mm - 6mm Mesh', unit: '/sheet', default_price: 55 },
  { category: 'mesh', item_code: 'SL72', item_name: '6000mm x 2400mm - 7mm Mesh', unit: '/sheet', default_price: 76 },
  { category: 'mesh', item_code: 'SL82', item_name: '6000mm x 2400mm - 8mm Mesh', unit: '/sheet', default_price: 97 },
  { category: 'mesh', item_code: 'SL92', item_name: '6000mm x 2400mm - 9mm Mesh', unit: '/sheet', default_price: 125 },
  { category: 'mesh', item_code: 'SL102', item_name: '6000mm x 2400mm - 10mm Mesh', unit: '/sheet', default_price: 153 },
  { category: 'mesh', item_code: 'SL72 UTE', item_name: '4000mm x 2000mm - 7mm Mesh', unit: '/sheet', default_price: 47 },
  { category: 'mesh', item_code: 'RL718', item_name: '6000mm x 2400mm - 7mm x 100/200', unit: '/sheet', default_price: 95 },
  { category: 'mesh', item_code: 'RL818', item_name: '6000mm x 2400mm - 8mm x 100/200', unit: '/sheet', default_price: 120 },
  { category: 'mesh', item_code: 'RL918', item_name: '6000mm x 2400mm - 9mm x 100/200', unit: '/sheet', default_price: 155 },
  { category: 'mesh', item_code: 'RL1018', item_name: '6000mm x 2400mm - 10mm x 100/200', unit: '/sheet', default_price: 190 },

  // Trench Mesh
  { category: 'trench_mesh', item_code: 'L8TM3', item_name: '6000mm - 3Bar 8mm', unit: '/sheet', default_price: 16 },
  { category: 'trench_mesh', item_code: 'L8TM4', item_name: '6000mm - 4Bar 8mm', unit: '/sheet', default_price: 21 },
  { category: 'trench_mesh', item_code: 'L11TM3', item_name: '6000mm - 3Bar 11mm', unit: '/sheet', default_price: 30 },
  { category: 'trench_mesh', item_code: 'L11TM4', item_name: '6000mm - 4Bar 11mm', unit: '/sheet', default_price: 37 },
  { category: 'trench_mesh', item_code: 'L12TM3', item_name: '6000mm - 3Bar 12mm', unit: '/sheet', default_price: 40 },
  { category: 'trench_mesh', item_code: 'L12TM4', item_name: '6000mm - 4Bar 12mm', unit: '/sheet', default_price: 49 },
  { category: 'trench_mesh', item_code: 'L12TM5', item_name: '6000mm - 5Bar 12mm', unit: '/sheet', default_price: 62 },
  { category: 'trench_mesh', item_code: 'L16TM3', item_name: '6000mm - 3Bar 16mm', unit: '/sheet', default_price: 66 },

  // Dowels
  { category: 'dowel', item_code: 'R12-300 GAL', item_name: '300mm x 12mm Round Gal Dowel', unit: '/each', default_price: 1.32 },
  { category: 'dowel', item_code: 'R12-450 GAL', item_name: '450mm x 12mm Round Gal Dowel', unit: '/each', default_price: 1.76 },
  { category: 'dowel', item_code: 'R12-600 GAL', item_name: '600mm x 12mm Round Gal Dowel', unit: '/each', default_price: 2.64 },
  { category: 'dowel', item_code: 'R16-300 GAL', item_name: '300mm x 16mm Round Gal Dowel', unit: '/each', default_price: 2.20 },
  { category: 'dowel', item_code: 'R16-450 GAL', item_name: '450mm x 16mm Round Gal Dowel', unit: '/each', default_price: 3.08 },
  { category: 'dowel', item_code: 'R16-600 GAL', item_name: '600mm x 16mm Round Gal Dowel', unit: '/each', default_price: 4.84 },
  { category: 'dowel', item_code: 'R20-450 GAL', item_name: '450mm x 20mm Round Gal Dowel', unit: '/each', default_price: 4.84 },
  { category: 'dowel', item_code: 'R20-600 GAL', item_name: '600mm x 20mm Round Gal Dowel', unit: '/each', default_price: 6.60 },
  { category: 'dowel', item_code: 'R24-450 GAL', item_name: '450mm x 24mm Round Gal Dowel', unit: '/each', default_price: 7.04 },

  // Consumables
  { category: 'consumables', item_code: 'DUCT', item_name: 'Duct Tape 48mm x 30m', unit: '/roll', default_price: 4.50 },
  { category: 'consumables', item_code: 'PLASTIC 4X50 HI', item_name: 'Plastic Black 4 x 50m 200um High Impact', unit: '/roll', default_price: 110 },
  { category: 'consumables', item_code: 'PLASTIC 4X50 MED', item_name: 'Plastic Black 4 x 50m 200um Medium Impact', unit: '/roll', default_price: 100 },
  { category: 'consumables', item_code: 'PLASTIC 4X25 ORG', item_name: 'Plastic Orange 4 x 25m 300um High Impact', unit: '/roll', default_price: 140 },
  { category: 'consumables', item_code: 'TIE WIRE', item_name: 'Tie Wire 1.57mm x 95m Belt Wire Coil', unit: '/roll', default_price: 6 },
  { category: 'consumables', item_code: 'TIE WIRE GAL', item_name: 'Tie Wire 1.57mm x 1.5kg Belt Wire Coil Gal', unit: '/roll', default_price: 18 },
  { category: 'consumables', item_code: 'TIE GUN WIRE', item_name: 'Tie Gun Wire Coil', unit: '/coil', default_price: 12 },
  { category: 'consumables', item_code: 'REBAR CAP', item_name: 'Reinforcement Bar Caps QTY 100', unit: '/bag', default_price: 55 },
  { category: 'consumables', item_code: '2540C', item_name: 'Barchair & Base 25/40C NS Bag 100', unit: '/bag', default_price: 15.80 },
  { category: 'consumables', item_code: '5065C', item_name: 'Barchair & Base 50/65C NS Bag 100', unit: '/bag', default_price: 16.80 },
  { category: 'consumables', item_code: '7590C', item_name: 'Barchair & Base 75/90C NS Bag 100', unit: '/bag', default_price: 22.40 },
  { category: 'consumables', item_code: '85100C', item_name: 'Barchair & Base 85/100C NS Bag 100', unit: '/bag', default_price: 23.90 },
  { category: 'consumables', item_code: 'SOG105110', item_name: 'Barchair 105/110 PVC Bag 100', unit: '/bag', default_price: 48.80 },
  { category: 'consumables', item_code: 'SOG115120', item_name: 'Barchair 115/120 PVC Bag 100', unit: '/bag', default_price: 53.30 },
  { category: 'consumables', item_code: 'SOG125130', item_name: 'Barchair 125/130 PVC Bag 100', unit: '/bag', default_price: 57.90 },
  { category: 'consumables', item_code: 'SOG135140', item_name: 'Barchair 135/140 PVC Bag 100', unit: '/bag', default_price: 62.70 },
  { category: 'consumables', item_code: 'SOG145150', item_name: 'Barchair 145/150 PVC Bag 100', unit: '/bag', default_price: 67.30 },
  { category: 'consumables', item_code: 'SOG165170', item_name: 'Barchair 165/170 PVC Bag 100', unit: '/bag', default_price: 81 },
  { category: 'consumables', item_code: '100120C', item_name: 'Barchair 100/120 PVC Bag 100', unit: '/bag', default_price: 45 },
  { category: 'consumables', item_code: '125150C', item_name: 'Barchair 125/150 PVC Bag 100', unit: '/bag', default_price: 55 },
  { category: 'consumables', item_code: 'TMCHAIR', item_name: 'Trench Mesh Supports 8-12mm Bar Bag 25', unit: '/bag', default_price: 12.50 },
  { category: 'consumables', item_code: 'POD RAIL', item_name: 'Podrial 560mm 40/55 Bag 20', unit: '/bag', default_price: 26 },

  // Expansion Joints
  { category: 'joints_expansion', item_code: 'EXJ10030', item_name: 'Expansion Joint 100mm 3000mm R12 - 300mm Dowel 335/c', unit: '/each', default_price: 95 },
  { category: 'joints_expansion', item_code: 'EXJ12530', item_name: 'Expansion Joint 125mm 3000mm R16 - 450mm Dowel 450/c', unit: '/each', default_price: 119.30 },
  { category: 'joints_expansion', item_code: 'EXJ15030', item_name: 'Expansion Joint 150mm 3000mm R16 - 450mm Dowel 450/c', unit: '/each', default_price: 156.90 },
  { category: 'joints_expansion', item_code: 'EXJ20030', item_name: 'Expansion Joint 200mm 3000mm R24 - 450mm Dowel 450/c', unit: '/each', default_price: 217.80 },
  { category: 'joints_expansion', item_code: 'EXJ CAP B', item_name: 'Permanent Capping Mould Black 3000mm', unit: '/each', default_price: 24 },
  { category: 'joints_expansion', item_code: 'EXJ CAP G', item_name: 'Permanent Capping Mould Grey 3000mm', unit: '/each', default_price: 24 },
  { category: 'joints_expansion', item_code: 'EXJ CAP RBM', item_name: 'Removable Rebate Mould 16mm x 10mm 3000mm', unit: '/each', default_price: 30.40 },

  // Key Joints
  { category: 'joints_key', item_code: 'KEY10030', item_name: 'Key Joint 100mm 3000mm', unit: '/each', default_price: 44.90 },
  { category: 'joints_key', item_code: 'KEY10060', item_name: 'Key Joint 100mm 6000mm', unit: '/each', default_price: 89.80 },
  { category: 'joints_key', item_code: 'KEY15030', item_name: 'Key Joint 150mm 3000mm', unit: '/each', default_price: 49.50 },
  { category: 'joints_key', item_code: 'KEY15060', item_name: 'Key Joint 150mm 6000mm', unit: '/each', default_price: 99 },
  { category: 'joints_key', item_code: 'KEY20030', item_name: 'Key Joint 200mm 3000mm', unit: '/each', default_price: 58.20 },
  { category: 'joints_key', item_code: 'KEY20060', item_name: 'Key Joint 200mm 6000mm', unit: '/each', default_price: 116.40 },
  { category: 'joints_key', item_code: 'KEY30030', item_name: 'Key Joint 300mm 3000mm', unit: '/each', default_price: 88.10 },
  { category: 'joints_key', item_code: 'KEY30060', item_name: 'Key Joint 300mm 6000mm', unit: '/each', default_price: 176.20 },

  // Joint Foam
  { category: 'joint_foam', item_code: 'EJA1050SB', item_name: 'Joint Exp Sticky 50x10x25m', unit: '/roll', default_price: 17.80 },
  { category: 'joint_foam', item_code: 'EJA1075SB', item_name: 'Joint Exp Sticky 75x10x25m', unit: '/roll', default_price: 23.40 },
  { category: 'joint_foam', item_code: 'EJA10100SB', item_name: 'Joint Exp Sticky 100x10x25m', unit: '/roll', default_price: 30.50 },
  { category: 'joint_foam', item_code: 'EJA10125SB', item_name: 'Joint Exp Sticky 125x10x25m', unit: '/roll', default_price: 39.60 },
  { category: 'joint_foam', item_code: 'EJA10150SB', item_name: 'Joint Exp Sticky 150x10x25m', unit: '/roll', default_price: 45.70 },
  { category: 'joint_foam', item_code: 'EJA10200SB', item_name: 'Joint Exp Sticky 200x10x25m', unit: '/roll', default_price: 56.90 },
  { category: 'joint_foam', item_code: 'EJA10250SB', item_name: 'Joint Exp Sticky 250x10x25m', unit: '/roll', default_price: 68 },
  { category: 'joint_foam', item_code: 'EJA10300SB', item_name: 'Joint Exp Sticky 300x10x25m', unit: '/roll', default_price: 91.40 },
  { category: 'joint_foam', item_code: 'EJ1075', item_name: 'Joint Exp 75x10x25mt', unit: '/roll', default_price: 15.30 },
  { category: 'joint_foam', item_code: 'EJ10100', item_name: 'Joint Exp 100x10x25mt', unit: '/roll', default_price: 20.30 },

  // Joint Caulking
  { category: 'joint_caulking', item_code: 'CAULKING', item_name: 'Labour & Materials Caulking Joints', unit: '/m', default_price: 10 },
  { category: 'joint_caulking', item_code: 'CAULKING HRS', item_name: 'Labour Hours', unit: '/h', default_price: 75 },

  // Saw Cutting
  { category: 'joint_saw_cutting', item_code: 'JOINTCUT', item_name: 'Labour & Equipment Saw Cutting', unit: '/m', default_price: 6.50 },
  { category: 'joint_saw_cutting', item_code: 'JOINTCUT HR', item_name: 'Labour Hours', unit: '/h', default_price: 75 },

  // Plumbing
  { category: 'plumbing', item_code: 'STRIP DRAIN 1M', item_name: 'Strip Drain (per metre)', unit: '/m', default_price: 85 },
  { category: 'plumbing', item_code: 'PLUMBER HR', item_name: 'Plumber Labour Hour', unit: '/h', default_price: 95 },
  { category: 'plumbing', item_code: 'PLUMBER SUNDRIES', item_name: 'Plumber Sundries Allowance', unit: '/item', default_price: 150 },

  // Materials
  { category: 'materials', item_code: 'DUST', item_name: 'Supply of Crusher Dust', unit: '/m3', default_price: 60 },
  { category: 'materials', item_code: 'ROADBASE 20MM', item_name: 'Road Base 20mm (Class 2)', unit: '/m3', default_price: 55 },
  { category: 'materials', item_code: 'ROADBASE 40MM', item_name: 'Road Base 40mm (Class 3)', unit: '/m3', default_price: 50 },
  { category: 'materials', item_code: 'DISPOSAL', item_name: 'Waste Disposal / Tip Cost', unit: '/item', default_price: 100 },
  { category: 'materials', item_code: 'RETARDER_DRUM', item_name: 'Exposed Aggregate Retarder (20L Drum)', unit: '/drum', default_price: 150 },

  // Delivery
  { category: 'rebar', item_code: 'REO DELIVERY', item_name: 'Reinforcement Delivery Charge', unit: '/item', default_price: 150 },

  // Formwork
  { category: 'formwork', item_code: 'FORM TIMBER', item_name: 'Formwork Timber (generic)', unit: '/m', default_price: 8 },
  { category: 'formwork', item_code: 'FORM TIMBER 100x35', item_name: 'Formwork Timber 100x35mm', unit: '/m', default_price: 5.75 },
  { category: 'formwork', item_code: 'FORM TIMBER 150x35', item_name: 'Formwork Timber 150x35mm', unit: '/m', default_price: 8.38 },
  { category: 'formwork', item_code: 'FORM TIMBER 170x35', item_name: 'Formwork Timber 170x35mm', unit: '/m', default_price: 9.50 },
  { category: 'formwork', item_code: 'FORM TIMBER 200x35', item_name: 'Formwork Timber 200x35mm', unit: '/m', default_price: 11.18 },
  { category: 'formwork', item_code: 'FORM STAKE', item_name: 'Timber Stake', unit: '/each', default_price: 3 },

  // Waffle Pods
  { category: 'waffle_pods', item_code: 'POD150', item_name: 'Waffle Pod 1090 x 1090 x 150', unit: '/pod', default_price: 16 },
  { category: 'waffle_pods', item_code: 'POD225', item_name: 'Waffle Pod 1090 x 1090 x 225', unit: '/pod', default_price: 18.70 },
  { category: 'waffle_pods', item_code: 'POD300', item_name: 'Waffle Pod 1090 x 1090 x 300', unit: '/pod', default_price: 24.30 },
  { category: 'waffle_pods', item_code: 'POD375', item_name: 'Waffle Pod 1090 x 1090 x 375', unit: '/pod', default_price: 33 },
  { category: 'waffle_pods', item_code: 'POD4', item_name: '4-Way Spacer Bag 25', unit: '/bag', default_price: 59 },
  { category: 'waffle_pods', item_code: 'POD2', item_name: '2-Way Spacer Bag 20', unit: '/bag', default_price: 66 },
  { category: 'waffle_pods', item_code: 'PODRAIL', item_name: 'Pod Rail 40mm 550mm Bag 20', unit: '/bag', default_price: 26.60 },
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
    // Parse CSV line, handling quoted values
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
      const customPrice = values[5] ? parseFloat(values[5]) : null;
      items.push({
        category: values[0],
        item_code: values[1],
        item_name: values[2],
        unit: values[3],
        default_price: parseFloat(values[4]) || 0,
        custom_price: isNaN(customPrice as number) ? null : customPrice,
        notes: values[6] || null,
      });
    }
  }
  
  return items;
}

// Helper to get price by category and item code
export function getPriceFromList(
  priceList: PriceListItem[],
  category: string,
  itemCode: string
): number {
  const item = priceList.find(
    p => p.category === category && p.item_code === itemCode
  );
  return item?.default_price ?? 0;
}

// Helper to get all items in a category
export function getItemsByCategory(
  priceList: PriceListItem[],
  category: string
): PriceListItem[] {
  return priceList.filter(p => p.category === category);
}
