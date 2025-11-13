import { Hono } from 'hono';
import type { Bindings } from '../types';

const workshops = new Hono<{ Bindings: Bindings }>();

// 모든 워크샵 목록 조회
workshops.get('/', async (c) => {
  try {
    const limit = c.req.query('limit') || '10';
    
    const result = await c.env.DB.prepare(
      `SELECT w.*, u.name as provider_name 
       FROM workshops w
       JOIN users u ON w.provider_id = u.id
       WHERE w.is_active = 1
       ORDER BY w.created_at DESC
       LIMIT ?`
    ).bind(parseInt(limit)).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('워크샵 목록 조회 오류:', error);
    return c.json({ error: '워크샵 목록 조회 실패', details: error.message }, 500);
  }
});

// 내 워크샵 목록 조회 (B2B)
workshops.get('/my', async (c) => {
  try {
    // TODO: JWT 토큰에서 사용자 ID 추출
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    // 임시로 토큰 파싱 (실제로는 JWT 검증 필요)
    const token = authHeader.replace('Bearer ', '');
    // JWT 디코딩하여 user_id 가져오기 (간단한 구현)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    const result = await c.env.DB.prepare(
      `SELECT * FROM workshops 
       WHERE provider_id = ?
       ORDER BY created_at DESC`
    ).bind(userId).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('내 워크샵 조회 오류:', error);
    return c.json({ error: '워크샵 조회 실패', details: error.message }, 500);
  }
});

// 워크샵 상세 조회
workshops.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const workshop = await c.env.DB.prepare(
      `SELECT w.*, u.name as provider_name, u.phone as provider_phone
       FROM workshops w
       JOIN users u ON w.provider_id = u.id
       WHERE w.id = ?`
    ).bind(id).first();
    
    if (!workshop) {
      return c.json({ error: '워크샵을 찾을 수 없습니다' }, 404);
    }
    
    return c.json(workshop);
    
  } catch (error: any) {
    console.error('워크샵 상세 조회 오류:', error);
    return c.json({ error: '워크샵 조회 실패', details: error.message }, 500);
  }
});

// 워크샵 생성 (B2B)
workshops.post('/', async (c) => {
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
      title,
      description,
      category,
      location,
      address,
      price,
      duration,
      max_participants,
      image_url
    } = data;
    
    const result = await c.env.DB.prepare(
      `INSERT INTO workshops (
        provider_id, title, description, category, location, address,
        price, duration, max_participants, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId,
      title,
      description || null,
      category || null,
      location,
      address || null,
      price || null,
      duration || null,
      max_participants || null,
      image_url || null
    ).run();
    
    return c.json({
      message: '워크샵이 등록되었습니다',
      id: result.meta.last_row_id
    }, 201);
    
  } catch (error: any) {
    console.error('워크샵 생성 오류:', error);
    return c.json({ error: '워크샵 등록 실패', details: error.message }, 500);
  }
});

// 워크샵 수정 (B2B)
workshops.put('/:id', async (c) => {
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
    
    // 권한 확인
    const workshop = await c.env.DB.prepare(
      'SELECT provider_id FROM workshops WHERE id = ?'
    ).bind(id).first();
    
    if (!workshop || workshop.provider_id !== userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    const {
      title,
      description,
      category,
      location,
      address,
      price,
      duration,
      max_participants,
      image_url,
      is_active
    } = data;
    
    await c.env.DB.prepare(
      `UPDATE workshops SET
        title = ?, description = ?, category = ?, location = ?, address = ?,
        price = ?, duration = ?, max_participants = ?, image_url = ?, is_active = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      title,
      description,
      category,
      location,
      address,
      price,
      duration,
      max_participants,
      image_url,
      is_active ?? 1,
      id
    ).run();
    
    return c.json({ message: '워크샵이 수정되었습니다' });
    
  } catch (error: any) {
    console.error('워크샵 수정 오류:', error);
    return c.json({ error: '워크샵 수정 실패', details: error.message }, 500);
  }
});

// 워크샵 삭제 (B2B)
workshops.delete('/:id', async (c) => {
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
    const workshop = await c.env.DB.prepare(
      'SELECT provider_id FROM workshops WHERE id = ?'
    ).bind(id).first();
    
    if (!workshop || workshop.provider_id !== userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    // 실제 삭제 대신 비활성화
    await c.env.DB.prepare(
      'UPDATE workshops SET is_active = 0 WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ message: '워크샵이 삭제되었습니다' });
    
  } catch (error: any) {
    console.error('워크샵 삭제 오류:', error);
    return c.json({ error: '워크샵 삭제 실패', details: error.message }, 500);
  }
});

export default workshops;
