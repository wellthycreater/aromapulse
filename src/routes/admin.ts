import { Hono } from 'hono';
import type { Bindings } from '../types';

const admin = new Hono<{ Bindings: Bindings }>();

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
    
    console.log('✅ User analytics fetched');
    
    return c.json({
      user_types: userTypes.results || [],
      stress_types: stressTypes.results || [],
      b2b_categories: b2bCategories.results || [],
      company_sizes: companySizes.results || [],
      regions: regions.results || [],
      genders: genders.results || [],
      signup_trend: signupTrend.results || []
    });
    
  } catch (error: any) {
    console.error('❌ Get user analytics error:', error);
    return c.json({ 
      error: '사용자 분석 데이터 조회 실패', 
      details: error.message 
    }, 500);
  }
});

export default admin;
