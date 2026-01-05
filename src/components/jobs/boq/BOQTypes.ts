export interface BOQItem {
  id: string;
  category: 'concrete' | 'reinforcement' | 'formwork' | 'finishing' | 'other';
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
}

export interface JobBOQ {
  id: string;
  job_id: string;
  items: BOQItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const BOQ_CATEGORIES = {
  concrete: { label: 'Concrete', color: 'bg-blue-100 text-blue-800' },
  reinforcement: { label: 'Reinforcement', color: 'bg-green-100 text-green-800' },
  formwork: { label: 'Formwork', color: 'bg-orange-100 text-orange-800' },
  finishing: { label: 'Finishing', color: 'bg-purple-100 text-purple-800' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800' },
} as const;

export const BOQ_UNITS = [
  'm³',
  'm²',
  'm',
  'sheets',
  'bars',
  'kg',
  'tonnes',
  'units',
  'litres',
  'rolls',
];
