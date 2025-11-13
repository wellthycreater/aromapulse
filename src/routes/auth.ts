import { Hono } from 'hono';
import type { Bindings } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

// 회원가입
auth.post('/signup', async (c) => {
  try {
    const { email, password, name, phone, user_type, b2c_stress_type, b2b_business_type, region, symptoms, interests, source } = await c.req.json();
    
    // 이메일 중복 체크
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json({ error: '이미 가입된 이메일입니다' }, 400);
    }
    
    // 사용자 생성 (비밀번호는 실제로는 해싱 필요)
    const result = await c.env.DB.prepare(
      `INSERT INTO users (email, password, name, phone, user_type, b2c_stress_type, b2b_business_type, region, symptoms, interests, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      email, 
      password, // 실제로는 bcrypt 등으로 해싱 필요
      name, 
      phone, 
      user_type,
      b2c_stress_type || null,
      b2b_business_type || null,
      region || null,
      symptoms ? JSON.stringify(symptoms) : null,
      interests ? JSON.stringify(interests) : null,
      source || null
    ).run();
    
    return c.json({ 
      message: '회원가입 성공',
      user_id: result.meta.last_row_id 
    }, 201);
    
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: '회원가입 실패' }, 500);
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
    
    // 실제로는 JWT 토큰 발급 필요
    return c.json({ 
      message: '로그인 성공',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        b2c_stress_type: user.b2c_stress_type,
        b2b_business_type: user.b2b_business_type
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

export default auth;
