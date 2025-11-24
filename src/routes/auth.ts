// Authentication Routes
import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import type { Context } from 'hono';
import { GoogleOAuth } from '../lib/oauth/google';
import { NaverOAuth } from '../lib/oauth/naver';
import { KakaoOAuth } from '../lib/oauth/kakao';
import { JWTManager } from '../lib/auth/jwt';

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  NAVER_CLIENT_ID: string;
  NAVER_CLIENT_SECRET: string;
  NAVER_REDIRECT_URI: string;
  KAKAO_REST_API_KEY: string;
  KAKAO_CLIENT_SECRET: string;
  KAKAO_REDIRECT_URI: string;
  JWT_SECRET: string;
  APP_URL: string;
};

const auth = new Hono<{ Bindings: Bindings }>();

// Generate random state for CSRF protection
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Store state in database with expiration
async function storeOAuthState(db: D1Database, state: string, provider: string, redirectUri: string) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  await db.prepare(`
    INSERT INTO oauth_states (state, provider, redirect_uri, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(state, provider, redirectUri, expiresAt.toISOString()).run();
}

// Verify and delete state
async function verifyOAuthState(db: D1Database, state: string, provider: string): Promise<string | null> {
  const result = await db.prepare(`
    SELECT redirect_uri FROM oauth_states
    WHERE state = ? AND provider = ? AND expires_at > datetime('now')
  `).bind(state, provider).first<{ redirect_uri: string }>();
  
  if (result) {
    // Delete used state
    await db.prepare(`DELETE FROM oauth_states WHERE state = ?`).bind(state).run();
    return result.redirect_uri;
  }
  
  return null;
}

// Find or create user from OAuth data
async function findOrCreateUser(
  db: D1Database,
  provider: string,
  providerId: string,
  email: string,
  name: string,
  profileImage: string,
  accessToken: string,
  refreshToken: string | null,
  expiresIn: number
) {
  // Check if oauth account exists
  const oauthAccount = await db.prepare(`
    SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?
  `).bind(provider, providerId).first<{ user_id: number }>();
  
  if (oauthAccount) {
    // Update tokens
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    await db.prepare(`
      UPDATE oauth_accounts
      SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = datetime('now')
      WHERE provider = ? AND provider_user_id = ?
    `).bind(accessToken, refreshToken, tokenExpiresAt, provider, providerId).run();
    
    // Get user info
    const user = await db.prepare(`
      SELECT id, email, name, profile_image FROM users WHERE id = ?
    `).bind(oauthAccount.user_id).first<{ id: number, email: string, name: string, profile_image: string }>();
    
    return user;
  }
  
  // Create new user
  const userResult = await db.prepare(`
    INSERT INTO users (email, name, profile_image, is_oauth, created_at)
    VALUES (?, ?, ?, 1, datetime('now'))
  `).bind(email, name, profileImage).run();
  
  const userId = Number(userResult.meta.last_row_id);
  
  // Create oauth account
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  await db.prepare(`
    INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email, name, profile_image, access_token, refresh_token, token_expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(userId, provider, providerId, email, name, profileImage, accessToken, refreshToken, tokenExpiresAt).run();
  
  return { id: userId, email, name, profile_image: profileImage };
}

// ======================
// Google OAuth Routes
// ======================

// Step 1: Redirect to Google OAuth
auth.get('/google', async (c: Context) => {
  const { DB, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL } = c.env as Bindings;
  
  const redirectUri = `${APP_URL}/auth/google/callback`;
  const googleOAuth = new GoogleOAuth(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
  
  // Generate and store state
  const state = generateState();
  const returnTo = c.req.query('returnTo') || '/healing';
  await storeOAuthState(DB, state, 'google', returnTo);
  
  // Redirect to Google
  const authUrl = googleOAuth.getAuthorizationUrl(state);
  return c.redirect(authUrl);
});

// Step 2: Handle Google OAuth callback
auth.get('/google/callback', async (c: Context) => {
  const { DB, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL, JWT_SECRET } = c.env as Bindings;
  
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');
  
  // Handle OAuth error
  if (error) {
    return c.html(`
      <html>
        <body>
          <h1>로그인 실패</h1>
          <p>Google 로그인 중 오류가 발생했습니다: ${error}</p>
          <a href="/">홈으로 돌아가기</a>
        </body>
      </html>
    `);
  }
  
  if (!code || !state) {
    return c.json({ error: 'Missing code or state' }, 400);
  }
  
  // Verify state (CSRF protection)
  const returnTo = await verifyOAuthState(DB, state, 'google');
  if (!returnTo) {
    return c.json({ error: 'Invalid or expired state' }, 400);
  }
  
  try {
    const redirectUri = `${APP_URL}/auth/google/callback`;
    const googleOAuth = new GoogleOAuth(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
    
    // Exchange code for tokens
    const tokens = await googleOAuth.getAccessToken(code);
    
    // Get user info
    const userInfo = await googleOAuth.getUserInfo(tokens.access_token);
    
    // Find or create user in database
    const user = await findOrCreateUser(
      DB,
      'google',
      userInfo.id,
      userInfo.email,
      userInfo.name,
      userInfo.picture,
      tokens.access_token,
      tokens.refresh_token || null,
      tokens.expires_in
    );
    
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    
    // Generate JWT token
    const jwtManager = new JWTManager(JWT_SECRET);
    const jwtToken = await jwtManager.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: 'google',
    });
    
    // Set cookie with JWT token
    setCookie(c, 'auth_token', jwtToken, {
      httpOnly: true,
      secure: APP_URL.startsWith('https'),
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    // Create session in database
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await DB.prepare(`
      INSERT INTO sessions (user_id, session_token, expires_at, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(user.id, jwtToken, sessionExpiresAt).run();
    
    // Redirect to return URL
    return c.redirect(returnTo);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return c.html(`
      <html>
        <body>
          <h1>로그인 실패</h1>
          <p>로그인 처리 중 오류가 발생했습니다.</p>
          <a href="/">홈으로 돌아가기</a>
        </body>
      </html>
    `);
  }
});

// Logout
auth.get('/logout', async (c: Context) => {
  const { DB } = c.env as Bindings;
  
  // Get token from cookie
  const token = c.req.cookie('auth_token');
  
  if (token) {
    // Delete session from database
    await DB.prepare(`DELETE FROM sessions WHERE session_token = ?`).bind(token).run();
  }
  
  // Delete cookie
  deleteCookie(c, 'auth_token', { path: '/' });
  
  return c.redirect('/');
});

// Get current user info
auth.get('/me', async (c: Context) => {
  const { DB, JWT_SECRET } = c.env as Bindings;
  
  const token = c.req.cookie('auth_token');
  
  if (!token) {
    return c.json({ authenticated: false }, 200);
  }
  
  const jwtManager = new JWTManager(JWT_SECRET);
  const payload = await jwtManager.verify(token);
  
  if (!payload) {
    return c.json({ authenticated: false }, 200);
  }
  
  // Get user from database
  const user = await DB.prepare(`
    SELECT id, email, name, profile_image FROM users WHERE id = ?
  `).bind(payload.userId).first<{ id: number, email: string, name: string, profile_image: string }>();
  
  if (!user) {
    return c.json({ authenticated: false }, 200);
  }
  
  return c.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profile_image,
      provider: payload.provider,
    },
  });
});

// ======================
// Naver OAuth Routes
// ======================

// Step 1: Redirect to Naver OAuth
auth.get('/naver', async (c: Context) => {
  const { DB, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, APP_URL } = c.env as Bindings;
  
  const redirectUri = `${APP_URL}/auth/naver/callback`;
  const naverOAuth = new NaverOAuth(NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, redirectUri);
  
  // Generate and store state
  const state = generateState();
  const returnTo = c.req.query('returnTo') || '/healing';
  await storeOAuthState(DB, state, 'naver', returnTo);
  
  // Redirect to Naver
  const authUrl = naverOAuth.getAuthorizationUrl(state);
  return c.redirect(authUrl);
});

// Step 2: Handle Naver OAuth callback
auth.get('/naver/callback', async (c: Context) => {
  const { DB, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, APP_URL, JWT_SECRET } = c.env as Bindings;
  
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');
  
  if (error) {
    return c.html(`
      <html>
        <body>
          <h1>로그인 실패</h1>
          <p>Naver 로그인 중 오류가 발생했습니다: ${error}</p>
          <a href="/">홈으로 돌아가기</a>
        </body>
      </html>
    `);
  }
  
  if (!code || !state) {
    return c.json({ error: 'Missing code or state' }, 400);
  }
  
  // Verify state
  const returnTo = await verifyOAuthState(DB, state, 'naver');
  if (!returnTo) {
    return c.json({ error: 'Invalid or expired state' }, 400);
  }
  
  try {
    const redirectUri = `${APP_URL}/auth/naver/callback`;
    const naverOAuth = new NaverOAuth(NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, redirectUri);
    
    // Exchange code for tokens
    const tokens = await naverOAuth.getAccessToken(code, state);
    
    // Get user info
    const userInfo = await naverOAuth.getUserInfo(tokens.access_token);
    
    // Find or create user
    const user = await findOrCreateUser(
      DB,
      'naver',
      userInfo.id,
      userInfo.email || `naver_${userInfo.id}@aromapulse.kr`,
      userInfo.name || userInfo.nickname || '네이버 사용자',
      userInfo.profile_image || '',
      tokens.access_token,
      tokens.refresh_token || null,
      tokens.expires_in
    );
    
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    
    // Generate JWT token
    const jwtManager = new JWTManager(JWT_SECRET);
    const jwtToken = await jwtManager.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: 'naver',
    });
    
    // Set cookie
    setCookie(c, 'auth_token', jwtToken, {
      httpOnly: true,
      secure: APP_URL.startsWith('https'),
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
    
    // Create session
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await DB.prepare(`
      INSERT INTO sessions (user_id, session_token, expires_at, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(user.id, jwtToken, sessionExpiresAt).run();
    
    return c.redirect(returnTo);
  } catch (error) {
    console.error('Naver OAuth callback error:', error);
    return c.html(`
      <html>
        <body>
          <h1>로그인 실패</h1>
          <p>로그인 처리 중 오류가 발생했습니다.</p>
          <a href="/">홈으로 돌아가기</a>
        </body>
      </html>
    `);
  }
});

// ======================
// Kakao OAuth Routes
// ======================

// Step 1: Redirect to Kakao OAuth
auth.get('/kakao', async (c: Context) => {
  const { DB, KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET, APP_URL } = c.env as Bindings;
  
  const redirectUri = `${APP_URL}/auth/kakao/callback`;
  const kakaoOAuth = new KakaoOAuth(KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET, redirectUri);
  
  // Generate and store state
  const state = generateState();
  const returnTo = c.req.query('returnTo') || '/healing';
  await storeOAuthState(DB, state, 'kakao', returnTo);
  
  // Redirect to Kakao
  const authUrl = kakaoOAuth.getAuthorizationUrl(state);
  return c.redirect(authUrl);
});

// Step 2: Handle Kakao OAuth callback
auth.get('/kakao/callback', async (c: Context) => {
  const { DB, KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET, APP_URL, JWT_SECRET } = c.env as Bindings;
  
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');
  
  if (error) {
    return c.html(`
      <html>
        <body>
          <h1>로그인 실패</h1>
          <p>Kakao 로그인 중 오류가 발생했습니다: ${error}</p>
          <a href="/">홈으로 돌아가기</a>
        </body>
      </html>
    `);
  }
  
  if (!code || !state) {
    return c.json({ error: 'Missing code or state' }, 400);
  }
  
  // Verify state
  const returnTo = await verifyOAuthState(DB, state, 'kakao');
  if (!returnTo) {
    return c.json({ error: 'Invalid or expired state' }, 400);
  }
  
  try {
    const redirectUri = `${APP_URL}/auth/kakao/callback`;
    const kakaoOAuth = new KakaoOAuth(KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET, redirectUri);
    
    // Exchange code for tokens
    const tokens = await kakaoOAuth.getAccessToken(code);
    
    // Get user info
    const userInfo = await kakaoOAuth.getUserInfo(tokens.access_token);
    
    const kakaoAccount = userInfo.kakao_account;
    const profile = kakaoAccount?.profile;
    
    // Find or create user
    const user = await findOrCreateUser(
      DB,
      'kakao',
      String(userInfo.id),
      kakaoAccount?.email || `kakao_${userInfo.id}@aromapulse.kr`,
      kakaoAccount?.name || profile?.nickname || '카카오 사용자',
      profile?.profile_image_url || '',
      tokens.access_token,
      tokens.refresh_token || null,
      tokens.expires_in
    );
    
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    
    // Generate JWT token
    const jwtManager = new JWTManager(JWT_SECRET);
    const jwtToken = await jwtManager.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: 'kakao',
    });
    
    // Set cookie
    setCookie(c, 'auth_token', jwtToken, {
      httpOnly: true,
      secure: APP_URL.startsWith('https'),
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
    
    // Create session
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await DB.prepare(`
      INSERT INTO sessions (user_id, session_token, expires_at, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(user.id, jwtToken, sessionExpiresAt).run();
    
    return c.redirect(returnTo);
  } catch (error) {
    console.error('Kakao OAuth callback error:', error);
    return c.html(`
      <html>
        <body>
          <h1>로그인 실패</h1>
          <p>로그인 처리 중 오류가 발생했습니다.</p>
          <a href="/">홈으로 돌아가기</a>
        </body>
      </html>
    `);
  }
});

export default auth;
