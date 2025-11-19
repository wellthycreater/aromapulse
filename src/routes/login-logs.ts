import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

type Bindings = {
  DB: D1Database;
};

const loginLogs = new Hono<{ Bindings: Bindings }>();

// 로그인 로그 조회 (관리자용)
loginLogs.get('/', async (c) => {
  try {
    const { DB } = c.env;
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const userId = c.req.query('user_id');
    const deviceType = c.req.query('device_type');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    
    let query = 'SELECT * FROM user_login_logs WHERE 1=1';
    const params: any[] = [];
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(parseInt(userId));
    }
    
    if (deviceType) {
      query += ' AND device_type = ?';
      params.push(deviceType);
    }
    
    if (startDate) {
      query += ' AND login_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND login_at <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY login_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const result = await DB.prepare(query).bind(...params).all();
    
    // 총 개수 조회
    let countQuery = 'SELECT COUNT(*) as total FROM user_login_logs WHERE 1=1';
    const countParams: any[] = [];
    
    if (userId) {
      countQuery += ' AND user_id = ?';
      countParams.push(parseInt(userId));
    }
    
    if (deviceType) {
      countQuery += ' AND device_type = ?';
      countParams.push(deviceType);
    }
    
    if (startDate) {
      countQuery += ' AND login_at >= ?';
      countParams.push(startDate);
    }
    
    if (endDate) {
      countQuery += ' AND login_at <= ?';
      countParams.push(endDate);
    }
    
    const countResult = await DB.prepare(countQuery).bind(...countParams).first();
    
    return c.json({
      logs: result.results,
      total: (countResult as any)?.total || 0,
      limit,
      offset
    });
    
  } catch (error) {
    console.error('로그인 로그 조회 오류:', error);
    return c.json({ error: '로그인 로그 조회 실패' }, 500);
  }
});

// 특정 사용자의 로그인 로그 조회
loginLogs.get('/user/:userId', async (c) => {
  try {
    const { DB } = c.env;
    const userId = c.req.param('userId');
    const limit = parseInt(c.req.query('limit') || '20');
    
    const result = await DB.prepare(
      'SELECT * FROM user_login_logs WHERE user_id = ? ORDER BY login_at DESC LIMIT ?'
    ).bind(parseInt(userId), limit).all();
    
    return c.json({
      user_id: userId,
      logs: result.results
    });
    
  } catch (error) {
    console.error('사용자 로그인 로그 조회 오류:', error);
    return c.json({ error: '사용자 로그인 로그 조회 실패' }, 500);
  }
});

// 로그인 통계 조회
loginLogs.get('/stats', async (c) => {
  try {
    const { DB } = c.env;
    const days = parseInt(c.req.query('days') || '7');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();
    
    // 일별 로그인 수
    const dailyStats = await DB.prepare(`
      SELECT 
        DATE(login_at) as date,
        COUNT(*) as login_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_login_logs
      WHERE login_at >= ?
      GROUP BY DATE(login_at)
      ORDER BY date DESC
    `).bind(startDateStr).all();
    
    // 디바이스 타입별 통계
    const deviceStats = await DB.prepare(`
      SELECT 
        device_type,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_login_logs
      WHERE login_at >= ?
      GROUP BY device_type
    `).bind(startDateStr).all();
    
    // 로그인 방법별 통계
    const methodStats = await DB.prepare(`
      SELECT 
        login_method,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_login_logs
      WHERE login_at >= ?
      GROUP BY login_method
    `).bind(startDateStr).all();
    
    // 운영체제별 통계
    const osStats = await DB.prepare(`
      SELECT 
        os,
        COUNT(*) as count
      FROM user_login_logs
      WHERE login_at >= ?
      GROUP BY os
      ORDER BY count DESC
      LIMIT 10
    `).bind(startDateStr).all();
    
    // 브라우저별 통계
    const browserStats = await DB.prepare(`
      SELECT 
        browser,
        COUNT(*) as count
      FROM user_login_logs
      WHERE login_at >= ?
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 10
    `).bind(startDateStr).all();
    
    return c.json({
      period_days: days,
      start_date: startDateStr,
      daily_stats: dailyStats.results,
      device_stats: deviceStats.results,
      method_stats: methodStats.results,
      os_stats: osStats.results,
      browser_stats: browserStats.results
    });
    
  } catch (error) {
    console.error('로그인 통계 조회 오류:', error);
    return c.json({ error: '로그인 통계 조회 실패' }, 500);
  }
});

// 로그인 로그 삭제 (관리자용 - 오래된 로그 정리)
loginLogs.delete('/cleanup', async (c) => {
  try {
    const { DB } = c.env;
    const { days_to_keep } = await c.req.json();
    
    const cutoffDays = days_to_keep || 90; // 기본 90일 보관
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);
    const cutoffDateStr = cutoffDate.toISOString();
    
    const result = await DB.prepare(
      'DELETE FROM user_login_logs WHERE login_at < ?'
    ).bind(cutoffDateStr).run();
    
    return c.json({
      message: `${cutoffDays}일 이전 로그인 로그가 삭제되었습니다`,
      cutoff_date: cutoffDateStr,
      deleted_count: result.meta.changes || 0
    });
    
  } catch (error) {
    console.error('로그인 로그 정리 오류:', error);
    return c.json({ error: '로그인 로그 정리 실패' }, 500);
  }
});

export default loginLogs;
