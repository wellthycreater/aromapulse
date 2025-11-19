import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

type Bindings = {
  DB: D1Database;
};

const visitors = new Hono<{ Bindings: Bindings }>();

// 방문자 기록
visitors.post('/', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json();
    
    const {
      visitor_id,
      page_url,
      referrer,
      session_id
    } = body;
    
    if (!visitor_id) {
      return c.json({ error: 'visitor_id is required' }, 400);
    }
    
    // 현재 날짜 (UTC 기준)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // IP 주소 가져오기
    const ip_address = c.req.header('CF-Connecting-IP') || 
                      c.req.header('X-Forwarded-For') ||
                      'unknown';
    
    // User Agent 가져오기
    const user_agent = c.req.header('User-Agent') || '';
    
    // 오늘 이 visitor_id로 방문한 적이 있는지 확인
    const existingVisit = await DB.prepare(
      'SELECT id FROM visitors WHERE visitor_id = ? AND visit_date = ?'
    ).bind(visitor_id, today).first();
    
    const is_unique_today = existingVisit ? 0 : 1;
    
    // 방문 기록 삽입
    await DB.prepare(`
      INSERT INTO visitors (
        visitor_id, ip_address, user_agent, page_url, 
        referrer, visit_date, session_id, is_unique_today
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      visitor_id,
      ip_address,
      user_agent,
      page_url || '/',
      referrer || '',
      today,
      session_id || '',
      is_unique_today
    ).run();
    
    // visitor_stats 업데이트
    const stats = await DB.prepare(
      'SELECT * FROM visitor_stats WHERE stat_date = ?'
    ).bind(today).first();
    
    if (stats) {
      // 기존 통계 업데이트
      await DB.prepare(`
        UPDATE visitor_stats 
        SET total_visits = total_visits + 1,
            unique_visitors = unique_visitors + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE stat_date = ?
      `).bind(is_unique_today, today).run();
    } else {
      // 새로운 통계 생성
      await DB.prepare(`
        INSERT INTO visitor_stats (stat_date, total_visits, unique_visitors)
        VALUES (?, 1, ?)
      `).bind(today, is_unique_today).run();
    }
    
    return c.json({
      message: 'Visit recorded',
      is_unique_today
    });
    
  } catch (error) {
    console.error('방문자 기록 오류:', error);
    return c.json({ error: '방문자 기록 실패' }, 500);
  }
});

// 방문자 통계 조회
visitors.get('/stats', async (c) => {
  try {
    const { DB } = c.env;
    
    const today = new Date().toISOString().split('T')[0];
    
    // 어제 날짜 계산
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // 오늘 통계
    const todayStats = await DB.prepare(
      'SELECT * FROM visitor_stats WHERE stat_date = ?'
    ).bind(today).first();
    
    // 어제 통계
    const yesterdayStats = await DB.prepare(
      'SELECT * FROM visitor_stats WHERE stat_date = ?'
    ).bind(yesterdayStr).first();
    
    // 전체 통계
    const totalStats = await DB.prepare(`
      SELECT 
        SUM(total_visits) as total_visits,
        SUM(unique_visitors) as total_unique_visitors
      FROM visitor_stats
    `).first();
    
    // 최근 7일 통계
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    const weekStats = await DB.prepare(`
      SELECT 
        stat_date,
        total_visits,
        unique_visitors
      FROM visitor_stats
      WHERE stat_date >= ?
      ORDER BY stat_date ASC
    `).bind(sevenDaysAgoStr).all();
    
    const todayVisitors = (todayStats as any)?.unique_visitors || 0;
    const yesterdayVisitors = (yesterdayStats as any)?.unique_visitors || 0;
    const todayVisits = (todayStats as any)?.total_visits || 0;
    const yesterdayVisits = (yesterdayStats as any)?.total_visits || 0;
    
    // 증감률 계산
    const visitorsChange = yesterdayVisitors > 0 
      ? ((todayVisitors - yesterdayVisitors) / yesterdayVisitors * 100).toFixed(1)
      : '0';
    const visitsChange = yesterdayVisits > 0
      ? ((todayVisits - yesterdayVisits) / yesterdayVisits * 100).toFixed(1)
      : '0';
    
    return c.json({
      today_visitors: todayVisitors,
      total_visitors: (totalStats as any)?.total_unique_visitors || 0,
      today: {
        visits: todayVisits,
        unique_visitors: todayVisitors,
        date: today
      },
      yesterday: {
        visits: yesterdayVisits,
        unique_visitors: yesterdayVisitors,
        date: yesterdayStr
      },
      comparison: {
        visitors_change: parseFloat(visitorsChange),
        visits_change: parseFloat(visitsChange),
        visitors_trend: todayVisitors > yesterdayVisitors ? 'up' : todayVisitors < yesterdayVisitors ? 'down' : 'same',
        visits_trend: todayVisits > yesterdayVisits ? 'up' : todayVisits < yesterdayVisits ? 'down' : 'same'
      },
      total: {
        visits: (totalStats as any)?.total_visits || 0,
        unique_visitors: (totalStats as any)?.total_unique_visitors || 0
      },
      week: weekStats.results || []
    });
    
  } catch (error) {
    console.error('통계 조회 오류:', error);
    return c.json({ error: '통계 조회 실패' }, 500);
  }
});

// 일별 통계 조회 (관리자용)
visitors.get('/daily', async (c) => {
  try {
    const { DB } = c.env;
    const days = parseInt(c.req.query('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const result = await DB.prepare(`
      SELECT 
        stat_date,
        total_visits,
        unique_visitors,
        created_at
      FROM visitor_stats
      WHERE stat_date >= ?
      ORDER BY stat_date DESC
    `).bind(startDateStr).all();
    
    return c.json(result.results);
    
  } catch (error) {
    console.error('일별 통계 조회 오류:', error);
    return c.json({ error: '일별 통계 조회 실패' }, 500);
  }
});

// 방문자 통계 강제 리셋 (관리자용)
visitors.post('/reset', async (c) => {
  try {
    const { DB } = c.env;
    const { reset_type } = await c.req.json();
    
    const today = new Date().toISOString().split('T')[0];
    
    if (reset_type === 'today') {
      // 오늘 통계만 리셋
      await DB.prepare('DELETE FROM visitor_stats WHERE stat_date = ?')
        .bind(today)
        .run();
      
      await DB.prepare('DELETE FROM visitors WHERE visit_date = ?')
        .bind(today)
        .run();
      
      return c.json({ 
        message: '오늘 방문자 통계가 리셋되었습니다',
        reset_date: today
      });
    } else if (reset_type === 'all') {
      // 전체 통계 리셋
      await DB.prepare('DELETE FROM visitor_stats').run();
      await DB.prepare('DELETE FROM visitors').run();
      
      return c.json({ 
        message: '전체 방문자 통계가 리셋되었습니다'
      });
    } else {
      return c.json({ error: 'Invalid reset_type. Use "today" or "all"' }, 400);
    }
    
  } catch (error) {
    console.error('방문자 리셋 오류:', error);
    return c.json({ error: '방문자 리셋 실패' }, 500);
  }
});

export default visitors;
