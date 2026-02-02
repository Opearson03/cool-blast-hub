-- Function to update pour actual volume when delivery dockets change
CREATE OR REPLACE FUNCTION update_pour_actual_volume()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_pour_id UUID;
  new_pour_id UUID;
  total_volume NUMERIC;
BEGIN
  -- Determine which pour IDs need updating
  old_pour_id := NULL;
  new_pour_id := NULL;

  IF TG_OP = 'DELETE' THEN
    old_pour_id := OLD.linked_pour_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If pour changed, update both old and new
    IF OLD.linked_pour_id IS DISTINCT FROM NEW.linked_pour_id THEN
      old_pour_id := OLD.linked_pour_id;
    END IF;
    -- Only update new pour if document is approved
    IF NEW.status = 'approved' AND NEW.linked_pour_id IS NOT NULL THEN
      new_pour_id := NEW.linked_pour_id;
    END IF;
    -- If status changed from approved, recalc old pour
    IF OLD.status = 'approved' AND NEW.status != 'approved' AND OLD.linked_pour_id IS NOT NULL THEN
      old_pour_id := OLD.linked_pour_id;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.status = 'approved' AND NEW.linked_pour_id IS NOT NULL THEN
      new_pour_id := NEW.linked_pour_id;
    END IF;
  END IF;

  -- Update old pour (remove this docket's contribution)
  IF old_pour_id IS NOT NULL THEN
    SELECT COALESCE(SUM((extracted_data->>'volume_m3')::NUMERIC), 0)
    INTO total_volume
    FROM pending_documents
    WHERE linked_pour_id = old_pour_id
      AND status = 'approved'
      AND extracted_data->>'volume_m3' IS NOT NULL;

    UPDATE job_pours
    SET actual_m3 = NULLIF(total_volume, 0)
    WHERE id = old_pour_id;
  END IF;

  -- Update new pour (add this docket's contribution)
  IF new_pour_id IS NOT NULL AND new_pour_id IS DISTINCT FROM old_pour_id THEN
    SELECT COALESCE(SUM((extracted_data->>'volume_m3')::NUMERIC), 0)
    INTO total_volume
    FROM pending_documents
    WHERE linked_pour_id = new_pour_id
      AND status = 'approved'
      AND extracted_data->>'volume_m3' IS NOT NULL;

    UPDATE job_pours
    SET actual_m3 = NULLIF(total_volume, 0)
    WHERE id = new_pour_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger on pending_documents table
CREATE TRIGGER trg_update_pour_volume
AFTER INSERT OR UPDATE OR DELETE ON pending_documents
FOR EACH ROW
EXECUTE FUNCTION update_pour_actual_volume();