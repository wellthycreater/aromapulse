import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Get user statistics (must be before /:id route)
app.get('/stats', async (c) => {
  try {
    const db = c.env.DB;
    
    // Total users
    const totalResult = await db.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).first();
    
    // B2C users
    const b2cResult = await db.prepare(
      "SELECT COUNT(*) as count FROM users WHERE user_type = 'B2C'"
    ).first();
    
    // B2B users
    const b2bResult = await db.prepare(
      "SELECT COUNT(*) as count FROM users WHERE user_type = 'B2B'"
    ).first();
    
    // New users in last 7 days
    const newUsersResult = await db.prepare(
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

// Get detailed user analytics
app.get('/analytics', async (c) => {
  try {
    const db = c.env.DB;
    
    // 1. User type breakdown (detailed)
    const userTypeStats = await db.prepare(`
      SELECT 
        user_type,
        COUNT(*) as count
      FROM users
      GROUP BY user_type
      ORDER BY count DESC
    `).all();
    
    // 2. B2C category breakdown (stress type)
    const stressTypeStats = await db.prepare(`
      SELECT 
        b2c_category as stress_type,
        COUNT(*) as count
      FROM users
      WHERE user_type = 'B2C' AND b2c_category IS NOT NULL AND b2c_category != ''
      GROUP BY b2c_category
      ORDER BY count DESC
    `).all();
    
    // 3. B2B category breakdown  
    const b2bCategoryStats = await db.prepare(`
      SELECT 
        b2b_category,
        COUNT(*) as count
      FROM users
      WHERE user_type = 'B2B' AND b2b_category IS NOT NULL AND b2b_category != ''
      GROUP BY b2b_category
      ORDER BY count DESC
    `).all();
    
    // 4. Role breakdown (admin, partner, user)
    const roleStats = await db.prepare(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      WHERE role IS NOT NULL AND role != ''
      GROUP BY role
      ORDER BY count DESC
    `).all();
    
    // Note: region, gender, company_size columns don't exist in current schema
    // Return empty arrays for these
    const regionStats = { results: [] };
    const genderStats = { results: [] };
    const companySizeStats = { results: [] };
    
    // 7. Monthly signup trend (last 6 months)
    const signupTrend = await db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM users
      WHERE created_at >= datetime('now', '-6 months')
      GROUP BY month
      ORDER BY month ASC
    `).all();
    
    // 8. Weekly signup trend (last 4 weeks)
    const weeklySignupTrend = await db.prepare(`
      SELECT 
        date(created_at, 'weekday 0', '-6 days') as week_start,
        COUNT(*) as count
      FROM users
      WHERE created_at >= datetime('now', '-28 days')
      GROUP BY week_start
      ORDER BY week_start ASC
    `).all();
    
    return c.json({
      user_types: userTypeStats.results || [],
      stress_types: stressTypeStats.results || [],
      b2b_categories: b2bCategoryStats.results || [],
      regions: regionStats.results || [],
      genders: genderStats.results || [],
      roles: roleStats.results || [],
      company_sizes: companySizeStats.results || [],
      signup_trend: signupTrend.results || [],
      weekly_signup: weeklySignupTrend.results || []
    });
    
  } catch (error: any) {
    console.error('Get user analytics error:', error);
    return c.json({ 
      error: '사용자 분석 데이터 조회 실패', 
      details: error.message 
    }, 500);
  }
});

// Get all users with filters
app.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const { user_type, role, search, is_active } = c.req.query();
    
    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    
    // Filter by user type (b2c/b2b)
    if (user_type) {
      query += ' AND user_type = ?';
      params.push(user_type);
    }
    
    // Filter by role (admin/partner/user)
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    // Search by name or email
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Filter by active status
    if (is_active !== undefined && is_active !== '') {
      query += ' AND is_active = ?';
      params.push(parseInt(is_active));
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).all();
    
    // Remove sensitive fields
    const users = result.results?.map((user: any) => {
      const { password_hash, ...safeUser } = user;
      return safeUser;
    });
    
    return c.json(users || []);
  } catch (error) {
    console.error('Users load error:', error);
    return c.json({ error: 'Failed to load users' }, 500);
  }
});

// Get single user
app.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.req.param('id');
    
    const user = await db.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Remove sensitive fields
    const { password_hash, ...safeUser } = user as any;
    
    return c.json(safeUser);
  } catch (error) {
    console.error('User load error:', error);
    return c.json({ error: 'Failed to load user' }, 500);
  }
});

// Update user
app.patch('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.req.param('id');
    const body = await c.req.json();
    
    const { is_active, role, name, phone } = body;
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (phone) {
      updates.push('phone = ?');
      params.push(phone);
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.prepare(query).bind(...params).run();
    
    return c.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('User update error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Delete user (soft delete by setting is_active to 0)
app.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.req.param('id');
    
    await db.prepare('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(userId)
      .run();
    
    return c.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('User delete error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

export default app;
