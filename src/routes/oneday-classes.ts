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
              
              // 사용자 지역 추출 (위도/경도 기반)
              let userRegion = '서울'; // 기본값
              
              // 인천 지역 판별 (위도: 37.3-37.6, 경도: 126.4-126.9)
              if (user.user_latitude >= 37.3 && user.user_latitude <= 37.6 &&
                  user.user_longitude >= 126.4 && user.user_longitude <= 126.9) {
                userRegion = '인천';
              }
              // 서울 지역 판별 (위도: 37.4-37.7, 경도: 126.8-127.2)
              else if (user.user_latitude >= 37.4 && user.user_latitude <= 37.7 &&
                       user.user_longitude >= 126.8 && user.user_longitude <= 127.2) {
                userRegion = '서울';
              }
              // 경기 지역 판별 (서울/인천 제외한 주변 지역)
              else if (user.user_latitude >= 37.0 && user.user_latitude <= 38.0 &&
                       user.user_longitude >= 126.5 && user.user_longitude <= 127.5) {
                userRegion = '경기';
              }
              
              console.log(`🗺️ [Location Filter] User region: ${userRegion}`);
              
              // 거리 계산 및 필터링
              const classesWithDistance: any[] = [];
              const classesWithoutLocation: any[] = [];
              
              classes.forEach(classItem => {
                if (classItem.latitude && classItem.longitude) {
                  // 좌표가 있는 경우: 거리 계산
                  const distance = calculateDistance(
                    user.user_latitude!,
                    user.user_longitude!,
                    classItem.latitude,
                    classItem.longitude
                  );
                  
                  // 50km 이내만 포함
                  if (distance <= maxDistance) {
                    classItem.distance = parseFloat(distance.toFixed(2));
                    classItem.hasLocation = true;
                    classesWithDistance.push(classItem);
                  }
                } else {
                  // 좌표가 없는 경우: 지역명으로 필터링
                  const location = (classItem.location || '').toLowerCase();
                  const address = (classItem.address || '').toLowerCase();
                  
                  // 수도권 지역 키워드
                  const regionKeywords = {
                    '인천': ['인천', '계양', '부평', '남동', '연수', '서구', '미추홀'],
                    '서울': ['서울', '강남', '강북', '강서', '강동', '마포', '용산', '송파', '서초', '관악', '동작', '종로', '중구', '성동', '광진', '동대문', '중랑', '성북', '강북', '도봉', '노원', '은평', '서대문', '양천', '구로', '금천', '영등포'],
                    '경기': ['경기', '수원', '성남', '고양', '용인', '부천', '안산', '안양', '남양주', '화성', '평택', '의정부', '시흥', '파주', '광명', '김포', '군포', '광주', '이천', '양주', '오산', '구리', '안성', '포천', '의왕', '하남', '여주', '양평', '동두천', '과천']
                  };
                  
                  // 수도권 지역 판별
                  let isNearby = false;
                  
                  // 사용자 지역과 같은 지역인지 확인
                  if (userRegion === '인천' || userRegion === '서울' || userRegion === '경기') {
                    // 인천, 서울, 경기는 모두 수도권으로 간주
                    Object.values(regionKeywords).forEach(keywords => {
                      keywords.forEach(keyword => {
                        if (location.includes(keyword) || address.includes(keyword)) {
                          isNearby = true;
                        }
                      });
                    });
                  }
                  
                  if (isNearby) {
                    classItem.distance = 999; // 좌표 없음 표시 (거리 알 수 없음)
                    classItem.hasLocation = false;
                    classesWithoutLocation.push(classItem);
                  }
                }
              });
              
              // 결과 합치기: 좌표 있는 공방(거리순) + 좌표 없는 공방(최신순)
              classes = [
                ...classesWithDistance.sort((a, b) => a.distance - b.distance),
                ...classesWithoutLocation
              ];
              
              console.log(`🗺️ [Location Filter] Found ${classesWithDistance.length} classes with location + ${classesWithoutLocation.length} classes in same region`);
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
    
    // 관리자 이메일 확인
    const ADMIN_EMAILS = [
      'admin@aromapulse.kr',
      'developer@aromapulse.kr',
      'operator@aromapulse.kr',
      'wellthykorea@gmail.com',
      'wellthy47@naver.com',
      'succeed@kakao.com'
    ];
    
    let isAdmin = false;
    
    // 사용자가 관리자인지 확인
    try {
      const token = getCookie(c, 'auth_token');
      if (token) {
        const jwtManager = new JWTManager(c.env.JWT_SECRET);
        const payload = await jwtManager.verify(token);
        
        if (payload && payload.userId) {
          const user = await c.env.DB.prepare(
            'SELECT email, user_type FROM users WHERE id = ?'
          ).bind(payload.userId).first<{ email: string; user_type: string }>();
          
          if (user) {
            isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase()) || user.user_type === 'B2B';
            console.log(`🔑 [Admin Check] User: ${user.email}, isAdmin: ${isAdmin}, user_type: ${user.user_type}`);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ [Admin Check] Failed to check admin status:', error);
    }
    
    // OAuth 제공자별 필터링 - provider_id 기반으로 완전 분리
    // 구글(provider_id=2), 네이버(provider_id=3), 카카오(provider_id=4)
    // ✅ 관리자는 모든 제공자의 데이터를 볼 수 있음
    // ✅ 일반 사용자는 위치 검색 시에도 OAuth 필터링 적용 - 각 제공자별로 완전히 다른 공방만 표시
    let filteredResults;
    
    if (isAdmin) {
      // 관리자는 모든 데이터 표시
      filteredResults = classes;
      console.log(`👑 [Admin Mode] Showing all ${classes.length} classes (no OAuth filter)`);
    } else if (provider) {
      // 일반 사용자: provider_id 매핑: google=2, naver=3, kakao=4
      const providerIdMap: { [key: string]: number } = {
        'google': 2,
        'naver': 3,
        'kakao': 4
      };
      
      const targetProviderId = providerIdMap[provider.toLowerCase()];
      
      if (targetProviderId) {
        filteredResults = classes.filter((classItem: any) => classItem.provider_id === targetProviderId);
        console.log(`[OAuth Filter] Provider: ${provider} (ID: ${targetProviderId}), Total: ${classes.length}, Filtered: ${filteredResults.length}`);
      } else {
        filteredResults = classes;
        console.log(`[OAuth Filter] Unknown provider: ${provider}, showing all ${classes.length} classes`);
      }
    } else {
      // provider 없으면 전체 반환
      filteredResults = classes;
      console.log(`[OAuth Filter] No provider specified, showing all ${classes.length} classes`);
    }
    
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
