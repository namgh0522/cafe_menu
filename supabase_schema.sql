-- =================================================
-- 바이브 카페 주문 테이블 스키마
-- 파일: supabase_schema.sql
-- Supabase SQL Editor에 붙여넣고 실행하세요.
-- =================================================


-- ─────────────────────────────────────────────────
-- 1. 테이블 생성
-- ─────────────────────────────────────────────────
CREATE TABLE cafe_orders (

  -- 주문 고유 번호 (자동 증가 정수 기본키)
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- 주문 접수 시각 (레코드 삽입 시 자동으로 현재 시각 저장)
  ordered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 1. 고객 이름 (필수)
  customer_name   TEXT        NOT NULL,

  -- 2. 전화번호 (선택)
  customer_tel    TEXT,

  -- 3. 선택한 음료 (드롭다운 value: "americano" 등)
  drink           TEXT        NOT NULL,

  -- 4. 사이즈 ('s' | 'm' | 'l')
  size            TEXT        NOT NULL
                    CHECK (size IN ('s', 'm', 'l')),

  -- 5. 추가 옵션 목록
  --    여러 개를 선택할 수 있으므로 PostgreSQL 배열 타입 사용
  --    예) '{shot, cream}' / '{}'(없을 때)
  options         TEXT[]      NOT NULL DEFAULT '{}',

  -- 6. 수량 (1~10 범위 제한)
  quantity        SMALLINT    NOT NULL DEFAULT 1
                    CHECK (quantity BETWEEN 1 AND 10),

  -- 7. 요청사항 (선택)
  request         TEXT,

  -- 8. 결제 예상 금액 (원 단위 정수)
  total_price     INTEGER     NOT NULL DEFAULT 0
                    CHECK (total_price >= 0)

);


-- ─────────────────────────────────────────────────
-- 2. 인덱스 생성
--    자주 조회할 컬럼에 인덱스를 달면 검색이 빨라짐
-- ─────────────────────────────────────────────────

-- 주문 시각 기준 정렬·조회용 (최신 주문 먼저 보기 등)
CREATE INDEX idx_cafe_orders_ordered_at
  ON cafe_orders (ordered_at DESC);

-- 고객 이름으로 주문 내역 조회용
CREATE INDEX idx_cafe_orders_customer_name
  ON cafe_orders (customer_name);


-- ─────────────────────────────────────────────────
-- 3. Row Level Security (RLS) 활성화
--    Supabase에서는 RLS를 켜야 anon key 노출이 안전함
-- ─────────────────────────────────────────────────
ALTER TABLE cafe_orders ENABLE ROW LEVEL SECURITY;

-- 누구나 주문 삽입 가능 (INSERT only)
-- 실서비스라면 고객 인증 후 본인 주문만 보이게 수정 권장
CREATE POLICY "allow_anon_insert"
  ON cafe_orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 관리자(authenticated)만 전체 조회 가능
CREATE POLICY "allow_authenticated_select"
  ON cafe_orders
  FOR SELECT
  TO authenticated
  USING (true);


-- ─────────────────────────────────────────────────
-- 4. 테스트용 더미 데이터 삽입 (선택 사항)
--    실제 서비스 전에 삭제해도 됨
-- ─────────────────────────────────────────────────
INSERT INTO cafe_orders
  (customer_name, customer_tel, drink, size, options, quantity, request, total_price)
VALUES
  ('홍길동', '010-1234-5678', 'caffe-latte',    'm', '{shot}',         1, '얼음 적게',  5000),
  ('김바이브', '010-9999-0000', 'americano',     'l', '{}',             2, NULL,          9000),
  ('이카페', NULL,              'vanilla-latte', 's', '{cream, syrup}', 1, '뜨겁게 해주세요', 5300);


-- ─────────────────────────────────────────────────
-- 5. 확인용 조회 (실행 후 데이터가 보이면 성공)
-- ─────────────────────────────────────────────────
SELECT * FROM cafe_orders ORDER BY ordered_at DESC;

