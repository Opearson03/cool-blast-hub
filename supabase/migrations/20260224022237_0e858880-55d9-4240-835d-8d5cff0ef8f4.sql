
CREATE OR REPLACE FUNCTION public.get_public_unavailable_dates(_id uuid)
RETURNS TABLE (date date)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT ud.date
  FROM subcontractor_unavailable_dates ud
  JOIN subcontractor_directory_profiles sdp ON sdp.user_id = ud.user_id
  WHERE sdp.id = _id
    AND sdp.show_availability_in_directory = true
    AND ud.date >= CURRENT_DATE
    AND ud.date < (date_trunc('month', CURRENT_DATE) + INTERVAL '2 months');
END;
$$;
