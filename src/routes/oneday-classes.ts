import { Hono } from 'hono';
import type { Bindings } from '../types';

const onedayClasses = new Hono<{ Bindings: Bindings }>();

// 모든 원데이 클래스 목록 조회
onedayClasses.get('/', async (c) => {
  try {
    const limit = c.req.query('limit') || '50';
    const provider = c.req.query('provider'); // 'google', 'naver', 'kakao'
    
    let query = `SELECT oc.*, u.name as provider_name 
       FROM oneday_classes oc
       LEFT JOIN users u ON oc.provider_id = u.id
       WHERE oc.is_active = 1`;
    
    // provider 파라미터는 필터링에 사용하지 않음 (모든 클래스 표시)
    // 향후 필요시 google_place_id, naver_place_id, kakao_place_id로 필터링 가능
    
    query += ` ORDER BY oc.created_at DESC LIMIT ?`;
    
    const result = await c.env.DB.prepare(query).bind(parseInt(limit)).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('원데이 클래스 목록 조회 오류:', error);
    return c.json({ error: '원데이 클래스 목록 조회 실패', details: error.message }, 500);
  }
});

// 내 원데이 클래스 목록 조회 (B2B 공방 운영자)
onedayClasses.get('/my', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    const result = await c.env.DB.prepare(
      `SELECT * FROM oneday_classes 
       WHERE provider_id = ?
       ORDER BY created_at DESC`
    ).bind(userId).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('내 원데이 클래스 조회 오류:', error);
    return c.json({ error: '원데이 클래스 조회 실패', details: error.message }, 500);
  }
});

// 원데이 클래스 상세 조회
onedayClasses.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const classItem = await c.env.DB.prepare(
      `SELECT oc.*, u.name as provider_name, u.phone as provider_phone
       FROM oneday_classes oc
       JOIN users u ON oc.provider_id = u.id
       WHERE oc.id = ?`
    ).bind(id).first();
    
    if (!classItem) {
      return c.json({ error: '원데이 클래스를 찾을 수 없습니다' }, 404);
    }
    
    return c.json(classItem);
    
  } catch (error: any) {
    console.error('원데이 클래스 상세 조회 오류:', error);
    return c.json({ error: '원데이 클래스 조회 실패', details: error.message }, 500);
  }
});

// 원데이 클래스 생성 (B2B 공방 운영자)
onedayClasses.post('/', async (c) => {
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
      studio_name,
      instructor_name,
      price,
      duration,
      max_participants,
      image_url,
      naver_place_id,
      kakao_place_id,
      google_place_id
    } = data;
    
    const result = await c.env.DB.prepare(
      `INSERT INTO oneday_classes (
        provider_id, title, description, category, location, address,
        studio_name, instructor_name, price, duration, max_participants, image_url,
        naver_place_id, kakao_place_id, google_place_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId,
      title,
      description || null,
      category || null,
      location,
      address || null,
      studio_name || null,
      instructor_name || null,
      price || null,
      duration || null,
      max_participants || null,
      image_url || null,
      naver_place_id || null,
      kakao_place_id || null,
      google_place_id || null
    ).run();
    
    return c.json({
      message: '원데이 클래스가 등록되었습니다',
      id: result.meta.last_row_id
    }, 201);
    
  } catch (error: any) {
    console.error('원데이 클래스 생성 오류:', error);
    return c.json({ error: '원데이 클래스 등록 실패', details: error.message }, 500);
  }
});

// 원데이 클래스 수정 (B2B 공방 운영자)
onedayClasses.put('/:id', async (c) => {
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
    const classItem = await c.env.DB.prepare(
      'SELECT provider_id FROM oneday_classes WHERE id = ?'
    ).bind(id).first();
    
    if (!classItem || classItem.provider_id !== userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    const {
      title,
      description,
      category,
      location,
      address,
      studio_name,
      instructor_name,
      price,
      duration,
      max_participants,
      image_url,
      naver_place_id,
      kakao_place_id,
      google_place_id,
      is_active
    } = data;
    
    await c.env.DB.prepare(
      `UPDATE oneday_classes SET
        title = ?, description = ?, category = ?, location = ?, address = ?,
        studio_name = ?, instructor_name = ?, price = ?, duration = ?, max_participants = ?,
        image_url = ?, naver_place_id = ?, kakao_place_id = ?, google_place_id = ?,
        is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      title,
      description,
      category,
      location,
      address,
      studio_name,
      instructor_name,
      price,
      duration,
      max_participants,
      image_url,
      naver_place_id,
      kakao_place_id,
      google_place_id,
      is_active ?? 1,
      id
    ).run();
    
    return c.json({ message: '원데이 클래스가 수정되었습니다' });
    
  } catch (error: any) {
    console.error('원데이 클래스 수정 오류:', error);
    return c.json({ error: '원데이 클래스 수정 실패', details: error.message }, 500);
  }
});

// 원데이 클래스 삭제 (B2B 공방 운영자)
onedayClasses.delete('/:id', async (c) => {
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
    const classItem = await c.env.DB.prepare(
      'SELECT provider_id FROM oneday_classes WHERE id = ?'
    ).bind(id).first();
    
    if (!classItem || classItem.provider_id !== userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    // 실제 삭제 대신 비활성화
    await c.env.DB.prepare(
      'UPDATE oneday_classes SET is_active = 0 WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ message: '원데이 클래스가 삭제되었습니다' });
    
  } catch (error: any) {
    console.error('원데이 클래스 삭제 오류:', error);
    return c.json({ error: '원데이 클래스 삭제 실패', details: error.message }, 500);
  }
});

// 제공자 정보 조회 (Public)
onedayClasses.get('/provider/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const provider = await c.env.DB.prepare(
      `SELECT id, name, email, phone, b2b_business_name, b2b_category 
       FROM users 
       WHERE id = ? AND user_type = 'B2B'`
    ).bind(id).first();
    
    if (!provider) {
      return c.json({ error: '제공자를 찾을 수 없습니다' }, 404);
    }
    
    return c.json(provider);
    
  } catch (error: any) {
    console.error('제공자 정보 조회 오류:', error);
    return c.json({ error: '제공자 정보 조회 실패', details: error.message }, 500);
  }
});

export default onedayClasses;
