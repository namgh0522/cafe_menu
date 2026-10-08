-- =================================================
-- [STEP 2] RLS 활성화 + 정책 생성
-- STEP 1 성공 후 이 부분을 붙여넣고 Run
-- =================================================

ALTER TABLE cafe_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_insert"
  ON cafe_orders FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "allow_authenticated_select"
  ON cafe_orders FOR SELECT TO authenticated USING (true);

