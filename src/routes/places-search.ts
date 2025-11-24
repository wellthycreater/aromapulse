import { Hono } from 'hono';
import type { Bindings } from '../types';

const placesSearch = new Hono<{ Bindings: Bindings }>();

// Google Maps Places API를 사용하여 공방 검색
placesSearch.post('/search', async (c) => {
  try {
    const { GOOGLE_MAPS_API_KEY } = c.env as Bindings;
    
    if (!GOOGLE_MAPS_API_KEY) {
      return c.json({ error: 'Google Maps API Key가 설정되지 않았습니다.' }, 500);
    }

    const { query, location, radius } = await c.req.json();
    
    // 기본값 설정
    const searchQuery = query || '아로마 공방 향수 만들기 캔들 클래스';
    const searchLocation = location || '37.5665,126.9780'; // 서울 중심
    const searchRadius = radius || 50000; // 50km

    // Google Places API Text Search 호출
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${searchLocation}&radius=${searchRadius}&language=ko&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(placesUrl);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API Error:', data);
      return c.json({ 
        error: 'Places API 오류', 
        details: data.status,
        message: data.error_message 
      }, 500);
    }

    // 결과 필터링 및 정제
    const results = (data.results || []).map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: place.geometry.location,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      businessStatus: place.business_status,
      photos: place.photos ? place.photos.slice(0, 3).map((photo: any) => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) : []
    }));

    return c.json({
      success: true,
      count: results.length,
      results,
      nextPageToken: data.next_page_token
    });

  } catch (error: any) {
    console.error('공방 검색 오류:', error);
    return c.json({ error: '공방 검색 실패', details: error.message }, 500);
  }
});

// Place ID로 상세 정보 가져오기
placesSearch.get('/details/:placeId', async (c) => {
  try {
    const { GOOGLE_MAPS_API_KEY } = c.env as Bindings;
    const placeId = c.req.param('placeId');

    if (!GOOGLE_MAPS_API_KEY) {
      return c.json({ error: 'Google Maps API Key가 설정되지 않았습니다.' }, 500);
    }

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,opening_hours,website,rating,user_ratings_total,geometry,photos,types,business_status&language=ko&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (data.status !== 'OK') {
      return c.json({ 
        error: 'Place Details API 오류', 
        details: data.status 
      }, 500);
    }

    const place = data.result;
    
    return c.json({
      success: true,
      place: {
        placeId: placeId, // Use the placeId parameter directly
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number,
        website: place.website,
        location: place.geometry.location,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        openingHours: place.opening_hours,
        types: place.types,
        businessStatus: place.business_status,
        photos: place.photos ? place.photos.slice(0, 5).map((photo: any) => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height
        })) : []
      }
    });

  } catch (error: any) {
    console.error('공방 상세 정보 조회 오류:', error);
    return c.json({ error: '상세 정보 조회 실패', details: error.message }, 500);
  }
});

// 검색된 공방을 D1에 임시 저장 (관리자 승인 대기)
placesSearch.post('/save', async (c) => {
  try {
    const { DB } = c.env as Bindings;
    const { 
      placeId, 
      name, 
      address, 
      latitude, 
      longitude, 
      phone, 
      website,
      rating,
      userRatingsTotal,
      photoReference 
    } = await c.req.json();

    // 이미 등록된 공방인지 확인
    const existing = await DB.prepare(
      `SELECT id FROM oneday_classes WHERE google_place_id = ?`
    ).bind(placeId).first();

    if (existing) {
      return c.json({ 
        success: false, 
        message: '이미 등록된 공방입니다.',
        existingId: existing.id 
      });
    }

    // 임시 공방 정보 저장 (is_active = 0으로 관리자 승인 대기)
    // provider_id = 1 (시스템 자동 등록)
    const result = await DB.prepare(`
      INSERT INTO oneday_classes (
        provider_id, 
        title, 
        description, 
        category,
        location, 
        address,
        studio_name,
        price,
        duration,
        max_participants,
        image_url,
        google_place_id,
        latitude,
        longitude,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).bind(
      1, // 시스템 자동 등록 provider_id
      name,
      `Google Maps에서 검색된 공방입니다. 관리자 승인 후 상세 정보를 입력해주세요.\n\n평점: ${rating || 'N/A'} (${userRatingsTotal || 0}개 리뷰)`,
      '아로마테라피', // 기본 카테고리
      address.split(' ').slice(0, 2).join(' '), // 시/구 추출
      address,
      name,
      50000, // 기본 가격
      120, // 기본 2시간
      8, // 기본 8명
      photoReference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=GOOGLE_MAPS_API_KEY` : null,
      placeId,
      latitude,
      longitude
    ).run();

    return c.json({
      success: true,
      classId: result.meta.last_row_id,
      message: '공방 정보가 저장되었습니다. 관리자 승인 후 활성화됩니다.'
    });

  } catch (error: any) {
    console.error('공방 저장 오류:', error);
    return c.json({ error: '공방 저장 실패', details: error.message }, 500);
  }
});

// 관리자: 대기 중인 공방 목록 조회
placesSearch.get('/pending', async (c) => {
  try {
    const { DB } = c.env as Bindings;

    const result = await DB.prepare(`
      SELECT 
        id, title, address, google_place_id, 
        latitude, longitude, created_at
      FROM oneday_classes 
      WHERE is_active = 0 AND google_place_id IS NOT NULL
      ORDER BY created_at DESC
    `).all();

    return c.json({
      success: true,
      count: result.results.length,
      pendingClasses: result.results
    });

  } catch (error: any) {
    console.error('대기 중인 공방 조회 오류:', error);
    return c.json({ error: '조회 실패', details: error.message }, 500);
  }
});

// 관리자: 공방 승인
placesSearch.post('/approve/:id', async (c) => {
  try {
    const { DB } = c.env as Bindings;
    const classId = c.req.param('id');

    await DB.prepare(`
      UPDATE oneday_classes 
      SET is_active = 1, updated_at = datetime('now')
      WHERE id = ?
    `).bind(classId).run();

    return c.json({
      success: true,
      message: '공방이 승인되었습니다.'
    });

  } catch (error: any) {
    console.error('공방 승인 오류:', error);
    return c.json({ error: '승인 실패', details: error.message }, 500);
  }
});

export default placesSearch;
