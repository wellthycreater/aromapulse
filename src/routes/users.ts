import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

type Bindings = {
  DB: D1Database;
};

const users = new Hono<{ Bindings: Bindings }>();

// 회원 목록 조회 (관리자 전용)
users.get('/', async (c) => {
  try {
    const { DB } = c.env;
    
    // 쿼리 파라미터
    const userType = c.req.query('user_type'); // 'B2C', 'B2B'
    const b2bCategory = c.req.query('b2b_category'); // 'perfumer', 'company', 'shop', 'independent'
    const role = c.req.query('role'); // 'user', 'admin', 'super_admin'
    const isActive = c.req.query('is_active'); // '1', '0'
    const search = c.req.query('search'); // 이름, 이메일 검색
    const limit = parseInt(c.req.query('limit') || '100');
    
    let query = `
      SELECT 
        id, email, name, phone, user_type,
        b2c_category, b2c_subcategory, b2c_stress_type,
        daily_stress_category, work_industry, work_position,
        b2b_category, b2b_business_name, b2b_business_number, b2b_address,
        b2b_business_type, b2b_independent_type,
        b2b_company_name, b2b_company_size, b2b_department, b2b_position,
        b2b_shop_name, b2b_shop_type,
        company_role, company_size, department,
        age_group, gender, region,
        oauth_provider, role, is_active,
        created_at, updated_at, last_login_at
      FROM users
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // 필터 조건
    if (userType) {
      query += ` AND user_type = ?`;
      params.push(userType);
    }
    
    if (b2bCategory) {
      query += ` AND b2b_category = ?`;
      params.push(b2bCategory);
    }
    
    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }
    
    if (isActive !== undefined) {
      query += ` AND is_active = ?`;
      params.push(parseInt(isActive));
    }
    
    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    
    const stmt = DB.prepare(query);
    const result = await stmt.bind(...params).all();
    
    return c.json(result.results);
  } catch (error) {
    console.error('회원 목록 조회 오류:', error);
    return c.json({ error: '회원 목록 조회 실패' }, 500);
  }
});

// 회원 상세 조회
users.get('/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    
    const stmt = DB.prepare(`
      SELECT 
        id, email, name, phone, user_type,
        b2c_category, b2c_subcategory, b2c_stress_type,
        daily_stress_category, work_industry, work_position,
        b2b_category, b2b_business_name, b2b_business_number, b2b_address,
        b2b_business_type, b2b_independent_type,
        b2b_company_name, b2b_company_size, b2b_department, b2b_position,
        b2b_shop_name, b2b_shop_type,
        company_role, company_size, department,
        age_group, gender, region,
        oauth_provider, role, is_active, profile_image,
        created_at, updated_at, last_login_at
      FROM users
      WHERE id = ?
    `);
    
    const result = await stmt.bind(id).first();
    
    if (!result) {
      return c.json({ error: '회원을 찾을 수 없습니다' }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    console.error('회원 조회 오류:', error);
    return c.json({ error: '회원 조회 실패' }, 500);
  }
});

// 회원 정보 수정 (관리자 전용)
users.put('/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const {
      name, phone, is_active, role,
      b2b_business_name, b2b_address,
      b2b_company_name, b2b_department, b2b_position
    } = body;
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (b2b_business_name !== undefined) {
      updates.push('b2b_business_name = ?');
      params.push(b2b_business_name);
    }
    if (b2b_address !== undefined) {
      updates.push('b2b_address = ?');
      params.push(b2b_address);
    }
    if (b2b_company_name !== undefined) {
      updates.push('b2b_company_name = ?');
      params.push(b2b_company_name);
    }
    if (b2b_department !== undefined) {
      updates.push('b2b_department = ?');
      params.push(b2b_department);
    }
    if (b2b_position !== undefined) {
      updates.push('b2b_position = ?');
      params.push(b2b_position);
    }
    
    if (updates.length === 0) {
      return c.json({ error: '수정할 내용이 없습니다' }, 400);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await DB.prepare(query).bind(...params).run();
    
    return c.json({ message: '회원 정보가 수정되었습니다' });
  } catch (error) {
    console.error('회원 수정 오류:', error);
    return c.json({ error: '회원 정보 수정 실패' }, 500);
  }
});

// 회원 삭제 (관리자 전용)
users.delete('/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    
    // 관리자는 삭제 불가
    const user = await DB.prepare('SELECT role FROM users WHERE id = ?').bind(id).first();
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      return c.json({ error: '관리자 계정은 삭제할 수 없습니다' }, 403);
    }
    
    await DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    
    return c.json({ message: '회원이 삭제되었습니다' });
  } catch (error) {
    console.error('회원 삭제 오류:', error);
    return c.json({ error: '회원 삭제 실패' }, 500);
  }
});

export default users;
