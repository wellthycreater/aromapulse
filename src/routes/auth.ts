// Authentication Routes
import { Hono } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
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
  // Admin email list - these users get automatic admin access
  const ADMIN_EMAILS = [
    'admin@aromapulse.kr',
    'developer@aromapulse.kr',
    'operator@aromapulse.kr',
    'wellthykorea@gmail.com'
  ];
  
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
  const userType = isAdmin ? 'B2B' : 'B2C';
  
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
    
    // Get user info with role
    const user = await db.prepare(`
      SELECT id, email, name, profile_image, user_type FROM users WHERE id = ?
    `).bind(oauthAccount.user_id).first<{ id: number, email: string, name: string, profile_image: string, user_type: string }>();
    
    // Update user_type if admin email but not set as B2B
    if (user && isAdmin && user.user_type !== 'B2B') {
      await db.prepare(`
        UPDATE users SET user_type = 'B2B', b2b_category = 'company' WHERE id = ?
      `).bind(user.id).run();
      user.user_type = 'B2B';
    }
    
    return user;
  }
  
  // Check if user exists by email (might have registered with different provider or email/password)
  const existingUser = await db.prepare(`
    SELECT id, email, name, profile_image, user_type FROM users WHERE email = ?
  `).bind(email).first<{ id: number, email: string, name: string, profile_image: string, user_type: string }>();
  
  let userId: number;
  
  if (existingUser) {
    // User exists, link this OAuth account to existing user
    userId = existingUser.id;
    
    // Update user_type if admin email but not set as B2B
    if (isAdmin && existingUser.user_type !== 'B2B') {
      await db.prepare(`
        UPDATE users SET user_type = 'B2B', b2b_category = 'company', is_oauth = 1 WHERE id = ?
      `).bind(userId).run();
      existingUser.user_type = 'B2B';
    }
  } else {
    // Create new user (Admin emails get B2B type, others get B2C)
    const userResult = await db.prepare(`
      INSERT INTO users (email, name, profile_image, is_oauth, user_type, b2b_category, created_at)
      VALUES (?, ?, ?, 1, ?, ?, datetime('now'))
    `).bind(email, name, profileImage, userType, isAdmin ? 'company' : null).run();
    
    userId = Number(userResult.meta.last_row_id);
  }
  
  // Create oauth account (link to existing or new user)
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  await db.prepare(`
    INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, refresh_token, token_expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(userId, provider, providerId, accessToken, refreshToken, tokenExpiresAt).run();
  
  // Return user info with updated type
  if (existingUser) {
    return { 
      id: existingUser.id, 
      email: existingUser.email, 
      name: existingUser.name, 
      profile_image: existingUser.profile_image, 
      user_type: isAdmin ? 'B2B' : existingUser.user_type 
    };
  } else {
    return { id: userId, email, name, profile_image: profileImage, user_type: userType };
  }
}

// ======================
// Google OAuth Routes
// ======================

// Step 1: Redirect to Google OAuth
auth.get('/google', async (c: Context) => {
  const { DB, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL } = c.env as Bindings;
  
  const redirectUri = `${APP_URL}/api/auth/google/callback`;
  const googleOAuth = new GoogleOAuth(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
  
  // Generate and store state
  const state = generateState();
  const returnTo = c.req.query('returnTo') || '/';
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
    const redirectUri = `${APP_URL}/api/auth/google/callback`;
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
    
    // Determine user role based on user_type and email
    const ADMIN_EMAILS = ['admin@aromapulse.kr', 'developer@aromapulse.kr', 'operator@aromapulse.kr', 'wellthykorea@gmail.com'];
    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase()) || user.user_type === 'B2B';
    
    // Generate JWT token with role
    const jwtManager = new JWTManager(JWT_SECRET);
    const jwtToken = await jwtManager.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: 'google',
      role: isAdmin ? 'admin' : 'user',
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    return c.html(`
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .error-box { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
            .error-details { background: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 10px; font-family: monospace; white-space: pre-wrap; }
            a { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="error-box">
            <h1>🔐 로그인 실패</h1>
            <p>로그인 처리 중 오류가 발생했습니다.</p>
            <div class="error-details">
              <strong>오류 메시지:</strong>
              ${errorMessage}
              
              ${errorStack ? `\n<strong>상세 정보:</strong>\n${errorStack}` : ''}
            </div>
          </div>
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
  const token = getCookie(c, 'auth_token');
  
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
  
  const token = getCookie(c, 'auth_token');
  
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
  
  const redirectUri = `${APP_URL}/api/auth/naver/callback`;
  const naverOAuth = new NaverOAuth(NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, redirectUri);
  
  // Generate and store state
  const state = generateState();
  const returnTo = c.req.query('returnTo') || '/';
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
    const redirectUri = `${APP_URL}/api/auth/naver/callback`;
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
    
    // Determine user role based on user_type and email
    const ADMIN_EMAILS = ['admin@aromapulse.kr', 'developer@aromapulse.kr', 'operator@aromapulse.kr', 'wellthykorea@gmail.com'];
    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase()) || user.user_type === 'B2B';
    
    // Generate JWT token with role
    const jwtManager = new JWTManager(JWT_SECRET);
    const jwtToken = await jwtManager.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: 'naver',
      role: isAdmin ? 'admin' : 'user',
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
  
  const redirectUri = `${APP_URL}/api/auth/kakao/callback`;
  const kakaoOAuth = new KakaoOAuth(KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET, redirectUri);
  
  // Generate and store state
  const state = generateState();
  const returnTo = c.req.query('returnTo') || '/';
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
    const redirectUri = `${APP_URL}/api/auth/kakao/callback`;
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
    
    // Determine user role based on user_type and email
    const ADMIN_EMAILS = ['admin@aromapulse.kr', 'developer@aromapulse.kr', 'operator@aromapulse.kr', 'wellthykorea@gmail.com'];
    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase()) || user.user_type === 'B2B';
    
    // Generate JWT token with role
    const jwtManager = new JWTManager(JWT_SECRET);
    const jwtToken = await jwtManager.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: 'kakao',
      role: isAdmin ? 'admin' : 'user',
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

// TEST ONLY: Quick login endpoint for development/testing
// Creates a test Google user and sets auth cookie
auth.get('/test-google-login', async (c: Context) => {
  const { DB, JWT_SECRET, APP_URL } = c.env as Bindings;
  
  try {
    // Create or find test user with Google provider
    const testEmail = 'test.google@aromapulse.kr';
    const testName = 'Google 테스트 사용자';
    const testProviderId = 'test_google_123456';
    
    // Check if oauth account exists
    let oauthAccount = await DB.prepare(`
      SELECT user_id FROM oauth_accounts WHERE provider = 'google' AND provider_user_id = ?
    `).bind(testProviderId).first<{ user_id: number }>();
    
    let userId: number;
    
    if (oauthAccount) {
      userId = oauthAccount.user_id;
    } else {
      // Check if user exists
      let user = await DB.prepare(`
        SELECT id FROM users WHERE email = ?
      `).bind(testEmail).first<{ id: number }>();
      
      if (!user) {
        // Create new user
        const userResult = await DB.prepare(`
          INSERT INTO users (email, name, profile_image, is_oauth, user_type, created_at)
          VALUES (?, ?, ?, 1, 'B2C', datetime('now'))
        `).bind(testEmail, testName, 'https://via.placeholder.com/150').run();
        
        userId = Number(userResult.meta.last_row_id);
      } else {
        userId = user.id;
      }
      
      // Create oauth account
      await DB.prepare(`
        INSERT INTO oauth_accounts (
          user_id, provider, provider_user_id, access_token, 
          refresh_token, token_expires_at, created_at
        )
        VALUES (?, 'google', ?, 'test_token', NULL, datetime('now', '+1 hour'), datetime('now'))
      `).bind(userId, testProviderId).run();
    }
    
    // Get user info
    const user = await DB.prepare(`
      SELECT id, email, name, profile_image FROM users WHERE id = ?
    `).bind(userId).first<{ id: number, email: string, name: string, profile_image: string }>();
    
    if (!user) {
      throw new Error('Failed to get user');
    }
    
    // Determine user role based on user_type and email
    const ADMIN_EMAILS = ['admin@aromapulse.kr', 'developer@aromapulse.kr', 'operator@aromapulse.kr', 'wellthykorea@gmail.com'];
    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase()) || user.user_type === 'B2B';
    
    // Generate JWT token with role
    const jwtManager = new JWTManager(JWT_SECRET);
    const jwtToken = await jwtManager.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: 'google',
      role: isAdmin ? 'admin' : 'user',
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
    
    // Log the login (commented out - table may not exist in all environments)
    // await DB.prepare(`
    //   INSERT INTO login_logs (user_id, provider, login_at)
    //   VALUES (?, 'google', datetime('now'))
    // `).bind(user.id).run();
    
    // Redirect to healing page
    return c.redirect('/healing');
  } catch (error) {
    console.error('Test login error:', error);
    return c.json({ 
      error: 'Failed to create test login', 
      details: error instanceof Error ? error.message : String(error) 
    }, 500);
  }
});

export default auth;
