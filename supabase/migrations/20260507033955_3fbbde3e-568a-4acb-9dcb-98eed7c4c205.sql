ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS pour_id uuid REFERENCES public.job_pours(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS diary_stage text,
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS taken_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_cover boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_documents_diary
  ON public.documents (reference_id, pour_id, diary_stage)
  WHERE diary_stage IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_document_diary_stage()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.diary_stage IS NOT NULL AND NEW.diary_stage NOT IN ('before','during','after') THEN
    RAISE EXCEPTION 'diary_stage must be one of before, during, after (got %)', NEW.diary_stage;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_documents_validate_diary_stage ON public.documents;
CREATE TRIGGER trg_documents_validate_diary_stage
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.validate_document_diary_stage();