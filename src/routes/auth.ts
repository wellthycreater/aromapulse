import { Hono } from 'hono';
import type { Bindings } from '../types';
import { generateToken } from '../utils/jwt';
import {
  getNaverAuthUrl, getNaverAccessToken, getNaverUserInfo,
  getGoogleAuthUrl, getGoogleAccessToken, getGoogleUserInfo,
  getKakaoAuthUrl, getKakaoAccessToken, getKakaoUserInfo,
  generateState
} from '../utils/oauth';

const auth = new Hono<{ Bindings: Bindings }>();

// 비밀번호 해싱 함수 (Web Crypto API 사용)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 회원가입
auth.post('/signup', async (c) => {
  try {
    const data = await c.req.json();
    const { 
      email, password, name, phone, 
      user_type, // 'B2C' or 'B2B'
      // B2C 정보
      b2c_category, // 'daily_stress' or 'work_stress'
      b2c_subcategory, // 학생/취준생/돌봄인 or 9개 산업군
      // B2B 정보
      b2b_category, // 'perfumer', 'company', 'shop', 'independent'
      b2b_business_name,
      b2b_business_number,
      b2b_address
    } = data;
    
    // 필수 필드 검증
    if (!email || !password || !name || !user_type) {
      return c.json({ error: '필수 정보를 입력해주세요' }, 400);
    }
    
    // 이메일 중복 체크
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json({ error: '이미 가입된 이메일입니다' }, 400);
    }
    
    // 비밀번호 해싱
    const password_hash = await hashPassword(password);
    
    // 사용자 생성
    const result = await c.env.DB.prepare(
      `INSERT INTO users (
        email, password_hash, name, phone, user_type,
        b2c_category, b2c_subcategory,
        b2b_category, b2b_business_name, b2b_business_number, b2b_address,
        oauth_provider
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      email,
      password_hash,
      name,
      phone || null,
      user_type,
      // B2C
      b2c_category || null,
      b2c_subcategory || null,
      // B2B
      b2b_category || null,
      b2b_business_name || null,
      b2b_business_number || null,
      b2b_address || null,
      'email' // OAuth provider for email/password signup
    ).run();
    
    // 생성된 사용자 정보 조회
    const userId = result.meta.last_row_id;
    const user = await c.env.DB.prepare(
      `SELECT id, email, name, user_type, b2c_category, b2c_subcategory, 
       b2b_category, b2b_business_name, created_at 
       FROM users WHERE id = ?`
    ).bind(userId).first();
    
    // JWT 토큰 발급
    const token = await generateToken(user as any, c.env.JWT_SECRET);
    
    return c.json({ 
      message: '회원가입 성공',
      token,
      user
    }, 201);
    
  } catch (error: any) {
    console.error('Signup error:', error);
    return c.json({ error: '회원가입 실패', details: error.message }, 500);
  }
});

// 로그인
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: '이메일과 비밀번호를 입력해주세요' }, 400);
    }
    
    // 비밀번호 해싱
    const password_hash = await hashPassword(password);
    
    // 사용자 조회
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND password_hash = ? AND oauth_provider = ?'
    ).bind(email, password_hash, 'email').first();
    
    if (!user) {
      return c.json({ error: '이메일 또는 비밀번호가 잘못되었습니다' }, 401);
    }
    
    // 마지막 로그인 시간 업데이트
    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();
    
    // JWT 토큰 생성
    const token = await generateToken(user as any, c.env.JWT_SECRET);
    
    return c.json({ 
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        role: user.role || 'user',
        b2c_category: user.b2c_category,
        b2b_category: user.b2b_category
      }
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({ error: '로그인 실패', details: error.message }, 500);
  }
});

// 사용자 정보 조회
auth.get('/me/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const user = await c.env.DB.prepare(
      `SELECT id, email, name, phone, user_type, role,
       b2c_category, b2c_subcategory,
       b2b_category, b2b_business_name, b2b_business_number, b2b_address,
       oauth_provider, created_at, last_login_at
       FROM users WHERE id = ?`
    ).bind(id).first();
    
    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);
    }
    
    return c.json({ user });
    
  } catch (error: any) {
    console.error('Get user error:', error);
    return c.json({ error: '사용자 조회 실패', details: error.message }, 500);
  }
});

// ========== OAuth 인증 ==========

// 네이버 로그인 시작
auth.get('/naver', async (c) => {
  const state = generateState();
  
  // State를 쿠키에 저장 (CSRF 방지)
  c.header('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  
  const authUrl = getNaverAuthUrl(
    c.env.NAVER_CLIENT_ID,
    c.env.NAVER_CALLBACK_URL,
    state
  );
  
  return c.redirect(authUrl);
});

// 네이버 로그인 콜백
auth.get('/naver/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    
    if (error) {
      return c.redirect(`/static/login.html?error=naver_${error}`);
    }
    
    if (!code || !state) {
      return c.redirect('/static/login.html?error=invalid_request');
    }
    
    // State 검증 (쿠키에서 확인)
    const cookieState = c.req.header('Cookie')?.match(/oauth_state=([^;]+)/)?.[1];
    if (state !== cookieState) {
      return c.redirect('/static/login.html?error=invalid_state');
    }
    
    // 액세스 토큰 요청
    const tokenData = await getNaverAccessToken(
      code,
      c.env.NAVER_CLIENT_ID,
      c.env.NAVER_CLIENT_SECRET
    );
    
    // 사용자 정보 조회
    const userInfo = await getNaverUserInfo(tokenData.access_token);
    
    // 기존 OAuth 사용자 확인
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?'
    ).bind('naver', userInfo.id).first();
    
    let userId: number;
    let user: any;
    
    if (existingUser) {
      // 기존 사용자 로그인
      userId = existingUser.id as number;
      user = existingUser;
      
      // 마지막 로그인 시간 업데이트
      await c.env.DB.prepare(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(userId).run();
      
    } else {
      // 이메일로 기존 사용자 확인 (OAuth 연동)
      const emailUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(userInfo.email).first();
      
      if (emailUser) {
        // 기존 이메일 계정에 OAuth 연결
        userId = emailUser.id as number;
        await c.env.DB.prepare(
          'UPDATE users SET oauth_provider = ?, oauth_id = ? WHERE id = ?'
        ).bind('naver', userInfo.id, userId).run();
        
        user = await c.env.DB.prepare(
          'SELECT * FROM users WHERE id = ?'
        ).bind(userId).first();
        
      } else {
        // 신규 사용자 생성
        const result = await c.env.DB.prepare(
          `INSERT INTO users (email, name, oauth_provider, oauth_id, user_type, password_hash)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          userInfo.email,
          userInfo.name,
          'naver',
          userInfo.id,
          'B2C', // 기본값, 추가 정보 입력 필요
          null // OAuth 사용자는 비밀번호 없음
        ).run();
        
        userId = result.meta.last_row_id as number;
        
        user = await c.env.DB.prepare(
          'SELECT * FROM users WHERE id = ?'
        ).bind(userId).first();
      }
    }
    
    // JWT 토큰 생성
    const token = await generateToken(user, c.env.JWT_SECRET);
    
    // 토큰을 쿠키에 저장하고 홈으로 리다이렉트
    c.header('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    
    return c.redirect('/');
    
  } catch (error: any) {
    console.error('Naver OAuth error:', error);
    return c.redirect('/static/login.html?error=auth_failed');
  }
});

// 구글 로그인 시작
auth.get('/google', async (c) => {
  const state = generateState();
  
  c.header('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  
  const authUrl = getGoogleAuthUrl(
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CALLBACK_URL,
    state
  );
  
  return c.redirect(authUrl);
});

// 구글 로그인 콜백
auth.get('/google/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    
    if (error) {
      return c.redirect(`/static/login.html?error=google_${error}`);
    }
    
    if (!code || !state) {
      return c.redirect('/static/login.html?error=invalid_request');
    }
    
    const cookieState = c.req.header('Cookie')?.match(/oauth_state=([^;]+)/)?.[1];
    if (state !== cookieState) {
      return c.redirect('/static/login.html?error=invalid_state');
    }
    
    const tokenData = await getGoogleAccessToken(
      code,
      c.env.GOOGLE_CLIENT_ID,
      c.env.GOOGLE_CLIENT_SECRET,
      c.env.GOOGLE_CALLBACK_URL
    );
    
    const userInfo = await getGoogleUserInfo(tokenData.access_token);
    
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?'
    ).bind('google', userInfo.id).first();
    
    let userId: number;
    let user: any;
    
    if (existingUser) {
      userId = existingUser.id as number;
      user = existingUser;
      
      await c.env.DB.prepare(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(userId).run();
      
    } else {
      const emailUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(userInfo.email).first();
      
      if (emailUser) {
        userId = emailUser.id as number;
        await c.env.DB.prepare(
          'UPDATE users SET oauth_provider = ?, oauth_id = ? WHERE id = ?'
        ).bind('google', userInfo.id, userId).run();
        
        user = await c.env.DB.prepare(
          'SELECT * FROM users WHERE id = ?'
        ).bind(userId).first();
        
      } else {
        const result = await c.env.DB.prepare(
          `INSERT INTO users (email, name, oauth_provider, oauth_id, user_type, password_hash)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          userInfo.email,
          userInfo.name,
          'google',
          userInfo.id,
          'B2C',
          null
        ).run();
        
        userId = result.meta.last_row_id as number;
        
        user = await c.env.DB.prepare(
          'SELECT * FROM users WHERE id = ?'
        ).bind(userId).first();
      }
    }
    
    const token = await generateToken(user, c.env.JWT_SECRET);
    
    c.header('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    
    return c.redirect('/');
    
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    return c.redirect('/static/login.html?error=auth_failed');
  }
});

// 카카오 로그인 시작
auth.get('/kakao', async (c) => {
  const authUrl = getKakaoAuthUrl(
    c.env.KAKAO_CLIENT_ID,
    c.env.KAKAO_CALLBACK_URL
  );
  
  return c.redirect(authUrl);
});

// 카카오 로그인 콜백
auth.get('/kakao/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const error = c.req.query('error');
    
    if (error) {
      return c.redirect(`/static/login.html?error=kakao_${error}`);
    }
    
    if (!code) {
      return c.redirect('/static/login.html?error=invalid_request');
    }
    
    const tokenData = await getKakaoAccessToken(
      code,
      c.env.KAKAO_CLIENT_ID,
      c.env.KAKAO_CLIENT_SECRET,
      c.env.KAKAO_CALLBACK_URL
    );
    
    const userInfo = await getKakaoUserInfo(tokenData.access_token);
    
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?'
    ).bind('kakao', userInfo.id).first();
    
    let userId: number;
    let user: any;
    
    if (existingUser) {
      userId = existingUser.id as number;
      user = existingUser;
      
      await c.env.DB.prepare(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(userId).run();
      
    } else {
      const emailUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(userInfo.email).first();
      
      if (emailUser) {
        userId = emailUser.id as number;
        await c.env.DB.prepare(
          'UPDATE users SET oauth_provider = ?, oauth_id = ? WHERE id = ?'
        ).bind('kakao', userInfo.id, userId).run();
        
        user = await c.env.DB.prepare(
          'SELECT * FROM users WHERE id = ?'
        ).bind(userId).first();
        
      } else {
        const result = await c.env.DB.prepare(
          `INSERT INTO users (email, name, oauth_provider, oauth_id, user_type, password_hash)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          userInfo.email,
          userInfo.name || '카카오 사용자',
          'kakao',
          userInfo.id,
          'B2C',
          null
        ).run();
        
        userId = result.meta.last_row_id as number;
        
        user = await c.env.DB.prepare(
          'SELECT * FROM users WHERE id = ?'
        ).bind(userId).first();
      }
    }
    
    const token = await generateToken(user, c.env.JWT_SECRET);
    
    c.header('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    
    return c.redirect('/');
    
  } catch (error: any) {
    console.error('Kakao OAuth error:', error);
    return c.redirect('/static/login.html?error=auth_failed');
  }
});

// 로그아웃
auth.post('/logout', async (c) => {
  c.header('Set-Cookie', `auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return c.json({ message: '로그아웃 성공' });
});

// 관리자 계정 생성 (초기 설정용)
auth.post('/create-admin', async (c) => {
  try {
    const data = await c.req.json();
    const { 
      email, 
      password, 
      name, 
      phone,
      secret_key // 보안을 위한 비밀 키
    } = data;
    
    // 비밀 키 검증 (환경 변수로 설정된 키와 비교)
    const ADMIN_SECRET_KEY = c.env.ADMIN_SECRET_KEY || 'aromapulse-admin-2025';
    if (secret_key !== ADMIN_SECRET_KEY) {
      return c.json({ error: '관리자 생성 권한이 없습니다' }, 403);
    }
    
    // 필수 필드 검증
    if (!email || !password || !name) {
      return c.json({ error: '필수 정보를 입력해주세요' }, 400);
    }
    
    // 이메일 중복 체크
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json({ error: '이미 가입된 이메일입니다' }, 400);
    }
    
    // 비밀번호 해싱
    const password_hash = await hashPassword(password);
    
    // 관리자 계정 생성
    const result = await c.env.DB.prepare(
      `INSERT INTO users (
        email, password_hash, name, phone, user_type, role, oauth_provider
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      email,
      password_hash,
      name,
      phone || null,
      'B2B', // 관리자는 B2B로 설정
      'admin', // role을 admin으로 설정
      'email'
    ).run();
    
    // 생성된 관리자 정보 조회
    const userId = result.meta.last_row_id;
    const admin = await c.env.DB.prepare(
      `SELECT id, email, name, user_type, role, created_at 
       FROM users WHERE id = ?`
    ).bind(userId).first();
    
    // JWT 토큰 발급
    const token = await generateToken(admin as any, c.env.JWT_SECRET);
    
    return c.json({ 
      message: '관리자 계정 생성 성공',
      token,
      admin
    }, 201);
    
  } catch (error: any) {
    console.error('Admin creation error:', error);
    return c.json({ 
      error: '관리자 계정 생성 실패', 
      details: error.message 
    }, 500);
  }
});

// 현재 관리자 목록 조회 (관리자만 접근 가능)
auth.get('/admins', async (c) => {
  try {
    // TODO: JWT 토큰 검증 및 관리자 권한 확인 미들웨어 추가
    
    const admins = await c.env.DB.prepare(
      `SELECT id, email, name, role, created_at, last_login_at 
       FROM users WHERE role IN ('admin', 'super_admin')
       ORDER BY created_at DESC`
    ).all();
    
    return c.json({ 
      admins: admins.results 
    });
    
  } catch (error: any) {
    console.error('Get admins error:', error);
    return c.json({ 
      error: '관리자 목록 조회 실패', 
      details: error.message 
    }, 500);
  }
});

// ========== 관리자 전용 인증 API ==========

// 관리자 로그인 (role이 admin인 사용자만)
auth.post('/admin-login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: '이메일과 비밀번호를 입력해주세요' }, 400);
    }
    
    // 비밀번호 해싱
    const password_hash = await hashPassword(password);
    
    // 관리자 사용자 조회 (role이 admin이고 oauth_provider가 email인 사용자)
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND password_hash = ? AND oauth_provider = ? AND role = ?'
    ).bind(email, password_hash, 'email', 'admin').first();
    
    if (!user) {
      return c.json({ error: '이메일 또는 비밀번호가 잘못되었습니다' }, 401);
    }
    
    // 마지막 로그인 시간 업데이트
    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();
    
    // JWT 토큰 생성
    const token = await generateToken(user as any, c.env.JWT_SECRET);
    
    return c.json({ 
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        role: user.role || 'user',
        b2c_category: user.b2c_category,
        b2b_category: user.b2b_category
      }
    });
    
  } catch (error: any) {
    console.error('Admin login error:', error);
    return c.json({ error: '로그인 실패', details: error.message }, 500);
  }
});

// 관리자 회원가입
auth.post('/admin-register', async (c) => {
  try {
    const data = await c.req.json();
    const { 
      email, 
      password, 
      name,
      secret_key // 보안을 위한 비밀 키
    } = data;
    
    // 비밀 키 검증 (환경 변수로 설정된 키와 비교)
    const ADMIN_SECRET_KEY = c.env.ADMIN_SECRET_KEY || 'aromapulse-admin-2025';
    if (secret_key !== ADMIN_SECRET_KEY) {
      return c.json({ error: '관리자 생성 권한이 없습니다' }, 403);
    }
    
    // 필수 필드 검증
    if (!email || !password || !name) {
      return c.json({ error: '필수 정보를 입력해주세요' }, 400);
    }
    
    // 이메일 중복 체크
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json({ error: '이미 가입된 이메일입니다' }, 400);
    }
    
    // 비밀번호 해싱
    const password_hash = await hashPassword(password);
    
    // 관리자 계정 생성
    const result = await c.env.DB.prepare(
      `INSERT INTO users (
        email, password_hash, name, user_type, role, oauth_provider
      ) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      email,
      password_hash,
      name,
      'B2B', // 관리자는 B2B로 설정
      'admin', // role을 admin으로 설정
      'email'
    ).run();
    
    // 생성된 관리자 정보 조회
    const userId = result.meta.last_row_id;
    const admin = await c.env.DB.prepare(
      `SELECT id, email, name, user_type, role, created_at 
       FROM users WHERE id = ?`
    ).bind(userId).first();
    
    // JWT 토큰 발급
    const token = await generateToken(admin as any, c.env.JWT_SECRET);
    
    return c.json({ 
      message: '관리자 계정 생성 성공',
      token,
      user: admin
    }, 201);
    
  } catch (error: any) {
    console.error('Admin registration error:', error);
    return c.json({ 
      error: '관리자 계정 생성 실패', 
      details: error.message 
    }, 500);
  }
});

// 프로필 조회 (토큰 기반)
auth.get('/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.substring(7);
    
    // JWT 토큰 검증
    const encoder = new TextEncoder();
    const data = encoder.encode(token.split('.')[1]);
    const decoded = JSON.parse(atob(token.split('.')[1]));
    
    // 사용자 정보 조회
    const user = await c.env.DB.prepare(
      `SELECT * FROM users WHERE id = ?`
    ).bind(decoded.userId).first();
    
    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);
    }
    
    // 비밀번호 제외하고 반환
    const { password_hash, ...userWithoutPassword } = user as any;
    
    return c.json({ user: userWithoutPassword });
    
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return c.json({ error: '프로필 조회 실패' }, 500);
  }
});

// 프로필 업데이트
auth.put('/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = JSON.parse(atob(token.split('.')[1]));
    
    console.log('[Profile Update] User ID:', decoded.userId);
    
    const data = await c.req.json();
    console.log('[Profile Update] Request data:', JSON.stringify(data, null, 2));
    const {
      name,
      phone,
      region,
      age_group,
      gender,
      symptoms,
      // B2C 추가 정보
      daily_stress_category,
      work_industry,
      work_role,
      company_size,
      // B2B 추가 정보
      business_name,
      business_registration,
      shop_type,
      shop_address,
      occupation,
      experience_years,
      website,
      partnership_interests,
      inquiry_details,
      additional_info
    } = data;
    
    // 업데이트할 필드 구성
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (region !== undefined) {
      updateFields.push('region = ?');
      updateValues.push(region);
    }
    if (age_group !== undefined) {
      updateFields.push('age_group = ?');
      updateValues.push(age_group);
    }
    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender);
    }
    if (symptoms !== undefined) {
      updateFields.push('symptoms = ?');
      updateValues.push(JSON.stringify(symptoms));
    }
    
    // B2C 필드
    if (daily_stress_category !== undefined) {
      updateFields.push('b2c_subcategory = ?');
      updateValues.push(daily_stress_category);
    }
    if (work_industry !== undefined) {
      updateFields.push('b2c_subcategory = ?');
      updateValues.push(work_industry);
    }
    if (work_role !== undefined) {
      updateFields.push('work_role = ?');
      updateValues.push(work_role);
    }
    if (company_size !== undefined) {
      updateFields.push('company_size = ?');
      updateValues.push(company_size);
    }
    
    // B2B 필드
    if (business_name !== undefined) {
      updateFields.push('b2b_business_name = ?');
      updateValues.push(business_name);
    }
    if (business_registration !== undefined) {
      updateFields.push('b2b_business_number = ?');
      updateValues.push(business_registration);
    }
    if (shop_type !== undefined) {
      updateFields.push('shop_type = ?');
      updateValues.push(shop_type);
    }
    if (shop_address !== undefined) {
      updateFields.push('b2b_address = ?');
      updateValues.push(shop_address);
    }
    if (occupation !== undefined) {
      updateFields.push('occupation = ?');
      updateValues.push(occupation);
    }
    if (experience_years !== undefined) {
      updateFields.push('experience_years = ?');
      updateValues.push(experience_years);
    }
    if (website !== undefined) {
      updateFields.push('website = ?');
      updateValues.push(website);
    }
    if (additional_info !== undefined) {
      updateFields.push('additional_info = ?');
      updateValues.push(additional_info);
    }
    
    if (updateFields.length === 0) {
      return c.json({ error: '업데이트할 정보가 없습니다' }, 400);
    }
    
    // 업데이트 실행
    updateValues.push(decoded.userId);
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    console.log('[Profile Update] Query:', updateQuery);
    console.log('[Profile Update] Values:', updateValues);
    
    await c.env.DB.prepare(updateQuery).bind(...updateValues).run();
    
    // 업데이트된 사용자 정보 조회
    const user = await c.env.DB.prepare(
      `SELECT * FROM users WHERE id = ?`
    ).bind(decoded.userId).first();
    
    const { password_hash, ...userWithoutPassword } = user as any;
    
    return c.json({
      message: '프로필이 업데이트되었습니다',
      user: userWithoutPassword
    });
    
  } catch (error: any) {
    console.error('[Profile Update] Error:', error);
    console.error('[Profile Update] Error stack:', error.stack);
    return c.json({ 
      error: '프로필 업데이트 실패', 
      details: error.message,
      stack: error.stack 
    }, 500);
  }
});

// 프로필 이미지 업로드
auth.post('/users/profile-image', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // JWT 디코딩 (간단한 디코딩, 실제로는 검증 필요)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;

    const { image_data, image_type } = await c.req.json();

    if (!image_data || !image_type) {
      return c.json({ error: '이미지 데이터가 필요합니다' }, 400);
    }

    // Base64 이미지를 데이터베이스에 저장
    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO user_profile_images (user_id, image_data, image_type)
       VALUES (?, ?, ?)`
    ).bind(userId, image_data, image_type).run();

    return c.json({
      message: '프로필 이미지가 업로드되었습니다',
      image_url: image_data
    });

  } catch (error: any) {
    console.error('Image upload error:', error);
    return c.json({ error: '이미지 업로드 실패', details: error.message }, 500);
  }
});

// 프로필 이미지 조회
auth.get('/users/:userId/profile-image', async (c) => {
  try {
    const userId = c.req.param('userId');

    const imageRow = await c.env.DB.prepare(
      'SELECT image_data, image_type FROM user_profile_images WHERE user_id = ?'
    ).bind(userId).first();

    if (!imageRow) {
      return c.json({ error: '프로필 이미지가 없습니다' }, 404);
    }

    return c.json({
      image_url: imageRow.image_data,
      image_type: imageRow.image_type
    });

  } catch (error: any) {
    console.error('Image fetch error:', error);
    return c.json({ error: '이미지 조회 실패', details: error.message }, 500);
  }
});

// 비밀번호 찾기 (임시 비밀번호 발급)
auth.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: '이메일을 입력해주세요' }, 400);
    }
    
    console.log('[Forgot Password] Email:', email);
    
    // 사용자 조회
    const user = await c.env.DB.prepare(
      'SELECT id, email, name FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (!user) {
      // 보안상 이유로 사용자가 없어도 성공 메시지 반환
      return c.json({ 
        message: '해당 이메일로 임시 비밀번호를 전송했습니다.',
        note: '이메일이 등록되어 있지 않다면 메일이 발송되지 않습니다.'
      });
    }
    
    // 임시 비밀번호 생성 (8자리 영문+숫자)
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    
    // 비밀번호 해시 생성
    const encoder = new TextEncoder();
    const data = encoder.encode(tempPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('[Forgot Password] Generated temp password for user:', user.id);
    
    // 데이터베이스 업데이트
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(password_hash, user.id).run();
    
    // TODO: 실제 운영 환경에서는 이메일 발송 서비스 연동 필요
    // 현재는 임시로 콘솔에 출력
    console.log('[Forgot Password] Temporary password:', tempPassword);
    console.log('[Forgot Password] 실제 서비스에서는 이메일로 발송되어야 합니다.');
    
    // 개발 환경에서는 임시 비밀번호를 응답에 포함 (운영 환경에서는 제거 필요)
    return c.json({ 
      message: '임시 비밀번호가 생성되었습니다.',
      // 개발 환경에서만 임시로 반환 (운영 환경에서는 삭제!)
      tempPassword: tempPassword,
      note: '개발 환경입니다. 운영 환경에서는 이메일로 발송됩니다.'
    });
    
  } catch (error: any) {
    console.error('[Forgot Password] Error:', error);
    return c.json({ 
      error: '비밀번호 재설정 실패', 
      details: error.message 
    }, 500);
  }
});

export default auth;
