import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Bindings } from '../types';
import { verifyToken } from '../utils/jwt';

const user = new Hono<{ Bindings: Bindings }>();

// 전역 에러 핸들러
user.onError((err, c) => {
  console.error('[Global Error Handler]', err);
  console.error('[Global Error Handler] Message:', err.message);
  console.error('[Global Error Handler] Stack:', err.stack);
  
  return c.json({
    error: '서버 오류가 발생했습니다',
    message: err.message,
    stack: err.stack
  }, 500);
});

// 공개 API: CSS 스타일 반환 (인증 불필요)
user.get('/mypage-styles', async (c) => {
  const css = `
    /* 프로필 아바타 - 보라색 그라데이션 */
    .profile-avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3) !important;
    }
    
    /* 더 강력한 선택자로 모든 경우 커버 */
    div.profile-avatar,
    .profile-avatar.rounded-full,
    div[class*="profile-avatar"] {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      background-color: transparent !important;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3) !important;
    }
    
    /* 인라인 스타일도 강제 덮어쓰기 */
    [onclick*="profile-image-input"] {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    }
  `;
  
  return c.text(css, 200, {
    'Content-Type': 'text/css',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
});

// 비밀번호 해싱 함수 (Web Crypto API 사용)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 인증 미들웨어 (쿠키 기반)
async function authMiddleware(c: any, next: any) {
  // 쿠키에서 토큰 가져오기
  const token = getCookie(c, 'auth_token');
  
  console.log('🔐 Auth middleware - Cookie token:', token ? 'Present' : 'Missing');
  
  if (!token) {
    console.error('❌ Auth failed: No auth_token cookie');
    return c.json({ error: '인증이 필요합니다' }, 401);
  }
  
  console.log('🎫 Token received (first 20 chars):', token.substring(0, 20) + '...');
  
  // JWT_SECRET 확인
  if (!c.env.JWT_SECRET) {
    console.error('❌ CRITICAL: JWT_SECRET is not set!');
    return c.json({ error: 'JWT_SECRET 환경변수가 설정되지 않았습니다' }, 500);
  }
  
  console.log('🔑 JWT_SECRET present:', c.env.JWT_SECRET ? 'Yes' : 'No');
  
  try {
    // JWT 토큰 검증
    const tokenData = await verifyToken(token, c.env.JWT_SECRET);
    
    console.log('✅ Token verified successfully:', { userId: tokenData.userId, email: tokenData.email });
    
    if (!tokenData || !tokenData.userId) {
      console.error('❌ Invalid token data:', tokenData);
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // 토큰에서 사용자 ID 추출하여 context에 저장
    c.set('userId', tokenData.userId);
    c.set('userEmail', tokenData.email);
    
    await next();
  } catch (error: any) {
    console.error('❌ Token verification failed:', error.message);
    console.error('Error stack:', error.stack);
    return c.json({ error: '토큰 인증 실패: ' + error.message }, 401);
  }
}

// 모든 user 라우트에 인증 적용
user.use('/*', authMiddleware);

// 프로필 조회
user.get('/profile', async (c) => {
  try {
    const userId = c.get('userId');
    console.log('[GET /profile] userId:', userId);
    
    if (!userId) {
      console.error('[GET /profile] No userId in context');
      return c.json({ error: '인증 정보가 없습니다' }, 401);
    }
    
    const user = await c.env.DB.prepare(`
      SELECT 
        id, email, name, phone, region, age_group, gender,
        user_type, role, oauth_provider, is_active,
        profile_image,
        b2c_category, b2c_subcategory,
        b2b_category, b2b_business_name, b2b_business_number, 
        b2b_address, company_size as b2b_company_size, 
        department as b2b_department, position as b2b_position,
        created_at, last_login_at,
        b2b_address as address
      FROM users 
      WHERE id = ?
    `).bind(userId).first();
    
    console.log('[GET /profile] Query result:', user ? 'User found' : 'User not found');
    
    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);
    }
    
    return c.json({ user });
    
  } catch (error: any) {
    console.error('[GET /profile] Error:', error);
    console.error('[GET /profile] Error message:', error.message);
    console.error('[GET /profile] Error stack:', error.stack);
    return c.json({ 
      error: '프로필 조회 실패', 
      details: error.message,
      stack: error.stack 
    }, 500);
  }
});

// 프로필 수정
user.put('/profile', async (c) => {
  try {
    const userId = c.get('userId');
    console.log('[PUT /profile] userId:', userId);
    
    if (!userId) {
      console.error('[PUT /profile] No userId in context');
      return c.json({ error: '인증 정보가 없습니다' }, 401);
    }
    
    const data = await c.req.json();
    console.log('📦 Update data received:', JSON.stringify(data));
    
    // 업데이트할 필드 목록
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    // 기본 정보
    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }
    // 이메일 업데이트 (OAuth 사용자는 변경 불가)
    if (data.email !== undefined) {
      try {
        // 현재 사용자 정보 조회
        const currentUser = await c.env.DB.prepare(
          'SELECT oauth_provider FROM users WHERE id = ?'
        ).bind(userId).first<{ oauth_provider: string | null }>();
        
        console.log('[Profile Update] Current user oauth_provider:', currentUser?.oauth_provider);
        
        if (currentUser && currentUser.oauth_provider && currentUser.oauth_provider !== 'local' && currentUser.oauth_provider !== null) {
          return c.json({ error: 'OAuth 로그인 사용자는 이메일을 변경할 수 없습니다' }, 400);
        }
        
        // 이메일 중복 체크
        const existingUser = await c.env.DB.prepare(
          'SELECT id FROM users WHERE email = ? AND id != ?'
        ).bind(data.email, userId).first();
        
        if (existingUser) {
          return c.json({ error: '이미 사용 중인 이메일입니다' }, 400);
        }
        
        updateFields.push('email = ?');
        updateValues.push(data.email);
      } catch (emailCheckError: any) {
        console.error('[Profile Update] Email check error:', emailCheckError);
        // 에러가 발생해도 계속 진행 (이메일 업데이트 건너뛰기)
        console.warn('[Profile Update] Skipping email update due to check error');
      }
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
    if (data.profile_image !== undefined) {
      updateFields.push('profile_image = ?');
      updateValues.push(data.profile_image || null);
    }
    // address 필드는 b2b_address로 매핑
    if (data.address !== undefined) {
      updateFields.push('b2b_address = ?');
      updateValues.push(data.address || null);
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
      updateFields.push('company_size = ?');
      updateValues.push(data.b2b_company_size || null);
    }
    if (data.b2b_department !== undefined) {
      updateFields.push('department = ?');
      updateValues.push(data.b2b_department || null);
    }
    if (data.b2b_position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(data.b2b_position || null);
    }
    
    if (updateFields.length === 0) {
      return c.json({ error: '업데이트할 정보가 없습니다' }, 400);
    }
    
    // SQL 쿼리 생성 및 실행
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(userId);
    
    console.log('🗄️ Executing SQL:', sql);
    console.log('📊 SQL values:', updateValues);
    
    const result = await c.env.DB.prepare(sql).bind(...updateValues).run();
    console.log('✅ SQL executed successfully:', result);
    
    // 업데이트된 사용자 정보 조회
    const updatedUser = await c.env.DB.prepare(`
      SELECT 
        id, email, name, phone, region, age_group, gender,
        user_type, role, oauth_provider, is_active,
        profile_image,
        b2c_category, b2c_subcategory,
        b2b_category, b2b_business_name, b2b_business_number, 
        b2b_address, company_size as b2b_company_size, 
        department as b2b_department, position as b2b_position,
        created_at, last_login_at,
        b2b_address as address
      FROM users 
      WHERE id = ?
    `).bind(userId).first();
    
    // 업데이트된 사용자 정보로 새 JWT 토큰 생성
    const { generateToken } = await import('../utils/jwt');
    const newToken = await generateToken(updatedUser as any, c.env.JWT_SECRET);
    
    return c.json({ 
      message: '프로필이 성공적으로 업데이트되었습니다',
      user: updatedUser,
      token: newToken  // 새 토큰 포함
    });
    
  } catch (error: any) {
    console.error('❌ 프로필 수정 실패:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return c.json({ 
      error: '프로필 수정 실패',
      details: error.message,
      stack: error.stack 
    }, 500);
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
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(newPasswordHash, userId).run();
    
    return c.json({ message: '비밀번호가 성공적으로 변경되었습니다' });
    
  } catch (error: any) {
    console.error('비밀번호 변경 실패:', error);
    return c.json({ error: '비밀번호 변경 실패' }, 500);
  }
});

// 프로필 이미지 업로드
user.post('/profile-image', async (c) => {
  try {
    const userId = c.get('userId');
    const { imageData } = await c.req.json();
    
    if (!imageData) {
      return c.json({ error: '이미지 데이터가 없습니다' }, 400);
    }
    
    // Data URL 형식 검증 (data:image/jpeg;base64,... 또는 data:image/png;base64,...)
    if (!imageData.startsWith('data:image/')) {
      return c.json({ error: '유효하지 않은 이미지 형식입니다' }, 400);
    }
    
    // 이미지 크기 검증 (Base64 문자열 길이로 대략적인 크기 계산)
    // Base64는 원본의 약 133% 크기이므로, 1MB 제한 = 약 1.33MB Base64
    const maxSize = 1.5 * 1024 * 1024; // 1.5MB Base64 문자열 (약 1MB 원본 이미지)
    if (imageData.length > maxSize) {
      return c.json({ error: '이미지 크기가 너무 큽니다 (최대 1MB)' }, 400);
    }
    
    console.log('Uploading profile image for user:', userId);
    console.log('Image data length:', imageData.length);
    
    // 데이터베이스에 이미지 저장
    await c.env.DB.prepare(
      'UPDATE users SET profile_image = ? WHERE id = ?'
    ).bind(imageData, userId).run();
    
    console.log('Profile image uploaded successfully');
    
    return c.json({ 
      message: '프로필 이미지가 성공적으로 업로드되었습니다',
      imageUrl: imageData 
    });
    
  } catch (error: any) {
    console.error('프로필 이미지 업로드 실패:', error);
    return c.json({ error: '프로필 이미지 업로드 실패' }, 500);
  }
});

// 프로필 이미지 삭제
user.delete('/profile-image', async (c) => {
  try {
    const userId = c.get('userId');
    
    console.log('Deleting profile image for user:', userId);
    
    // 데이터베이스에서 이미지 제거
    await c.env.DB.prepare(
      'UPDATE users SET profile_image = NULL WHERE id = ?'
    ).bind(userId).run();
    
    console.log('Profile image deleted successfully');
    
    return c.json({ message: '프로필 이미지가 성공적으로 삭제되었습니다' });
    
  } catch (error: any) {
    console.error('프로필 이미지 삭제 실패:', error);
    return c.json({ error: '프로필 이미지 삭제 실패' }, 500);
  }
});

export default user;
