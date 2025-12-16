-- Create pour_equipment table for assigning equipment to pours
CREATE TABLE public.pour_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pour_id UUID NOT NULL REFERENCES public.job_pours(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pour_id, equipment_id)
);

-- Enable RLS
ALTER TABLE public.pour_equipment ENABLE ROW LEVEL SECURITY;

-- Users can view pour equipment for their business
CREATE POLICY "Users can view pour equipment"
ON public.pour_equipment
FOR SELECT
USING (
  pour_id IN (
    SELECT jp.id FROM job_pours jp
    JOIN jobs j ON jp.job_id = j.id
    WHERE j.business_id IN (
      SELECT business_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Staff can manage their business pour equipment
CREATE POLICY "Staff can manage their business pour equipment"
ON public.pour_equipment
FOR ALL
USING (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
  AND pour_id IN (
    SELECT jp.id FROM job_pours jp
    JOIN jobs j ON jp.job_id = j.id
    WHERE j.business_id IN (
      SELECT business_id FROM profiles WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
  AND pour_id IN (
    SELECT jp.id FROM job_pours jp
    JOIN jobs j ON jp.job_id = j.id
    WHERE j.business_id IN (
      SELECT business_id FROM profiles WHERE id = auth.uid()
    )
  )
);