import { Hono } from 'hono';
import type { Bindings } from '../types';
import { getCookie } from 'hono/cookie';
import { JWTManager } from '../lib/auth/jwt';

const reservations = new Hono<{ Bindings: Bindings }>();

// 예약 생성 API
reservations.post('/', async (c) => {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const token = getCookie(c, 'auth_token');
    if (!token) {
      return c.json({ error: '로그인이 필요합니다' }, 401);
    }

    const jwtManager = new JWTManager(c.env.JWT_SECRET);
    const payload = await jwtManager.verify(token);
    
    if (!payload || !payload.userId) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }

    const data = await c.req.json();
    const {
      class_id,
      product_id,
      reservation_type, // 'class' or 'product'
      reservation_date,
      reservation_time,
      participants,
      contact_name,
      contact_phone,
      contact_email,
      special_request
    } = data;

    // 유효성 검사
    if (!reservation_type || !['class', 'product'].includes(reservation_type)) {
      return c.json({ error: '예약 유형이 올바르지 않습니다' }, 400);
    }

    if (reservation_type === 'class' && !class_id) {
      return c.json({ error: '클래스 ID가 필요합니다' }, 400);
    }

    if (reservation_type === 'product' && !product_id) {
      return c.json({ error: '상품 ID가 필요합니다' }, 400);
    }

    if (!reservation_date || !reservation_time) {
      return c.json({ error: '예약 날짜와 시간이 필요합니다' }, 400);
    }

    if (!contact_name || !contact_phone) {
      return c.json({ error: '연락처 정보가 필요합니다' }, 400);
    }

    // 예약 생성
    const result = await c.env.DB.prepare(`
      INSERT INTO reservations (
        user_id, class_id, product_id, reservation_type,
        reservation_date, reservation_time, participants,
        contact_name, contact_phone, contact_email, special_request,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      payload.userId,
      class_id || null,
      product_id || null,
      reservation_type,
      reservation_date,
      reservation_time,
      participants || 1,
      contact_name,
      contact_phone,
      contact_email || null,
      special_request || null
    ).run();

    console.log(`✅ [Reservation] Created reservation ID: ${result.meta.last_row_id} for user ${payload.userId}`);

    // 생성된 예약 정보 반환
    const reservation = await c.env.DB.prepare(`
      SELECT r.*, 
        oc.title as class_title,
        p.name as product_name
      FROM reservations r
      LEFT JOIN oneday_classes oc ON r.class_id = oc.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.id = ?
    `).bind(result.meta.last_row_id).first();

    return c.json({
      success: true,
      reservation_id: result.meta.last_row_id,
      reservation: reservation,
      // 네이버 캘린더 연동을 위한 정보
      calendar_data: {
        title: reservation_type === 'class' 
          ? `${(reservation as any).class_title} 예약` 
          : `${(reservation as any).product_name} 예약`,
        date: reservation_date,
        time: reservation_time,
        participants: participants || 1
      }
    }, 201);

  } catch (error: any) {
    console.error('❌ [Reservation] Error creating reservation:', error);
    return c.json({ 
      error: '예약 생성 실패', 
      details: error.message 
    }, 500);
  }
});

// 내 예약 목록 조회
reservations.get('/my', async (c) => {
  try {
    const token = getCookie(c, 'auth_token');
    if (!token) {
      return c.json({ error: '로그인이 필요합니다' }, 401);
    }

    const jwtManager = new JWTManager(c.env.JWT_SECRET);
    const payload = await jwtManager.verify(token);
    
    if (!payload || !payload.userId) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }

    const result = await c.env.DB.prepare(`
      SELECT r.*,
        oc.title as class_title,
        oc.location as class_location,
        oc.address as class_address,
        p.name as product_name
      FROM reservations r
      LEFT JOIN oneday_classes oc ON r.class_id = oc.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).bind(payload.userId).all();

    return c.json(result.results);

  } catch (error: any) {
    console.error('❌ [Reservation] Error fetching reservations:', error);
    return c.json({ 
      error: '예약 목록 조회 실패', 
      details: error.message 
    }, 500);
  }
});

// 예약 취소
reservations.put('/:id/cancel', async (c) => {
  try {
    const token = getCookie(c, 'auth_token');
    if (!token) {
      return c.json({ error: '로그인이 필요합니다' }, 401);
    }

    const jwtManager = new JWTManager(c.env.JWT_SECRET);
    const payload = await jwtManager.verify(token);
    
    if (!payload || !payload.userId) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }

    const reservationId = c.req.param('id');

    // 예약 소유자 확인
    const reservation = await c.env.DB.prepare(
      'SELECT user_id FROM reservations WHERE id = ?'
    ).bind(reservationId).first<{ user_id: number }>();

    if (!reservation) {
      return c.json({ error: '예약을 찾을 수 없습니다' }, 404);
    }

    if (reservation.user_id !== payload.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }

    // 예약 취소 처리
    await c.env.DB.prepare(`
      UPDATE reservations 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(reservationId).run();

    console.log(`✅ [Reservation] Cancelled reservation ID: ${reservationId}`);

    return c.json({ success: true, message: '예약이 취소되었습니다' });

  } catch (error: any) {
    console.error('❌ [Reservation] Error cancelling reservation:', error);
    return c.json({ 
      error: '예약 취소 실패', 
      details: error.message 
    }, 500);
  }
});

export default reservations;
