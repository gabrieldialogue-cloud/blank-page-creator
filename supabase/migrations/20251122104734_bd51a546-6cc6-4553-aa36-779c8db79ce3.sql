-- Add constraint to prevent users from having both supervisor and vendedor roles
-- This ensures that a user can only have one role at a time

-- First, let's create a function to check if the role combination is valid
CREATE OR REPLACE FUNCTION check_single_role_per_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has a conflicting role
  IF NEW.role IN ('supervisor', 'vendedor') THEN
    IF EXISTS (
      SELECT 1 FROM user_roles 
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
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single role constraint
DROP TRIGGER IF EXISTS enforce_single_role ON user_roles;
CREATE TRIGGER enforce_single_role
  BEFORE INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION check_single_role_per_user();
