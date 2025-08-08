-- Create function to auto-inactivate events after 3 days
CREATE OR REPLACE FUNCTION auto_inactivate_expired_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inactivate events that are 3 days past their date and still active
  UPDATE events 
  SET status = 'inactive', updated_at = NOW()
  WHERE status = 'active' 
    AND date < (CURRENT_DATE - INTERVAL '3 days');
END;
$$;