-- =================================================
-- [STEP 1] 테이블 + 인덱스 생성
-- Supabase SQL Editor에 이 부분만 먼저 붙여넣고 Run
-- =================================================

CREATE TABLE cafe_orders (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ordered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_name TEXT        NOT NULL,
  customer_tel  TEXT,
  drink         TEXT        NOT NULL,
  size          TEXT        NOT NULL CHECK (size IN ('s', 'm', 'l')),
  options       TEXT[]      NOT NULL DEFAULT '{}',
  quantity      SMALLINT    NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 10),
  request       TEXT,
  total_price   INTEGER     NOT NULL DEFAULT 0 CHECK (total_price >= 0)
);

CREATE INDEX idx_cafe_orders_ordered_at    ON cafe_orders (ordered_at DESC);
CREATE INDEX idx_cafe_orders_customer_name ON cafe_orders (customer_name);

