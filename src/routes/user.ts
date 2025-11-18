import { Hono } from 'hono';
import type { Bindings } from '../types';

const user = new Hono<{ Bindings: Bindings }>();

// 비밀번호 해싱 함수 (Web Crypto API 사용)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// JWT 토큰에서 사용자 정보 추출
function getUserFromToken(token: string): any {
  try {
    const payload = JSON.parse(atob(token));
    return payload;
  } catch (error) {
    return null;
  }
}

// 인증 미들웨어
async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '인증이 필요합니다' }, 401);
  }
  
  const token = authHeader.substring(7);
  const tokenData = getUserFromToken(token);
  
  if (!tokenData || !tokenData.userId) {
    return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
  }
  
  // 토큰에서 사용자 ID 추출하여 context에 저장
  c.set('userId', tokenData.userId);
  c.set('userEmail', tokenData.email);
  
  await next();
}

// 모든 user 라우트에 인증 적용
user.use('/*', authMiddleware);

// 프로필 조회
user.get('/profile', async (c) => {
  try {
    const userId = c.get('userId');
    
    const user = await c.env.DB.prepare(`
      SELECT 
        id, email, name, phone, region, age_group, gender,
        user_type, role, oauth_provider, is_active,
        b2c_category, b2c_subcategory,
        b2b_category, b2b_business_name, b2b_business_number, 
        b2b_address, b2b_company_size, b2b_department, 
        b2b_position, b2b_business_type, b2b_independent_type,
        b2b_inquiry_type,
        created_at, last_login_at
      FROM users 
      WHERE id = ?
    `).bind(userId).first();
    
    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);
    }
    
    return c.json({ user });
    
  } catch (error: any) {
    console.error('프로필 조회 실패:', error);
    return c.json({ error: '프로필 조회 실패' }, 500);
  }
});

// 프로필 수정
user.put('/profile', async (c) => {
  try {
    const userId = c.get('userId');
    const data = await c.req.json();
    
    // 업데이트할 필드 목록
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    // 기본 정보
    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }
    if (data.phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(data.phone || null);
    }
    if (data.region !== undefined) {
      updateFields.push('region = ?');
      updateValues.push(data.region || null);
    }
    if (data.age_group !== undefined) {
      updateFields.push('age_group = ?');
      updateValues.push(data.age_group || null);
    }
    if (data.gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(data.gender || null);
    }
    
    // B2C 정보
    if (data.b2c_category !== undefined) {
      updateFields.push('b2c_category = ?');
      updateValues.push(data.b2c_category || null);
    }
    if (data.b2c_subcategory !== undefined) {
      updateFields.push('b2c_subcategory = ?');
      updateValues.push(data.b2c_subcategory || null);
    }
    
    // B2B 정보
    if (data.b2b_category !== undefined) {
      updateFields.push('b2b_category = ?');
      updateValues.push(data.b2b_category || null);
    }
    if (data.b2b_business_name !== undefined) {
      updateFields.push('b2b_business_name = ?');
      updateValues.push(data.b2b_business_name || null);
    }
    if (data.b2b_business_number !== undefined) {
      updateFields.push('b2b_business_number = ?');
      updateValues.push(data.b2b_business_number || null);
    }
    if (data.b2b_address !== undefined) {
      updateFields.push('b2b_address = ?');
      updateValues.push(data.b2b_address || null);
    }
    if (data.b2b_company_size !== undefined) {
      updateFields.push('b2b_company_size = ?');
      updateValues.push(data.b2b_company_size || null);
    }
    if (data.b2b_department !== undefined) {
      updateFields.push('b2b_department = ?');
      updateValues.push(data.b2b_department || null);
    }
    if (data.b2b_position !== undefined) {
      updateFields.push('b2b_position = ?');
      updateValues.push(data.b2b_position || null);
    }
    if (data.b2b_business_type !== undefined) {
      updateFields.push('b2b_business_type = ?');
      updateValues.push(data.b2b_business_type || null);
    }
    if (data.b2b_independent_type !== undefined) {
      updateFields.push('b2b_independent_type = ?');
      updateValues.push(data.b2b_independent_type || null);
    }
    if (data.b2b_inquiry_type !== undefined) {
      updateFields.push('b2b_inquiry_type = ?');
      updateValues.push(data.b2b_inquiry_type || null);
    }
    
    if (updateFields.length === 0) {
      return c.json({ error: '업데이트할 정보가 없습니다' }, 400);
    }
    
    // updated_at 추가
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // SQL 쿼리 생성 및 실행
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(userId);
    
    await c.env.DB.prepare(sql).bind(...updateValues).run();
    
    // 업데이트된 사용자 정보 조회
    const updatedUser = await c.env.DB.prepare(`
      SELECT 
        id, email, name, phone, region, age_group, gender,
        user_type, role, oauth_provider, is_active,
        b2c_category, b2c_subcategory,
        b2b_category, b2b_business_name, b2b_business_number, 
        b2b_address, b2b_company_size, b2b_department, 
        b2b_position, b2b_business_type, b2b_independent_type,
        b2b_inquiry_type,
        created_at, last_login_at
      FROM users 
      WHERE id = ?
    `).bind(userId).first();
    
    return c.json({ 
      message: '프로필이 성공적으로 업데이트되었습니다',
      user: updatedUser 
    });
    
  } catch (error: any) {
    console.error('프로필 수정 실패:', error);
    return c.json({ error: '프로필 수정 실패' }, 500);
  }
});

// 비밀번호 변경
user.put('/change-password', async (c) => {
  try {
    const userId = c.get('userId');
    const { current_password, new_password } = await c.req.json();
    
    if (!current_password || !new_password) {
      return c.json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요' }, 400);
    }
    
    if (new_password.length < 8) {
      return c.json({ error: '새 비밀번호는 8자 이상이어야 합니다' }, 400);
    }
    
    // 현재 비밀번호 확인
    const user = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(userId).first();
    
    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);
    }
    
    const currentPasswordHash = await hashPassword(current_password);
    if (currentPasswordHash !== user.password_hash) {
      return c.json({ error: '현재 비밀번호가 일치하지 않습니다' }, 400);
    }
    
    // 새 비밀번호 해싱 및 업데이트
    const newPasswordHash = await hashPassword(new_password);
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(newPasswordHash, userId).run();
    
    return c.json({ message: '비밀번호가 성공적으로 변경되었습니다' });
    
  } catch (error: any) {
    console.error('비밀번호 변경 실패:', error);
    return c.json({ error: '비밀번호 변경 실패' }, 500);
  }
});

export default user;
