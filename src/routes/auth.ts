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

// 회원가입
auth.post('/signup', async (c) => {
  try {
    const data = await c.req.json();
    const { 
      email, password, name, phone, 
      user_type, region, age_group, gender, symptoms,
      // B2C 일상 스트레스
      b2c_stress_type, daily_stress_category,
      // B2C 직무 스트레스
      work_industry, work_position,
      // B2B
      b2b_business_type, b2b_independent_type,
      b2b_company_name, b2b_company_size, b2b_department, b2b_position,
      b2b_shop_name, b2b_shop_type, b2b_inquiry_type
    } = data;
    
    // 이메일 중복 체크
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json({ error: '이미 가입된 이메일입니다' }, 400);
    }
    
    // 사용자 생성 (비밀번호는 실제로는 해싱 필요)
    const result = await c.env.DB.prepare(
      `INSERT INTO users (
        email, password, name, phone, user_type, region, age_group, gender, symptoms,
        b2c_stress_type, daily_stress_category,
        work_industry, work_position,
        b2b_business_type, b2b_independent_type,
        b2b_company_name, b2b_company_size, b2b_department, b2b_position,
        b2b_shop_name, b2b_shop_type, b2b_inquiry_type
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      email, 
      password, // TODO: bcrypt 등으로 해싱 필요
      name, 
      phone || null,
      user_type,
      region || null,
      age_group || null,
      gender || null,
      symptoms || null,
      // B2C
      b2c_stress_type || null,
      daily_stress_category || null,
      work_industry || null,
      work_position || null,
      // B2B
      b2b_business_type || null,
      b2b_independent_type || null,
      b2b_company_name || null,
      b2b_company_size || null,
      b2b_department || null,
      b2b_position || null,
      b2b_shop_name || null,
      b2b_shop_type || null,
      b2b_inquiry_type || null
    ).run();
    
    // 생성된 사용자 정보 조회
    const userId = result.meta.last_row_id;
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, user_type, b2c_stress_type, b2b_business_type FROM users WHERE id = ?'
    ).bind(userId).first();
    
    // TODO: JWT 토큰 발급
    const token = `temp_token_${userId}`; // 임시 토큰
    
    return c.json({ 
      message: '회원가입 성공',
      token,
      user
    }, 201);
    
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: '회원가입 실패', details: error.message }, 500);
  }
});

// 로그인
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND password = ?'
    ).bind(email, password).first();
    
    if (!user) {
      return c.json({ error: '이메일 또는 비밀번호가 잘못되었습니다' }, 401);
    }
    
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
        b2c_stress_type: user.b2c_stress_type,
        b2b_business_type: user.b2b_business_type,
        profile_image: user.profile_image
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: '로그인 실패' }, 500);
  }
});

// 사용자 정보 조회
auth.get('/me/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, phone, user_type, b2c_stress_type, b2b_business_type, region, symptoms, interests, source, created_at FROM users WHERE id = ?'
    ).bind(id).first();
    
    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);
    }
    
    return c.json({ user });
    
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: '사용자 조회 실패' }, 500);
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
    
    // 기존 OAuth 계정 확인
    const existingOAuth = await c.env.DB.prepare(
      'SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?'
    ).bind('naver', userInfo.id).first();
    
    let userId: number;
    
    if (existingOAuth) {
      // 기존 사용자 로그인
      userId = existingOAuth.user_id as number;
    } else {
      // 이메일로 기존 사용자 확인
      const existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(userInfo.email).first();
      
      if (existingUser) {
        // 기존 사용자에 OAuth 계정 연결
        userId = existingUser.id as number;
      } else {
        // 신규 사용자 생성
        const result = await c.env.DB.prepare(
          `INSERT INTO users (email, password, name, oauth_provider, oauth_id, profile_image, is_oauth, user_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          userInfo.email,
          '', // OAuth 사용자는 비밀번호 없음
          userInfo.name,
          'naver',
          userInfo.id,
          userInfo.profile_image || null,
          1,
          'B2C' // 기본값, 나중에 추가 정보 입력
        ).run();
        
        userId = result.meta.last_row_id as number;
      }
      
      // OAuth 계정 정보 저장
      await c.env.DB.prepare(
        `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, provider_email, provider_name, profile_image, access_token, refresh_token, token_expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+' || ? || ' seconds'))`
      ).bind(
        userId,
        'naver',
        userInfo.id,
        userInfo.email,
        userInfo.name,
        userInfo.profile_image || null,
        tokenData.access_token,
        tokenData.refresh_token || null,
        tokenData.expires_in
      ).run();
    }
    
    // 사용자 정보 조회
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();
    
    // JWT 토큰 생성
    const token = await generateToken(user as any, c.env.JWT_SECRET);
    
    // 토큰을 쿠키에 저장하고 홈으로 리다이렉트
    c.header('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    
    return c.redirect('/');
    
  } catch (error) {
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
    
    const existingOAuth = await c.env.DB.prepare(
      'SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?'
    ).bind('google', userInfo.id).first();
    
    let userId: number;
    
    if (existingOAuth) {
      userId = existingOAuth.user_id as number;
    } else {
      const existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(userInfo.email).first();
      
      if (existingUser) {
        userId = existingUser.id as number;
      } else {
        const result = await c.env.DB.prepare(
          `INSERT INTO users (email, password, name, oauth_provider, oauth_id, profile_image, is_oauth, user_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          userInfo.email,
          '',
          userInfo.name,
          'google',
          userInfo.id,
          userInfo.picture || null,
          1,
          'B2C'
        ).run();
        
        userId = result.meta.last_row_id as number;
      }
      
      await c.env.DB.prepare(
        `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, provider_email, provider_name, profile_image, access_token, refresh_token, token_expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+' || ? || ' seconds'))`
      ).bind(
        userId,
        'google',
        userInfo.id,
        userInfo.email,
        userInfo.name,
        userInfo.picture || null,
        tokenData.access_token,
        tokenData.refresh_token || null,
        tokenData.expires_in
      ).run();
    }
    
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();
    
    const token = await generateToken(user as any, c.env.JWT_SECRET);
    
    c.header('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    
    return c.redirect('/');
    
  } catch (error) {
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
    
    const existingOAuth = await c.env.DB.prepare(
      'SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?'
    ).bind('kakao', userInfo.id).first();
    
    let userId: number;
    
    if (existingOAuth) {
      userId = existingOAuth.user_id as number;
    } else {
      const existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(userInfo.email).first();
      
      if (existingUser) {
        userId = existingUser.id as number;
      } else {
        const result = await c.env.DB.prepare(
          `INSERT INTO users (email, password, name, oauth_provider, oauth_id, profile_image, is_oauth, user_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          userInfo.email,
          '',
          userInfo.name,
          'kakao',
          userInfo.id,
          userInfo.profile_image || null,
          1,
          'B2C'
        ).run();
        
        userId = result.meta.last_row_id as number;
      }
      
      await c.env.DB.prepare(
        `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, provider_email, provider_name, profile_image, access_token, refresh_token, token_expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+' || ? || ' seconds'))`
      ).bind(
        userId,
        'kakao',
        userInfo.id,
        userInfo.email,
        userInfo.name,
        userInfo.profile_image || null,
        tokenData.access_token,
        tokenData.refresh_token || null,
        tokenData.expires_in
      ).run();
    }
    
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();
    
    const token = await generateToken(user as any, c.env.JWT_SECRET);
    
    c.header('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    
    return c.redirect('/');
    
  } catch (error) {
    console.error('Kakao OAuth error:', error);
    return c.redirect('/static/login.html?error=auth_failed');
  }
});

export default auth;
