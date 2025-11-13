import { Hono } from 'hono';
import type { Bindings } from '../types';

const activity = new Hono<{ Bindings: Bindings }>();

/**
 * 사용자 행동 로깅 API
 * 
 * Activity Types:
 * - view: 조회 (워크샵 상세 페이지 방문)
 * - search: 검색 (워크샵 검색)
 * - filter: 필터링 (카테고리/가격 필터)
 * - booking: 예약 시도/완료
 * - review: 리뷰 작성
 * - click: 클릭 이벤트
 */

// 행동 로그 기록
activity.post('/log', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    let userId = null;
    
    // 로그인한 사용자인 경우 user_id 추출
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
      } catch (e) {
        // 토큰 파싱 실패 시 익명 사용자로 처리
        console.warn('Token parse failed, logging as anonymous user');
      }
    }
    
    const data = await c.req.json();
    const {
      activity_type,
      target_type,
      target_id,
      metadata
    } = data;
    
    // 필수 필드 검증
    if (!activity_type) {
      return c.json({ error: 'activity_type은 필수입니다' }, 400);
    }
    
    // metadata를 JSON 문자열로 변환
    const metadataStr = metadata ? JSON.stringify(metadata) : null;
    
    const result = await c.env.DB.prepare(
      `INSERT INTO user_activity_logs (user_id, activity_type, target_type, target_id, metadata)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      userId,
      activity_type,
      target_type || null,
      target_id || null,
      metadataStr
    ).run();
    
    return c.json({
      message: '행동 로그가 기록되었습니다',
      id: result.meta.last_row_id
    }, 201);
    
  } catch (error: any) {
    console.error('행동 로그 기록 오류:', error);
    return c.json({ error: '행동 로그 기록 실패', details: error.message }, 500);
  }
});

// 사용자별 행동 통계 조회
activity.get('/stats', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    // 활동 타입별 카운트
    const activityCounts = await c.env.DB.prepare(
      `SELECT activity_type, COUNT(*) as count
       FROM user_activity_logs
       WHERE user_id = ?
       GROUP BY activity_type`
    ).bind(userId).all();
    
    // 최근 조회한 워크샵 (중복 제거)
    const recentViews = await c.env.DB.prepare(
      `SELECT DISTINCT target_id, MAX(created_at) as last_viewed
       FROM user_activity_logs
       WHERE user_id = ? AND activity_type = 'view' AND target_type = 'workshop'
       GROUP BY target_id
       ORDER BY last_viewed DESC
       LIMIT 10`
    ).bind(userId).all();
    
    // 검색 키워드 통계
    const searchKeywords = await c.env.DB.prepare(
      `SELECT metadata, COUNT(*) as count
       FROM user_activity_logs
       WHERE user_id = ? AND activity_type = 'search'
       GROUP BY metadata
       ORDER BY count DESC
       LIMIT 10`
    ).bind(userId).all();
    
    return c.json({
      activity_counts: activityCounts.results,
      recent_views: recentViews.results,
      search_keywords: searchKeywords.results.map((row: any) => ({
        keyword: row.metadata ? JSON.parse(row.metadata).keyword : null,
        count: row.count
      }))
    });
    
  } catch (error: any) {
    console.error('통계 조회 오류:', error);
    return c.json({ error: '통계 조회 실패', details: error.message }, 500);
  }
});

// 인기 워크샵 (전체 사용자)
activity.get('/popular-workshops', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    
    const result = await c.env.DB.prepare(
      `SELECT 
         target_id as workshop_id,
         COUNT(*) as view_count,
         COUNT(DISTINCT user_id) as unique_viewers
       FROM user_activity_logs
       WHERE activity_type = 'view' 
         AND target_type = 'workshop'
         AND target_id IS NOT NULL
         AND created_at >= datetime('now', '-30 days')
       GROUP BY target_id
       ORDER BY view_count DESC
       LIMIT ?`
    ).bind(limit).all();
    
    // 워크샵 정보 가져오기
    const workshopIds = result.results.map((row: any) => row.workshop_id);
    
    if (workshopIds.length === 0) {
      return c.json([]);
    }
    
    const placeholders = workshopIds.map(() => '?').join(',');
    const workshops = await c.env.DB.prepare(
      `SELECT id, title, category, location, price
       FROM workshops
       WHERE id IN (${placeholders}) AND is_active = 1`
    ).bind(...workshopIds).all();
    
    // 통계와 워크샵 정보 결합
    const popularWorkshops = result.results.map((stat: any) => {
      const workshop = workshops.results.find((w: any) => w.id === stat.workshop_id);
      return {
        ...workshop,
        view_count: stat.view_count,
        unique_viewers: stat.unique_viewers
      };
    }).filter(w => w.id); // workshop이 없는 경우 제외
    
    return c.json(popularWorkshops);
    
  } catch (error: any) {
    console.error('인기 워크샵 조회 오류:', error);
    return c.json({ error: '인기 워크샵 조회 실패', details: error.message }, 500);
  }
});

// 사용자 추천 워크샵 (행동 기반)
activity.get('/recommendations', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    // 사용자가 최근에 본 워크샵들의 카테고리 추출
    const viewedCategories = await c.env.DB.prepare(
      `SELECT DISTINCT w.category
       FROM user_activity_logs l
       JOIN workshops w ON l.target_id = w.id
       WHERE l.user_id = ? 
         AND l.activity_type = 'view' 
         AND l.target_type = 'workshop'
         AND w.category IS NOT NULL
       ORDER BY l.created_at DESC
       LIMIT 5`
    ).bind(userId).all();
    
    if (viewedCategories.results.length === 0) {
      // 조회 기록이 없으면 인기 워크샵 반환
      return c.json({ 
        recommendations: [],
        reason: 'no_history'
      });
    }
    
    const categories = viewedCategories.results.map((row: any) => row.category);
    
    // 이미 본 워크샵 ID 목록
    const viewedWorkshopIds = await c.env.DB.prepare(
      `SELECT DISTINCT target_id
       FROM user_activity_logs
       WHERE user_id = ? 
         AND activity_type = 'view' 
         AND target_type = 'workshop'
         AND target_id IS NOT NULL`
    ).bind(userId).all();
    
    const viewedIds = viewedWorkshopIds.results.map((row: any) => row.target_id);
    
    // 같은 카테고리의 다른 워크샵 추천 (아직 안 본 것)
    const placeholders = categories.map(() => '?').join(',');
    const excludePlaceholders = viewedIds.length > 0 ? viewedIds.map(() => '?').join(',') : '0';
    
    const query = viewedIds.length > 0 ?
      `SELECT id, title, category, location, price, description
       FROM workshops
       WHERE category IN (${placeholders})
         AND id NOT IN (${excludePlaceholders})
         AND is_active = 1
       ORDER BY created_at DESC
       LIMIT 10` :
      `SELECT id, title, category, location, price, description
       FROM workshops
       WHERE category IN (${placeholders})
         AND is_active = 1
       ORDER BY created_at DESC
       LIMIT 10`;
    
    const bindings = viewedIds.length > 0 ? [...categories, ...viewedIds] : categories;
    const recommendations = await c.env.DB.prepare(query).bind(...bindings).all();
    
    return c.json({
      recommendations: recommendations.results,
      reason: 'category_based',
      based_on_categories: categories
    });
    
  } catch (error: any) {
    console.error('추천 워크샵 조회 오류:', error);
    return c.json({ error: '추천 워크샵 조회 실패', details: error.message }, 500);
  }
});

// 관리자용: 전체 활동 로그 조회
activity.get('/admin/all', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    // TODO: 관리자 권한 확인 로직 추가
    
    const limit = parseInt(c.req.query('limit') || '100');
    const activityType = c.req.query('activity_type');
    
    let query = `
      SELECT l.*, u.name as user_name, u.email as user_email
      FROM user_activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
    `;
    
    const bindings: any[] = [];
    
    if (activityType) {
      query += ' WHERE l.activity_type = ?';
      bindings.push(activityType);
    }
    
    query += ' ORDER BY l.created_at DESC LIMIT ?';
    bindings.push(limit);
    
    const result = await c.env.DB.prepare(query).bind(...bindings).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('활동 로그 조회 오류:', error);
    return c.json({ error: '활동 로그 조회 실패', details: error.message }, 500);
  }
});

export default activity;
