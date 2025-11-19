import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

type Bindings = {
  DB: D1Database;
};

const adminDashboard = new Hono<{ Bindings: Bindings }>();

// 대시보드 전체 통계
adminDashboard.get('/stats', async (c) => {
  try {
    const { DB } = c.env;
    
    // 전체 회원 수
    const totalUsers = await DB.prepare('SELECT COUNT(*) as count FROM users').first();
    
    // B2C 회원 수 (both old and new format)
    const b2cUsers = await DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE user_type IN ('general_stress', 'work_stress', 'B2C')"
    ).first();
    
    // B2B 회원 수 (both old and new format)
    const b2bUsers = await DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE user_type IN ('perfumer', 'company', 'shop', 'B2B')"
    ).first();
    
    // 최근 7일 신규 가입
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();
    
    const newUsers = await DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= ?'
    ).bind(sevenDaysAgoStr).first();
    
    // 전체 제품 수
    const totalProducts = await DB.prepare('SELECT COUNT(*) as count FROM products').first();
    
    // 워크샵 수
    const workshops = await DB.prepare(
      "SELECT COUNT(*) as count FROM workshop_bookings WHERE status != 'cancelled'"
    ).first();
    
    // 원데이 클래스 수
    const classes = await DB.prepare(
      "SELECT COUNT(*) as count FROM oneday_class_bookings WHERE status != 'cancelled'"
    ).first();
    
    return c.json({
      users: {
        total: (totalUsers as any)?.count || 0,
        b2c: (b2cUsers as any)?.count || 0,
        b2b: (b2bUsers as any)?.count || 0,
        new_7days: (newUsers as any)?.count || 0
      },
      products: (totalProducts as any)?.count || 0,
      bookings: {
        workshops: (workshops as any)?.count || 0,
        classes: (classes as any)?.count || 0
      }
    });
    
  } catch (error) {
    console.error('대시보드 통계 오류:', error);
    return c.json({ error: '통계 조회 실패' }, 500);
  }
});

// 최근 가입 회원 목록
adminDashboard.get('/recent-users', async (c) => {
  try {
    const { DB } = c.env;
    const limit = parseInt(c.req.query('limit') || '5');
    
    const result = await DB.prepare(`
      SELECT 
        id,
        name,
        email,
        user_type,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all();
    
    return c.json(result.results || []);
    
  } catch (error) {
    console.error('최근 회원 조회 오류:', error);
    return c.json({ error: '최근 회원 조회 실패' }, 500);
  }
});

// 최근 활동 로그
adminDashboard.get('/recent-activities', async (c) => {
  try {
    const { DB } = c.env;
    const limit = parseInt(c.req.query('limit') || '10');
    
    // 최근 로그인 기록 (user_login_logs 테이블이 있는 경우)
    try {
      const loginLogs = await DB.prepare(`
        SELECT 
          'login' as activity_type,
          email,
          login_method,
          device_type,
          login_at as created_at
        FROM user_login_logs
        ORDER BY login_at DESC
        LIMIT ?
      `).bind(Math.floor(limit / 2)).all();
      
      // 최근 가입 기록
      const signupLogs = await DB.prepare(`
        SELECT 
          'signup' as activity_type,
          email,
          user_type as login_method,
          'unknown' as device_type,
          created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(Math.floor(limit / 2)).all();
      
      // 두 배열 합치고 시간순 정렬
      const allActivities = [
        ...(loginLogs.results || []),
        ...(signupLogs.results || [])
      ].sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, limit);
      
      return c.json(allActivities);
      
    } catch (loginError) {
      // user_login_logs 테이블이 없는 경우, 가입 기록만 반환
      const signupLogs = await DB.prepare(`
        SELECT 
          'signup' as activity_type,
          email,
          user_type as login_method,
          'unknown' as device_type,
          created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(limit).all();
      
      return c.json(signupLogs.results || []);
    }
    
  } catch (error) {
    console.error('최근 활동 조회 오류:', error);
    return c.json({ error: '최근 활동 조회 실패' }, 500);
  }
});

// 디바이스/브라우저 통계
adminDashboard.get('/device-stats', async (c) => {
  try {
    const { DB } = c.env;
    
    try {
      // 디바이스별 통계
      const deviceStats = await DB.prepare(`
        SELECT 
          device_type,
          COUNT(*) as count
        FROM user_login_logs
        WHERE login_at >= datetime('now', '-30 days')
        GROUP BY device_type
        ORDER BY count DESC
      `).all();
      
      // 브라우저별 통계
      const browserStats = await DB.prepare(`
        SELECT 
          browser,
          COUNT(*) as count
        FROM user_login_logs
        WHERE login_at >= datetime('now', '-30 days')
          AND browser IS NOT NULL
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 5
      `).all();
      
      // OS별 통계
      const osStats = await DB.prepare(`
        SELECT 
          os,
          COUNT(*) as count
        FROM user_login_logs
        WHERE login_at >= datetime('now', '-30 days')
          AND os IS NOT NULL
        GROUP BY os
        ORDER BY count DESC
        LIMIT 5
      `).all();
      
      return c.json({
        devices: deviceStats.results || [],
        browsers: browserStats.results || [],
        os: osStats.results || []
      });
      
    } catch (error) {
      // user_login_logs 테이블이 없는 경우 빈 데이터 반환
      return c.json({
        devices: [],
        browsers: [],
        os: []
      });
    }
    
  } catch (error) {
    console.error('디바이스 통계 조회 오류:', error);
    return c.json({ error: '디바이스 통계 조회 실패' }, 500);
  }
});

export default adminDashboard;
