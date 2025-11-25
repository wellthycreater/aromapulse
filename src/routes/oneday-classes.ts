import { Hono } from 'hono';
import type { Bindings } from '../types';
import { filterByOAuthProvider, type OAuthProvider } from '../utils/oauth-filter';
import { calculateDistance } from '../utils/geocoding';
import { getCookie } from 'hono/cookie';
import { JWTManager } from '../lib/auth/jwt';

const onedayClasses = new Hono<{ Bindings: Bindings }>();

// 모든 원데이 클래스 목록 조회
onedayClasses.get('/', async (c) => {
  try {
    const limit = c.req.query('limit') || '50';
    const provider = c.req.query('provider') as OAuthProvider | undefined; // 'google', 'naver', 'kakao'
    const nearby = c.req.query('nearby') === 'true'; // 위치 기반 필터링 활성화
    const maxDistance = parseFloat(c.req.query('maxDistance') || '50'); // 기본 50km
    
    let query = `SELECT oc.*, u.name as provider_name 
       FROM oneday_classes oc
       LEFT JOIN users u ON oc.provider_id = u.id
       WHERE oc.is_active = 1`;
    
    query += ` ORDER BY oc.created_at DESC LIMIT ?`;
    
    const result = await c.env.DB.prepare(query).bind(parseInt(limit)).all();
    
    let classes = result.results as any[];
    
    // 위치 기반 필터링이 활성화된 경우
    if (nearby) {
      try {
        // JWT 토큰에서 사용자 ID 추출
        const token = getCookie(c, 'auth_token');
        if (token) {
          const jwtManager = new JWTManager(c.env.JWT_SECRET);
          const payload = await jwtManager.verify(token);
          
          if (payload && payload.userId) {
            // 사용자 좌표 조회
            const user = await c.env.DB.prepare(
              'SELECT user_latitude, user_longitude FROM users WHERE id = ?'
            ).bind(payload.userId).first<{ user_latitude: number | null; user_longitude: number | null }>();
            
            if (user && user.user_latitude && user.user_longitude) {
              console.log(`🗺️ [Location Filter] User location: lat=${user.user_latitude}, lng=${user.user_longitude}, maxDistance=${maxDistance}km`);
              
              // 거리 계산 및 필터링
              classes = classes.filter(classItem => {
                if (!classItem.latitude || !classItem.longitude) {
                  // 좌표가 없는 클래스는 제외
                  return false;
                }
                
                const distance = calculateDistance(
                  user.user_latitude!,
                  user.user_longitude!,
                  classItem.latitude,
                  classItem.longitude
                );
                
                // 거리 정보를 클래스 객체에 추가
                classItem.distance = parseFloat(distance.toFixed(2));
                
                return distance <= maxDistance;
              });
              
              // 거리순으로 정렬
              classes.sort((a, b) => (a.distance || 0) - (b.distance || 0));
              
              console.log(`🗺️ [Location Filter] Found ${classes.length} classes within ${maxDistance}km`);
            } else {
              console.warn('⚠️ [Location Filter] User location not available, showing all classes');
            }
          }
        } else {
          console.warn('⚠️ [Location Filter] No auth token, showing all classes');
        }
      } catch (error: any) {
        console.error('❌ [Location Filter] Error:', error);
        // 에러 발생 시 전체 목록 반환
      }
    }
    
    // OAuth 제공자별 필터링 적용 (해시 기반)
    // 카카오/구글/네이버 로그인 사용자는 각각 다른 클래스만 볼 수 있음
    const filteredResults = filterByOAuthProvider(
      classes as Array<{ id: number }>,
      provider
    );
    
    console.log(`[OAuth Filter] Provider: ${provider || 'none'}, Total: ${classes.length}, Filtered: ${filteredResults.length}`);
    
    return c.json(filteredResults);
    
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
