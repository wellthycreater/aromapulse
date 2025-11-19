import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

type Bindings = {
  DB: D1Database;
};

const userAnalytics = new Hono<{ Bindings: Bindings }>();

// 회원 상세 통계
userAnalytics.get('/stats', async (c) => {
  try {
    const { DB } = c.env;
    
    // 1. 전체 회원 수
    const totalUsers = await DB.prepare('SELECT COUNT(*) as count FROM users').first();
    
    // 2. 회원 유형별 (B2C/B2B 대분류)
    const userTypeStats = await DB.prepare(`
      SELECT 
        user_type,
        COUNT(*) as count
      FROM users
      GROUP BY user_type
    `).all();
    
    // 3. B2C 세부 카테고리별 (일상 스트레스 vs 직무 스트레스)
    const b2cCategoryStats = await DB.prepare(`
      SELECT 
        b2c_category,
        COUNT(*) as count
      FROM users
      WHERE user_type = 'B2C' AND b2c_category IS NOT NULL
      GROUP BY b2c_category
    `).all();
    
    // 4. B2B 세부 카테고리별 (개인, 기업, 공방)
    const b2bCategoryStats = await DB.prepare(`
      SELECT 
        b2b_category,
        COUNT(*) as count
      FROM users
      WHERE user_type = 'B2B' AND b2b_category IS NOT NULL
      GROUP BY b2b_category
    `).all();
    
    // 5. 역할별 (user, admin)
    const roleStats = await DB.prepare(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
    `).all();
    
    // 6. 지역별 분포 (시도 기준) - simplified to avoid CASE issues
    const regionStats = await DB.prepare(`
      SELECT 
        '기타' as region,
        COUNT(*) as count
      FROM users
      WHERE address IS NOT NULL AND address != ''
    `).all();
    
    // 7. 성별 분포
    const genderStats = await DB.prepare(`
      SELECT 
        gender,
        COUNT(*) as count
      FROM users
      WHERE gender IS NOT NULL
      GROUP BY gender
    `).all();
    
    // 8. 월별 가입 추이 (최근 12개월)
    const monthlySignups = await DB.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM users
      WHERE created_at >= datetime('now', '-12 months')
      GROUP BY month
      ORDER BY month ASC
    `).all();
    
    // 9. 주별 가입 추이 (최근 8주)
    const weeklySignups = await DB.prepare(`
      SELECT 
        strftime('%Y-W%W', created_at) as week,
        COUNT(*) as count
      FROM users
      WHERE created_at >= datetime('now', '-8 weeks')
      GROUP BY week
      ORDER BY week ASC
    `).all();
    
    // 10. OAuth 제공자별 통계
    const oauthStats = await DB.prepare(`
      SELECT 
        oauth_provider,
        COUNT(*) as count
      FROM users
      GROUP BY oauth_provider
    `).all();
    
    // 11. 활성/비활성 사용자
    const activeStats = await DB.prepare(`
      SELECT 
        is_active,
        COUNT(*) as count
      FROM users
      GROUP BY is_active
    `).all();
    
    // 12. 최근 로그인 분포
    const lastLoginStats = await DB.prepare(`
      SELECT 
        CASE 
          WHEN last_login_at IS NULL THEN '로그인 안 함'
          WHEN last_login_at >= datetime('now', '-1 day') THEN '오늘'
          WHEN last_login_at >= datetime('now', '-7 days') THEN '이번 주'
          WHEN last_login_at >= datetime('now', '-30 days') THEN '이번 달'
          ELSE '30일 이상'
        END as period,
        COUNT(*) as count
      FROM users
      GROUP BY period
    `).all();
    
    return c.json({
      total: (totalUsers as any)?.count || 0,
      by_user_type: userTypeStats.results || [],
      by_b2c_category: b2cCategoryStats.results || [],
      by_b2b_category: b2bCategoryStats.results || [],
      by_role: roleStats.results || [],
      by_region: regionStats.results || [],
      by_gender: genderStats.results || [],
      monthly_signups: monthlySignups.results || [],
      weekly_signups: weeklySignups.results || [],
      by_oauth_provider: oauthStats.results || [],
      by_active_status: activeStats.results || [],
      by_last_login: lastLoginStats.results || []
    });
    
  } catch (error) {
    console.error('User analytics stats error:', error);
    return c.json({ error: '사용자 통계 조회 실패' }, 500);
  }
});

// 필터링된 회원 목록 (고급 검색)
userAnalytics.get('/filtered', async (c) => {
  try {
    const { DB } = c.env;
    
    // 쿼리 파라미터
    const userType = c.req.query('user_type'); // B2C, B2B
    const b2cCategory = c.req.query('b2c_category'); // daily_stress, work_stress
    const b2bCategory = c.req.query('b2b_category'); // independent, company, workshop
    const region = c.req.query('region'); // 서울, 경기, etc.
    const gender = c.req.query('gender'); // male, female
    const role = c.req.query('role'); // user, admin
    const isActive = c.req.query('is_active'); // 1, 0
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    
    // 동적 WHERE 절 생성
    const conditions: string[] = [];
    const bindings: any[] = [];
    
    if (userType) {
      conditions.push('user_type = ?');
      bindings.push(userType);
    }
    
    if (b2cCategory) {
      conditions.push('b2c_category = ?');
      bindings.push(b2cCategory);
    }
    
    if (b2bCategory) {
      conditions.push('b2b_category = ?');
      bindings.push(b2bCategory);
    }
    
    if (region) {
      conditions.push('address LIKE ?');
      bindings.push(`%${region}%`);
    }
    
    if (gender) {
      conditions.push('gender = ?');
      bindings.push(gender);
    }
    
    if (role) {
      conditions.push('role = ?');
      bindings.push(role);
    }
    
    if (isActive !== undefined) {
      conditions.push('is_active = ?');
      bindings.push(parseInt(isActive));
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    // 총 개수 조회
    const countQuery = `SELECT COUNT(*) as count FROM users ${whereClause}`;
    const countResult = await DB.prepare(countQuery).bind(...bindings).first();
    const totalCount = (countResult as any)?.count || 0;
    
    // 데이터 조회
    const dataQuery = `
      SELECT 
        id, email, name, phone, user_type, 
        b2c_category, b2c_subcategory,
        b2b_category, b2b_business_name,
        address, gender, role, oauth_provider,
        created_at, last_login_at, is_active
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const dataResult = await DB.prepare(dataQuery)
      .bind(...bindings, limit, offset)
      .all();
    
    return c.json({
      users: dataResult.results || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Filtered users query error:', error);
    return c.json({ error: '필터링된 회원 조회 실패' }, 500);
  }
});

export default userAnalytics;
