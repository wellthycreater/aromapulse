import { Hono } from 'hono';
import type { Bindings } from '../types';

const reviews_api = new Hono<{ Bindings: Bindings }>();

// 내 리뷰 목록 조회
reviews_api.get('/my', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    const result = await c.env.DB.prepare(
      `SELECT r.*, w.title as workshop_title
       FROM reviews r
       JOIN workshops w ON r.workshop_id = w.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`
    ).bind(userId).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('리뷰 조회 오류:', error);
    return c.json({ error: '리뷰 조회 실패', details: error.message }, 500);
  }
});

// 워크샵별 리뷰 목록 조회
reviews_api.get('/workshop/:id', async (c) => {
  try {
    const workshopId = c.req.param('id');
    
    const result = await c.env.DB.prepare(
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.workshop_id = ?
       ORDER BY r.created_at DESC`
    ).bind(workshopId).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('워크샵 리뷰 조회 오류:', error);
    return c.json({ error: '리뷰 조회 실패', details: error.message }, 500);
  }
});

// 리뷰 작성
reviews_api.post('/', async (c) => {
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
      booking_id,
      rating,
      comment
    } = data;
    
    // 예약 확인 (예약한 워크샵에만 리뷰 작성 가능)
    if (booking_id) {
      const booking = await c.env.DB.prepare(
        'SELECT id FROM bookings WHERE id = ? AND user_id = ? AND status = ?'
      ).bind(booking_id, userId, 'completed').first();
      
      if (!booking) {
        return c.json({ error: '완료된 예약에만 리뷰를 작성할 수 있습니다' }, 400);
      }
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO reviews (workshop_id, user_id, booking_id, rating, comment, source)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      workshop_id,
      userId,
      booking_id || null,
      rating,
      comment || null,
      'platform'
    ).run();
    
    return c.json({
      message: '리뷰가 작성되었습니다',
      id: result.meta.last_row_id
    }, 201);
    
  } catch (error: any) {
    console.error('리뷰 작성 오류:', error);
    return c.json({ error: '리뷰 작성 실패', details: error.message }, 500);
  }
});

// 리뷰 수정
reviews_api.put('/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    const id = c.req.param('id');
    const data = await c.req.json();
    const { rating, comment } = data;
    
    // 권한 확인
    const review = await c.env.DB.prepare(
      'SELECT user_id FROM reviews WHERE id = ?'
    ).bind(id).first();
    
    if (!review || review.user_id !== userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    await c.env.DB.prepare(
      'UPDATE reviews SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(rating, comment, id).run();
    
    return c.json({ message: '리뷰가 수정되었습니다' });
    
  } catch (error: any) {
    console.error('리뷰 수정 오류:', error);
    return c.json({ error: '리뷰 수정 실패', details: error.message }, 500);
  }
});

// 리뷰 삭제
reviews_api.delete('/:id', async (c) => {
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
    const review = await c.env.DB.prepare(
      'SELECT user_id FROM reviews WHERE id = ?'
    ).bind(id).first();
    
    if (!review || review.user_id !== userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    await c.env.DB.prepare(
      'DELETE FROM reviews WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ message: '리뷰가 삭제되었습니다' });
    
  } catch (error: any) {
    console.error('리뷰 삭제 오류:', error);
    return c.json({ error: '리뷰 삭제 실패', details: error.message }, 500);
  }
});

export default reviews_api;
