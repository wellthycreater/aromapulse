import { Hono } from 'hono';
import type { Bindings } from '../types';

const bookings = new Hono<{ Bindings: Bindings }>();

// 내 예약 목록 조회 (B2C)
bookings.get('/my', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    const result = await c.env.DB.prepare(
      `SELECT b.*, w.title as workshop_title, w.location, w.duration
       FROM bookings b
       JOIN workshops w ON b.workshop_id = w.id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`
    ).bind(userId).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('예약 조회 오류:', error);
    return c.json({ error: '예약 조회 실패', details: error.message }, 500);
  }
});

// 워크샵 제공자의 예약 현황 조회 (B2B)
bookings.get('/provider', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const providerId = payload.userId;
    
    const limit = c.req.query('limit') || '10';
    
    const result = await c.env.DB.prepare(
      `SELECT b.*, w.title as workshop_title, u.name as user_name, u.phone as user_phone
       FROM bookings b
       JOIN workshops w ON b.workshop_id = w.id
       JOIN users u ON b.user_id = u.id
       WHERE w.provider_id = ?
       ORDER BY b.booking_date DESC
       LIMIT ?`
    ).bind(providerId, parseInt(limit)).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('예약 현황 조회 오류:', error);
    return c.json({ error: '예약 현황 조회 실패', details: error.message }, 500);
  }
});

// 예약 생성 (B2C)
bookings.post('/', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    const data = await c.req.json();
    const {
      workshop_id,
      booking_date,
      participants,
      total_price
    } = data;
    
    // 워크샵 존재 확인
    const workshop = await c.env.DB.prepare(
      'SELECT id, max_participants FROM workshops WHERE id = ? AND is_active = 1'
    ).bind(workshop_id).first();
    
    if (!workshop) {
      return c.json({ error: '워크샵을 찾을 수 없습니다' }, 404);
    }
    
    // 정원 확인
    if (workshop.max_participants && participants > workshop.max_participants) {
      return c.json({ error: '최대 참가 인원을 초과했습니다' }, 400);
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO bookings (workshop_id, user_id, booking_date, participants, total_price, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      workshop_id,
      userId,
      booking_date,
      participants || 1,
      total_price,
      'pending'
    ).run();
    
    return c.json({
      message: '예약이 신청되었습니다',
      id: result.meta.last_row_id
    }, 201);
    
  } catch (error: any) {
    console.error('예약 생성 오류:', error);
    return c.json({ error: '예약 신청 실패', details: error.message }, 500);
  }
});

// 예약 상태 업데이트 (B2B)
bookings.patch('/:id/status', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const providerId = payload.userId;
    
    const id = c.req.param('id');
    const { status } = await c.req.json();
    
    // 권한 확인
    const booking = await c.env.DB.prepare(
      `SELECT b.id FROM bookings b
       JOIN workshops w ON b.workshop_id = w.id
       WHERE b.id = ? AND w.provider_id = ?`
    ).bind(id, providerId).first();
    
    if (!booking) {
      return c.json({ error: '권한이 없거나 예약을 찾을 수 없습니다' }, 403);
    }
    
    await c.env.DB.prepare(
      'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(status, id).run();
    
    return c.json({ message: '예약 상태가 업데이트되었습니다' });
    
  } catch (error: any) {
    console.error('예약 상태 업데이트 오류:', error);
    return c.json({ error: '예약 상태 업데이트 실패', details: error.message }, 500);
  }
});

// 예약 취소 (B2C)
bookings.delete('/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    const id = c.req.param('id');
    
    // 권한 확인
    const booking = await c.env.DB.prepare(
      'SELECT user_id, status FROM bookings WHERE id = ?'
    ).bind(id).first();
    
    if (!booking || booking.user_id !== userId) {
      return c.json({ error: '권한이 없거나 예약을 찾을 수 없습니다' }, 403);
    }
    
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return c.json({ error: '취소할 수 없는 예약입니다' }, 400);
    }
    
    await c.env.DB.prepare(
      'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind('cancelled', id).run();
    
    return c.json({ message: '예약이 취소되었습니다' });
    
  } catch (error: any) {
    console.error('예약 취소 오류:', error);
    return c.json({ error: '예약 취소 실패', details: error.message }, 500);
  }
});

export default bookings;
