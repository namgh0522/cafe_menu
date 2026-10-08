-- =================================================
-- [STEP 3] 테스트 데이터 삽입 + 조회 확인
-- STEP 2 성공 후 이 부분을 붙여넣고 Run
-- =================================================

INSERT INTO cafe_orders
  (customer_name, customer_tel, drink, size, options, quantity, request, total_price)
VALUES
  ('홍길동',  '010-1234-5678', 'caffe-latte',    'm', '{shot}',         1, '얼음 적게',       5000),
  ('김바이브', '010-9999-0000', 'americano',      'l', '{}',             2, NULL,              9000),
  ('이카페',  NULL,             'vanilla-latte',  's', '{cream, syrup}', 1, '뜨겁게 해주세요', 5300);

SELECT * FROM cafe_orders ORDER BY ordered_at DESC;

