-- 하이브리드 주문 처리 시스템 추가

-- orders 테이블에 주문 이행 타입 및 발주 관련 컬럼 추가
ALTER TABLE orders ADD COLUMN fulfillment_type TEXT DEFAULT 'direct' CHECK(fulfillment_type IN ('direct', 'workshop'));
ALTER TABLE orders ADD COLUMN workshop_order_status TEXT CHECK(workshop_order_status IN ('pending', 'sent', 'processing', 'shipped', 'completed', NULL));
ALTER TABLE orders ADD COLUMN workshop_order_sent_at DATETIME;
ALTER TABLE orders ADD COLUMN workshop_notes TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_type ON orders(fulfillment_type);
CREATE INDEX IF NOT EXISTS idx_orders_workshop_status ON orders(workshop_order_status);

-- 주문 타입 설명:
-- fulfillment_type:
--   'direct': 자사 직접 배송 (리프레쉬 제품)
--   'workshop': 공방 위탁 배송 (증상 케어 제품)
-- 
-- workshop_order_status:
--   'pending': 발주 대기
--   'sent': 발주 전송됨
--   'processing': 공방에서 처리 중
--   'shipped': 공방에서 발송 완료
--   'completed': 배송 완료
