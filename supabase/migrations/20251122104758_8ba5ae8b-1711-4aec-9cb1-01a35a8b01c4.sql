-- Fix function search_path for check_single_role_per_user
CREATE OR REPLACE FUNCTION check_single_role_per_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user already has a conflicting role
  IF NEW.role IN ('supervisor', 'vendedor') THEN
    IF EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = NEW.user_id 
      AND role IN ('supervisor', 'vendedor')
      AND role != NEW.role
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Usuário não pode ter roles de supervisor e vendedor simultaneamente';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
