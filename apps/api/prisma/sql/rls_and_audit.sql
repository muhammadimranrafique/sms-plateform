-- =====================================================================
-- Row Level Security + guaranteed DB-trigger audit
-- Apply AFTER `prisma migrate deploy` (these objects are not managed by Prisma).
-- =====================================================================

-- ---- Enable RLS ----
ALTER TABLE students   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ---- Students policies ----
DROP POLICY IF EXISTS admin_all ON students;
CREATE POLICY admin_all ON students
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS staff_select ON students;
CREATE POLICY staff_select ON students
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin','staff','viewer'));

DROP POLICY IF EXISTS staff_insert ON students;
CREATE POLICY staff_insert ON students
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin','staff'));

DROP POLICY IF EXISTS staff_update ON students;
CREATE POLICY staff_update ON students
  FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin','staff'));

-- ---- Audit log: append-only ----
DROP POLICY IF EXISTS audit_insert_only ON audit_logs;
CREATE POLICY audit_insert_only ON audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS audit_admin_read ON audit_logs;
CREATE POLICY audit_admin_read ON audit_logs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- ---- Guaranteed audit trigger ----
CREATE OR REPLACE FUNCTION fn_audit() RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_logs("userId", "username", "action", "tableName", "recordId", "oldValues", "newValues", "createdAt")
  VALUES (
    COALESCE(current_setting('app.user_id', true), 'system'),
    COALESCE(current_setting('app.username', true), 'system'),
    TG_OP, TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END,
    now()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_students ON students;
CREATE TRIGGER trg_audit_students
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION fn_audit();

DROP TRIGGER IF EXISTS trg_audit_vouchers ON vouchers;
CREATE TRIGGER trg_audit_vouchers
  AFTER INSERT OR UPDATE OR DELETE ON vouchers
  FOR EACH ROW EXECUTE FUNCTION fn_audit();

DROP TRIGGER IF EXISTS trg_audit_promotions ON promotions;
CREATE TRIGGER trg_audit_promotions
  AFTER INSERT OR UPDATE OR DELETE ON promotions
  FOR EACH ROW EXECUTE FUNCTION fn_audit();

-- ---- Single-current-session invariant ----
CREATE UNIQUE INDEX IF NOT EXISTS one_current_session
  ON sessions ((1)) WHERE "isCurrent" = true;
