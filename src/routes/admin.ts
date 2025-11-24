import { Hono } from 'hono';
import type { Bindings } from '../types';
import { sign } from 'hono/jwt';

const admin = new Hono<{ Bindings: Bindings }>();

// 관리자 로그인
admin.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: '이메일과 비밀번호를 입력해주세요' }, 400);
    }
    
    // 하드코딩된 관리자 계정 (실제로는 DB에서 조회해야 함)
    if (email === 'admin@aromapulse.kr' && password === 'admin123') {
      // JWT 토큰 생성
      const token = await sign(
        {
          email: email,
          role: 'admin',
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7일
        },
        c.env.JWT_SECRET || 'aromapulse-secret-key'
      );
      
      return c.json({
        success: true,
        token: token,
        user: {
          email: email,
          name: '관리자',
          role: 'admin'
        }
      });
    } else {
      return c.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' }, 401);
    }
    
  } catch (error) {
    console.error('Admin login error:', error);
    return c.json({ error: '로그인 실패' }, 500);
  }
});

// 개발 연구소 비밀번호 검증
admin.post('/verify-research-password', async (c) => {
  try {
    const { password } = await c.req.json();
    
    if (!password) {
      return c.json({ error: '비밀번호를 입력해주세요' }, 400);
    }
    
    const correctPassword = c.env.RESEARCH_LAB_PASSWORD || 'aromapulse2025!';
    
    if (password === correctPassword) {
      return c.json({ 
        success: true,
        message: '인증 성공' 
      });
    } else {
      return c.json({ 
        success: false,
        message: '비밀번호가 올바르지 않습니다' 
      }, 401);
    }
    
  } catch (error) {
    console.error('Verify research password error:', error);
    return c.json({ error: '비밀번호 검증 실패' }, 500);
  }
});

// 리뷰/댓글 태깅 (수동)
admin.post('/tag-review', async (c) => {
  try {
    const { review_id, sentiment, intent, keywords, auto_user_type } = await c.req.json();
    
    if (!review_id) {
      return c.json({ error: 'review_id가 필요합니다' }, 400);
    }
    
    await c.env.DB.prepare(
      `UPDATE reviews 
       SET sentiment = ?, intent = ?, keywords = ?, auto_user_type = ?, is_tagged = 1 
       WHERE id = ?`
    ).bind(
      sentiment || null,
      intent || null,
      keywords ? JSON.stringify(keywords) : null,
      auto_user_type || null,
      review_id
    ).run();
    
    return c.json({ message: '리뷰 태깅 완료' });
    
  } catch (error) {
    console.error('Tag review error:', error);
    return c.json({ error: '리뷰 태깅 실패' }, 500);
  }
});

// 블로그 댓글 태깅 (수동)
admin.post('/tag-comment', async (c) => {
  try {
    const { comment_id, sentiment, intent, keywords } = await c.req.json();
    
    if (!comment_id) {
      return c.json({ error: 'comment_id가 필요합니다' }, 400);
    }
    
    await c.env.DB.prepare(
      `UPDATE blog_comments 
       SET sentiment = ?, intent = ?, keywords = ?, is_tagged = 1 
       WHERE id = ?`
    ).bind(
      sentiment || null,
      intent || null,
      keywords ? JSON.stringify(keywords) : null,
      comment_id
    ).run();
    
    return c.json({ message: '댓글 태깅 완료' });
    
  } catch (error) {
    console.error('Tag comment error:', error);
    return c.json({ error: '댓글 태깅 실패' }, 500);
  }
});

// 상품 등록
admin.post('/products', async (c) => {
  try {
    const { 
      name, type, concept, care_type, brand, volume, description, 
      symptoms, region, price, stock, is_b2b, b2b_available, 
      workshop_available, supplier_name, supplier_contact, 
      main_image, detail_image, status 
    } = await c.req.json();
    
    if (!name || !type || !concept || !price) {
      return c.json({ error: '필수 정보를 입력해주세요' }, 400);
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO products (
        name, type, concept, care_type, brand, volume, description, 
        symptoms, region, price, stock, is_b2b, b2b_available, 
        workshop_available, supplier_name, supplier_contact, 
        main_image, detail_image, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      name, type, concept, care_type || null, brand || null, volume || null,
      description || null, symptoms ? JSON.stringify(symptoms) : null,
      region || null, price, stock || 0, is_b2b || 0, b2b_available || 0,
      workshop_available || 0, supplier_name || null, supplier_contact || null,
      main_image || null, detail_image || null, status || 'active'
    ).run();
    
    return c.json({ 
      message: '상품이 등록되었습니다',
      product_id: result.meta.last_row_id 
    }, 201);
    
  } catch (error) {
    console.error('Create product error:', error);
    return c.json({ error: '상품 등록 실패' }, 500);
  }
});

// 상품 수정
admin.put('/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { 
      name, type, concept, care_type, brand, volume, description, 
      symptoms, region, price, stock, is_b2b, b2b_available, 
      workshop_available, supplier_name, supplier_contact, 
      main_image, detail_image, status 
    } = await c.req.json();
    
    await c.env.DB.prepare(
      `UPDATE products SET
        name = ?, type = ?, concept = ?, care_type = ?, brand = ?, volume = ?,
        description = ?, symptoms = ?, region = ?, price = ?, stock = ?,
        is_b2b = ?, b2b_available = ?, workshop_available = ?,
        supplier_name = ?, supplier_contact = ?, main_image = ?, detail_image = ?,
        status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      name, type, concept, care_type || null, brand || null, volume || null,
      description || null, symptoms ? JSON.stringify(symptoms) : null,
      region || null, price, stock || 0, is_b2b || 0, b2b_available || 0,
      workshop_available || 0, supplier_name || null, supplier_contact || null,
      main_image || null, detail_image || null, status || 'active', id
    ).run();
    
    return c.json({ message: '상품이 수정되었습니다' });
    
  } catch (error) {
    console.error('Update product error:', error);
    return c.json({ error: '상품 수정 실패' }, 500);
  }
});

// 상품 삭제
admin.delete('/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(
      'DELETE FROM products WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ message: '상품이 삭제되었습니다' });
    
  } catch (error) {
    console.error('Delete product error:', error);
    return c.json({ error: '상품 삭제 실패' }, 500);
  }
});

// 패치 신청 상태 변경
admin.put('/patch-applications/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    
    if (!['pending', 'approved', 'shipped', 'completed'].includes(status)) {
      return c.json({ error: '잘못된 상태값입니다' }, 400);
    }
    
    await c.env.DB.prepare(
      'UPDATE patch_applications SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(status, id).run();
    
    return c.json({ message: '상태가 변경되었습니다' });
    
  } catch (error) {
    console.error('Update status error:', error);
    return c.json({ error: '상태 변경 실패' }, 500);
  }
});

// 대시보드 통계
admin.get('/dashboard/stats', async (c) => {
  try {
    // 전체 사용자 수
    const totalUsers = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).first();
    
    // B2C vs B2B 비율
    const userTypeStats = await c.env.DB.prepare(
      'SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type'
    ).all();
    
    // 제품 통계
    const productStats = await c.env.DB.prepare(
      'SELECT concept, COUNT(*) as count FROM products GROUP BY concept'
    ).all();
    
    // 패치 신청 통계
    const patchStats = await c.env.DB.prepare(
      'SELECT status, COUNT(*) as count FROM patch_applications GROUP BY status'
    ).all();
    
    // 리뷰 통계
    const reviewStats = await c.env.DB.prepare(
      'SELECT source, COUNT(*) as count FROM reviews GROUP BY source'
    ).all();
    
    // 태깅 통계
    const taggedReviews = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM reviews WHERE is_tagged = 1'
    ).first();
    
    const taggedComments = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM blog_comments WHERE is_tagged = 1'
    ).first();
    
    return c.json({
      total_users: totalUsers?.count || 0,
      user_type_stats: userTypeStats.results,
      product_stats: productStats.results,
      patch_stats: patchStats.results,
      review_stats: reviewStats.results,
      tagging: {
        tagged_reviews: taggedReviews?.count || 0,
        tagged_comments: taggedComments?.count || 0
      }
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({ error: '통계 조회 실패' }, 500);
  }
});

// 회원 목록 조회
admin.get('/users', async (c) => {
  try {
    const users = await c.env.DB.prepare(`
      SELECT id, email, name, user_type, phone, 
             is_active, created_at, last_login_at, role,
             oauth_provider,
             b2c_category, b2c_subcategory,
             b2b_category, b2b_business_name, b2b_business_number, b2b_address,
             company_size, department, position, address
      FROM users 
      ORDER BY created_at DESC
    `).all();
    
    return c.json({ users: users.results || [] });
  } catch (error: any) {
    console.error('Get users error:', error);
    return c.json({ error: '회원 목록 조회 실패', details: error.message }, 500);
  }
});

// 특정 회원 상세 조회
admin.get('/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const user = await c.env.DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(id).first();
    
    if (!user) {
      return c.json({ error: '회원을 찾을 수 없습니다' }, 404);
    }
    
    return c.json({ user });
  } catch (error: any) {
    console.error('Get user detail error:', error);
    return c.json({ error: '회원 조회 실패', details: error.message }, 500);
  }
});

// 회원 상태 변경 (활성화/비활성화)
admin.patch('/users/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { is_active } = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(is_active ? 1 : 0, id).run();
    
    return c.json({ message: '회원 상태가 변경되었습니다' });
  } catch (error: any) {
    console.error('Update user status error:', error);
    return c.json({ error: '상태 변경 실패', details: error.message }, 500);
  }
});

// Get user statistics
admin.get('/users/stats', async (c) => {
  try {
    // Total users
    const totalResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).first();
    
    // B2C users
    const b2cResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE user_type = 'B2C'"
    ).first();
    
    // B2B users
    const b2bResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE user_type = 'B2B'"
    ).first();
    
    // New users in last 7 days
    const newUsersResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-7 days')"
    ).first();
    
    return c.json({
      total_users: (totalResult as any)?.count || 0,
      b2c_users: (b2cResult as any)?.count || 0,
      b2b_users: (b2bResult as any)?.count || 0,
      new_users_7days: (newUsersResult as any)?.count || 0
    });
    
  } catch (error: any) {
    console.error('Get user stats error:', error);
    return c.json({ 
      error: '사용자 통계 조회 실패', 
      details: error.message 
    }, 500);
  }
});

// Get user analytics for dashboard charts
admin.get('/users/analytics', async (c) => {
  try {
    // Version: 2025-11-19-v3
    console.log('📊 Fetching user analytics...');
    
    // 1. User types (B2C vs B2B)
    const userTypes = await c.env.DB.prepare(
      'SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type'
    ).all();
    
    // 2. Stress types (B2C categories)
    const stressTypes = await c.env.DB.prepare(
      "SELECT b2c_category as stress_type, COUNT(*) as count FROM users WHERE user_type = 'B2C' AND b2c_category IS NOT NULL GROUP BY b2c_category"
    ).all();
    
    // 3. B2B categories (independent, wholesale, company)
    const b2bCategories = await c.env.DB.prepare(
      "SELECT b2b_category, COUNT(*) as count FROM users WHERE user_type = 'B2B' AND b2b_category IS NOT NULL GROUP BY b2b_category"
    ).all();
    
    // 4. Company sizes (for B2B company category only)
    const companySizes = await c.env.DB.prepare(
      "SELECT company_size, COUNT(*) as count FROM users WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NOT NULL GROUP BY company_size"
    ).all();
    
    // 5. Region distribution
    const regions = await c.env.DB.prepare(
      "SELECT region, COUNT(*) as count FROM users WHERE region IS NOT NULL GROUP BY region ORDER BY count DESC LIMIT 10"
    ).all();
    
    // 6. Gender distribution
    const genders = await c.env.DB.prepare(
      "SELECT gender, COUNT(*) as count FROM users WHERE gender IS NOT NULL GROUP BY gender"
    ).all();
    
    // 7. Monthly signup trend (last 12 months)
    const signupTrend = await c.env.DB.prepare(
      "SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-12 months') GROUP BY month ORDER BY month ASC"
    ).all();
    
    // 8. Weekly signup trend (last 8 weeks)
    const weeklySignup = await c.env.DB.prepare(`
      SELECT 
        date(created_at, 'weekday 0', '-7 days') as week_start,
        COUNT(*) as count
      FROM users
      WHERE created_at >= date('now', '-56 days')
      GROUP BY week_start
      ORDER BY week_start ASC
    `).all();
    
    // 9. User roles distribution
    const roles = await c.env.DB.prepare(
      "SELECT role, COUNT(*) as count FROM users WHERE role IS NOT NULL GROUP BY role"
    ).all();
    
    // 10. B2C work_stress occupations breakdown
    const b2cWorkStressOccupations = await c.env.DB.prepare(`
      SELECT occupation, COUNT(*) as count 
      FROM users 
      WHERE user_type = 'B2C' 
        AND b2c_category = 'work_stress' 
        AND occupation IS NOT NULL 
      GROUP BY occupation 
      ORDER BY count DESC
    `).all();
    
    // 11. B2C daily_stress life situations breakdown
    const b2cDailyStressLifeSituations = await c.env.DB.prepare(`
      SELECT life_situation, COUNT(*) as count 
      FROM users 
      WHERE user_type = 'B2C' 
        AND b2c_category = 'daily_stress' 
        AND life_situation IS NOT NULL 
      GROUP BY life_situation 
      ORDER BY count DESC
    `).all();
    
    console.log('✅ User analytics fetched');
    console.log('📊 B2C work_stress occupations:', b2cWorkStressOccupations.results?.length || 0);
    console.log('📊 B2C daily_stress life_situations:', b2cDailyStressLifeSituations.results?.length || 0);
    console.log('📊 Company sizes:', companySizes.results?.length || 0);
    
    // Ensure we have valid result arrays
    const workOccupations = b2cWorkStressOccupations?.results || [];
    const lifeAdjustments = b2cDailyStressLifeSituations?.results || [];
    const compSizes = companySizes?.results || [];
    
    console.log('🔍 Debug - workOccupations:', workOccupations.length, 'items');
    console.log('🔍 Debug - lifeAdjustments:', lifeAdjustments.length, 'items');
    console.log('🔍 Debug - compSizes:', compSizes.length, 'items');
    
    // Create response with all fields
    return c.json({
      user_types: userTypes.results || [],
      stress_types: stressTypes.results || [],
      b2b_categories: b2bCategories.results || [],
      company_sizes: compSizes,
      regions: regions.results || [],
      genders: genders.results || [],
      roles: roles.results || [],
      signup_trend: signupTrend.results || [],
      weekly_signup: weeklySignup.results || [],
      b2c_work_stress_occupations: workOccupations,
      b2c_daily_stress_life_situations: lifeAdjustments,
      _timestamp: Date.now(),
      _version: '2025-11-19-final'
    });
    
  } catch (error: any) {
    console.error('❌ Get user analytics error:', error);
    return c.json({ 
      error: '사용자 분석 데이터 조회 실패', 
      details: error.message 
    }, 500);
  }
});

// SNS Channel Statistics
admin.get('/sns/stats', async (c) => {
  try {
    console.log('📊 Fetching SNS channel stats...');
    
    // 1. Daily SNS visits (all available data or last 30 days)
    const dailyVisits = await c.env.DB.prepare(`
      SELECT 
        visit_date,
        channel,
        visitor_count,
        unique_visitors,
        click_through
      FROM sns_visits
      ORDER BY visit_date ASC, channel ASC
    `).all();
    
    // 2. Total visitors by channel (all time)
    const channelTotals = await c.env.DB.prepare(`
      SELECT 
        channel,
        SUM(visitor_count) as total_visitors,
        SUM(unique_visitors) as total_unique,
        SUM(click_through) as total_clicks,
        ROUND(CAST(SUM(click_through) AS REAL) / SUM(visitor_count) * 100, 2) as ctr
      FROM sns_visits
      GROUP BY channel
      ORDER BY total_visitors DESC
    `).all();
    
    // 3. Recent trends (compare latest 7 days with previous 7 days based on available data)
    const recentTrends = await c.env.DB.prepare(`
      SELECT 
        channel,
        SUM(CASE WHEN visit_date >= date((SELECT MAX(visit_date) FROM sns_visits), '-7 days') THEN visitor_count ELSE 0 END) as recent_week,
        SUM(CASE WHEN visit_date >= date((SELECT MAX(visit_date) FROM sns_visits), '-14 days') 
                 AND visit_date < date((SELECT MAX(visit_date) FROM sns_visits), '-7 days') 
            THEN visitor_count ELSE 0 END) as previous_week
      FROM sns_visits
      WHERE visit_date >= date((SELECT MAX(visit_date) FROM sns_visits), '-14 days')
      GROUP BY channel
    `).all();
    
    // 4. User referral sources distribution
    const referralSources = await c.env.DB.prepare(`
      SELECT 
        referral_source,
        COUNT(*) as user_count
      FROM users
      WHERE referral_source IS NOT NULL
      GROUP BY referral_source
      ORDER BY user_count DESC
    `).all();
    
    console.log('✅ SNS stats fetched');
    
    return c.json({
      daily_visits: dailyVisits.results || [],
      channel_totals: channelTotals.results || [],
      recent_trends: recentTrends.results || [],
      referral_sources: referralSources.results || []
    });
    
  } catch (error: any) {
    console.error('❌ Get SNS stats error:', error);
    return c.json({ 
      error: 'SNS 통계 조회 실패', 
      details: error.message 
    }, 500);
  }
});

// O2O Conversion Statistics
admin.get('/o2o/stats', async (c) => {
  try {
    console.log('📊 Fetching O2O conversion stats...');
    
    // 1. Total conversions by referral source
    const conversionsBySource = await c.env.DB.prepare(`
      SELECT 
        referral_source,
        COUNT(*) as conversion_count,
        SUM(amount) as total_revenue
      FROM o2o_conversions
      GROUP BY referral_source
      ORDER BY conversion_count DESC
    `).all();
    
    // 2. Conversions by type
    const conversionsByType = await c.env.DB.prepare(`
      SELECT 
        conversion_type,
        COUNT(*) as count,
        SUM(amount) as revenue
      FROM o2o_conversions
      GROUP BY conversion_type
      ORDER BY count DESC
    `).all();
    
    // 3. Conversions by workshop location
    const conversionsByLocation = await c.env.DB.prepare(`
      SELECT 
        workshop_location,
        COUNT(*) as conversion_count,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_revenue
      FROM o2o_conversions
      GROUP BY workshop_location
      ORDER BY conversion_count DESC
    `).all();
    
    // 4. Daily conversion trend (all available data)
    const dailyConversions = await c.env.DB.prepare(`
      SELECT 
        DATE(conversion_date) as conversion_day,
        referral_source,
        COUNT(*) as conversions,
        SUM(amount) as revenue
      FROM o2o_conversions
      GROUP BY conversion_day, referral_source
      ORDER BY conversion_day ASC
    `).all();
    
    // 5. Conversion funnel metrics
    const funnelMetrics = await c.env.DB.prepare(`
      SELECT 
        o.referral_source,
        COUNT(DISTINCT u.id) as users_from_source,
        COUNT(DISTINCT o.user_id) as converted_users,
        COUNT(o.id) as total_conversions,
        ROUND(CAST(COUNT(DISTINCT o.user_id) AS REAL) / COUNT(DISTINCT u.id) * 100, 2) as conversion_rate
      FROM users u
      LEFT JOIN o2o_conversions o ON u.id = o.user_id
      WHERE u.referral_source IS NOT NULL
      GROUP BY o.referral_source
    `).all();
    
    // 6. SNS visit-to-conversion rate (all time)
    const snsConversionRate = await c.env.DB.prepare(`
      SELECT 
        s.channel,
        SUM(s.click_through) as total_clicks,
        COUNT(o.id) as conversions,
        ROUND(CAST(COUNT(o.id) AS REAL) / SUM(s.click_through) * 100, 2) as click_to_conversion_rate
      FROM sns_visits s
      LEFT JOIN o2o_conversions o ON o.referral_source = s.channel
        AND DATE(o.conversion_date) = s.visit_date
      GROUP BY s.channel
    `).all();
    
    console.log('✅ O2O stats fetched');
    
    return c.json({
      conversions_by_source: conversionsBySource.results || [],
      conversions_by_type: conversionsByType.results || [],
      conversions_by_location: conversionsByLocation.results || [],
      daily_conversions: dailyConversions.results || [],
      funnel_metrics: funnelMetrics.results || [],
      sns_conversion_rate: snsConversionRate.results || []
    });
    
  } catch (error: any) {
    console.error('❌ Get O2O stats error:', error);
    return c.json({ 
      error: 'O2O 전환 통계 조회 실패', 
      details: error.message 
    }, 500);
  }
});

// Temporary endpoint to update existing users with missing demographic data
admin.post('/update-user-demographics', async (c) => {
  try {
    console.log('🔄 Updating user demographics...');
    
    // 1. Update B2B company users with company_size
    await c.env.DB.batch([
      c.env.DB.prepare(`
        UPDATE users 
        SET company_size = 'under_20'
        WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL
        AND id = (SELECT MIN(id) FROM users WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL)
      `),
      c.env.DB.prepare(`
        UPDATE users 
        SET company_size = '20_to_50'
        WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL
        AND id IN (SELECT id FROM users WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL LIMIT 2)
      `),
      c.env.DB.prepare(`
        UPDATE users 
        SET company_size = '50_to_100'
        WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL
        AND id = (SELECT MIN(id) FROM users WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL)
      `),
      c.env.DB.prepare(`
        UPDATE users 
        SET company_size = 'over_100'
        WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL
      `)
    ]);
    
    // 2. Update B2C work_stress users with occupations
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE users SET occupation = 'office_it' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 3)`),
      c.env.DB.prepare(`UPDATE users SET occupation = 'service_retail' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 2)`),
      c.env.DB.prepare(`UPDATE users SET occupation = 'medical_care' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 2)`),
      c.env.DB.prepare(`UPDATE users SET occupation = 'education' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 2)`),
      c.env.DB.prepare(`UPDATE users SET occupation = 'manufacturing_logistics' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 2)`),
      c.env.DB.prepare(`UPDATE users SET occupation = 'freelancer' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 1)`),
      c.env.DB.prepare(`UPDATE users SET occupation = 'finance' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 1)`)
    ]);
    
    // 3. Update B2C daily_stress users with life_situations
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE users SET life_situation = 'student' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'daily_stress' AND life_situation IS NULL ORDER BY id LIMIT 2)`),
      c.env.DB.prepare(`UPDATE users SET life_situation = 'parent' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'daily_stress' AND life_situation IS NULL ORDER BY id LIMIT 2)`),
      c.env.DB.prepare(`UPDATE users SET life_situation = 'homemaker' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'daily_stress' AND life_situation IS NULL ORDER BY id LIMIT 2)`),
      c.env.DB.prepare(`UPDATE users SET life_situation = 'job_seeker' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'daily_stress' AND life_situation IS NULL ORDER BY id LIMIT 1)`),
      c.env.DB.prepare(`UPDATE users SET life_situation = 'retiree' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'daily_stress' AND life_situation IS NULL ORDER BY id LIMIT 1)`),
      c.env.DB.prepare(`UPDATE users SET life_situation = 'caregiver' WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'daily_stress' AND life_situation IS NULL ORDER BY id LIMIT 1)`)
    ]);
    
    // 4. Update demographic fields for all users
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE users SET gender = CASE WHEN id % 2 = 0 THEN 'female' ELSE 'male' END WHERE gender IS NULL`),
      c.env.DB.prepare(`UPDATE users SET age_group = CASE WHEN id % 4 = 0 THEN '20s' WHEN id % 4 = 1 THEN '30s' WHEN id % 4 = 2 THEN '40s' ELSE '50s' END WHERE age_group IS NULL`),
      c.env.DB.prepare(`UPDATE users SET region = CASE WHEN id % 5 = 0 THEN '서울' WHEN id % 5 = 1 THEN '경기' WHEN id % 5 = 2 THEN '부산' WHEN id % 5 = 3 THEN '대구' ELSE '인천' END WHERE region IS NULL`)
    ]);
    
    console.log('✅ User demographics updated successfully');
    
    return c.json({ 
      success: true,
      message: '사용자 인구통계 정보가 성공적으로 업데이트되었습니다'
    });
    
  } catch (error: any) {
    console.error('❌ Update user demographics error:', error);
    return c.json({ 
      error: '사용자 정보 업데이트 실패', 
      details: error.message 
    }, 500);
  }
});

// NEW ENDPOINT - Separate endpoint for B2C/B2B detailed analytics
admin.get('/users/analytics-v2', async (c) => {
  try {
    console.log('📊 Fetching analytics v2...');
    
    // B2C work_stress occupations
    const workOccupations = await c.env.DB.prepare(`
      SELECT occupation, COUNT(*) as count 
      FROM users 
      WHERE user_type = 'B2C' 
        AND b2c_category = 'work_stress' 
        AND occupation IS NOT NULL 
      GROUP BY occupation 
      ORDER BY count DESC
    `).all();
    
    // B2C daily_stress life situations
    const lifeSituations = await c.env.DB.prepare(`
      SELECT life_situation, COUNT(*) as count 
      FROM users 
      WHERE user_type = 'B2C' 
        AND b2c_category = 'daily_stress' 
        AND life_situation IS NOT NULL 
      GROUP BY life_situation 
      ORDER BY count DESC
    `).all();
    
    // B2B company sizes
    const companySizes = await c.env.DB.prepare(`
      SELECT company_size, COUNT(*) as count 
      FROM users 
      WHERE user_type = 'B2B' 
        AND b2b_category = 'company' 
        AND company_size IS NOT NULL 
      GROUP BY company_size 
      ORDER BY count DESC
    `).all();
    
    console.log('✅ V2 analytics fetched');
    
    return c.json({
      b2c_work_stress_occupations: workOccupations.results || [],
      b2c_daily_stress_life_situations: lifeSituations.results || [],
      company_sizes: companySizes.results || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Analytics v2 error:', error);
    return c.json({ 
      error: 'V2 분석 데이터 조회 실패', 
      details: error.message 
    }, 500);
  }
});

export default admin;
// Cache buster: 1763552464
