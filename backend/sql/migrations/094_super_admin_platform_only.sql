-- Remediate org-bound super_admin users and enforce platform-only super_admin at DB level.

UPDATE users u
SET role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1),
    updated_at = NOW()
WHERE u.organization_id IS NOT NULL
  AND u.role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1);

CREATE OR REPLACE FUNCTION enforce_user_org_role_consistency()
RETURNS TRIGGER AS $$
DECLARE
  role_name text;
BEGIN
  SELECT name INTO role_name FROM roles WHERE id = NEW.role_id;
  IF role_name IS NULL THEN
    RAISE EXCEPTION 'Invalid role_id';
  END IF;

  IF role_name = 'super_admin' AND NEW.organization_id IS NOT NULL THEN
    RAISE EXCEPTION 'super_admin users must not belong to an organization';
  END IF;

  IF NEW.organization_id IS NULL AND role_name <> 'super_admin' THEN
    RAISE EXCEPTION 'Only super_admin users may have a null organization_id';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_org_role_consistency ON users;

CREATE TRIGGER trg_users_org_role_consistency
  BEFORE INSERT OR UPDATE OF role_id, organization_id ON users
  FOR EACH ROW
  EXECUTE FUNCTION enforce_user_org_role_consistency();
