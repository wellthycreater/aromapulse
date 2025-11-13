import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';

// API Routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import reviewRoutes from './routes/reviews';
import patchRoutes from './routes/patch';
import adminRoutes from './routes/admin';
import blogRoutes from './routes/blog';
import workshopsRoutes from './routes/workshops';
import bookingsRoutes from './routes/bookings';
import reviewsApiRoutes from './routes/reviews_api';
import activityRoutes from './routes/activity';
import adminProductsRoutes from './routes/admin-products';
import blogAnalysisRoutes from './routes/blog-analysis';
import chatbotRoutes from './routes/chatbot';
import blogReviewsRoutes from './routes/blog-reviews';

const app = new Hono<{ Bindings: Bindings }>();

// CORS 설정
app.use('/api/*', cors());

// Static files
app.use('/static/*', serveStatic({ root: './public' }));

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/products', productRoutes);
app.route('/api/reviews', reviewRoutes);
app.route('/api/patch', patchRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/blog', blogRoutes);
app.route('/api/workshops', workshopsRoutes);
app.route('/api/bookings', bookingsRoutes);
app.route('/api/reviews-api', reviewsApiRoutes);
app.route('/api/activity', activityRoutes);
app.route('/api/admin-products', adminProductsRoutes);
app.route('/api/blog-analysis', blogAnalysisRoutes);
app.route('/api/chatbot', chatbotRoutes);
app.route('/api/blog-reviews', blogReviewsRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database check endpoint (테스트용)
app.get('/api/db-check', async (c) => {
  try {
    // 테이블 목록 조회
    const tables = await c.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all();
    
    // users 테이블 정보 조회
    let usersInfo = null;
    try {
      usersInfo = await c.env.DB.prepare(
        "PRAGMA table_info(users)"
      ).all();
    } catch (e: any) {
      usersInfo = { error: e.message };
    }
    
    // users 테이블 카운트
    let usersCount = null;
    try {
      const result = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM users"
      ).first();
      usersCount = result?.count;
    } catch (e: any) {
      usersCount = { error: e.message };
    }
    
    return c.json({
      database: 'aromapulse-production',
      tables: tables.results,
      users_table_info: usersInfo,
      users_count: usersCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return c.json({ 
      error: 'Database check failed', 
      details: error.message 
    }, 500);
  }
});

// Login page - redirect to static file
app.get('/login', (c) => c.redirect('/static/login.html'));

// Signup page - redirect to static file  
app.get('/signup', (c) => c.redirect('/static/signup.html'));

// Dashboard page - redirect to static file
app.get('/dashboard', (c) => c.redirect('/static/dashboard.html'));

// Workshops page - redirect to static file
app.get('/workshops', (c) => c.redirect('/static/workshops.html'));

// Workshop detail page - redirect to static file with ID
app.get('/workshop/:id', (c) => {
  const id = c.req.param('id');
  return c.redirect(`/static/workshop-detail.html?id=${id}`);
});

// Admin product management page
app.get('/admin/products', (c) => c.redirect('/static/admin-products.html'));

// Chatbot page
app.get('/chatbot', (c) => c.redirect('/static/chatbot'));

// Blog review analysis page
app.get('/admin/blog-reviews', (c) => c.redirect('/static/blog-reviews.html'));

// Home page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>아로마펄스 - 향기로운 스트레스 케어</title>
        <link rel="icon" type="image/png" href="/static/favicon.png">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-md">
            <nav class="container mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <a href="/" class="flex items-center space-x-2">
                        <img src="/static/logo-light.png" alt="아로마펄스" class="h-20">
                    </a>
                    <div class="hidden md:flex space-x-6">
                        <a href="/workshops" class="text-gray-700 hover:text-purple-600">워크샵</a>
                        <a href="/chatbot" class="text-gray-700 hover:text-purple-600">
                            <i class="fas fa-robot mr-1"></i>AI 상담
                        </a>
                        <a href="/dashboard" class="text-gray-700 hover:text-purple-600">대시보드</a>
                        <a href="#features" class="text-gray-700 hover:text-purple-600">서비스</a>
                        <a href="#user-type" class="text-gray-700 hover:text-purple-600">회원가입</a>
                    </div>
                    <div class="flex space-x-4">
                        <button onclick="location.href='/login'" class="text-purple-600 hover:text-purple-800">로그인</button>
                        <button onclick="location.href='/signup'" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">회원가입</button>
                    </div>
                </div>
            </nav>
        </header>

        <!-- Hero Section -->
        <section class="container mx-auto px-4 py-16">
            <div class="text-center max-w-3xl mx-auto">
                <h2 class="text-4xl font-bold text-gray-800 mb-4">
                    향기로 시작하는<br/>스트레스 케어
                </h2>
                <p class="text-xl text-gray-600 mb-8">
                    불면, 우울, 불안을 위한 전문 아로마 솔루션
                </p>
                <div class="flex justify-center space-x-4">
                    <button onclick="location.href='/workshops'" 
                            class="bg-teal-600 text-white px-8 py-3 rounded-lg hover:bg-teal-700 text-lg">
                        <i class="fas fa-spa mr-2"></i>
                        워크샵 둘러보기
                    </button>
                    <button onclick="location.href='/signup'" 
                            class="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 text-lg">
                        <i class="fas fa-user-plus mr-2"></i>
                        회원가입
                    </button>
                </div>
            </div>
        </section>

        <!-- Features -->
        <section class="container mx-auto px-4 py-16">
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-white p-6 rounded-lg shadow-md text-center">
                    <i class="fas fa-user-md text-purple-600 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">전문성 기반</h3>
                    <p class="text-gray-600">증상별 맞춤 아로마 솔루션</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md text-center">
                    <i class="fas fa-map-marker-alt text-pink-600 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">로컬 공방 연결</h3>
                    <p class="text-gray-600">지역 기반 향기 공방 매칭</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md text-center">
                    <i class="fas fa-comments text-purple-600 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">실제 후기 기반</h3>
                    <p class="text-gray-600">사용자 경험 데이터 중심</p>
                </div>
            </div>
        </section>

        <!-- User Type Selection -->
        <section class="container mx-auto px-4 py-16" id="user-type">
            <div class="text-center mb-12">
                <h3 class="text-3xl font-bold text-gray-800 mb-4">어떤 목적으로 방문하셨나요?</h3>
            </div>
            <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <!-- B2C -->
                <div class="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition">
                    <h4 class="text-2xl font-bold mb-4 text-purple-600">
                        <i class="fas fa-user mr-2"></i>
                        개인 고객
                    </h4>
                    <div class="space-y-3 mb-6">
                        <button onclick="selectUserType('B2C', 'daily')" 
                                class="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50">
                            <i class="fas fa-home mr-2"></i>
                            일상 스트레스 관리
                        </button>
                        <button onclick="selectUserType('B2C', 'work')" 
                                class="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50">
                            <i class="fas fa-briefcase mr-2"></i>
                            직무 스트레스 관리
                        </button>
                    </div>
                </div>

                <!-- B2B -->
                <div class="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition">
                    <h4 class="text-2xl font-bold mb-4 text-pink-600">
                        <i class="fas fa-building mr-2"></i>
                        비즈니스 고객
                    </h4>
                    <div class="space-y-3 mb-6">
                        <button onclick="selectUserType('B2B', 'perfumer')" 
                                class="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-pink-400 hover:bg-pink-50">
                            <i class="fas fa-flask mr-2"></i>
                            조향사 (파트너 제휴)
                        </button>
                        <button onclick="selectUserType('B2B', 'company')" 
                                class="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-pink-400 hover:bg-pink-50">
                            <i class="fas fa-building mr-2"></i>
                            기업 (대량 납품/클래스)
                        </button>
                        <button onclick="selectUserType('B2B', 'shop')" 
                                class="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-pink-400 hover:bg-pink-50">
                            <i class="fas fa-store mr-2"></i>
                            매장 (제품 문의)
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="bg-purple-600 text-white py-16">
            <div class="container mx-auto px-4 text-center">
                <h3 class="text-3xl font-bold mb-4">스트레스 패치 테스트 신청</h3>
                <p class="text-xl mb-8">효과를 직접 체험해보세요</p>
                <button onclick="location.href='/patch-apply'" 
                        class="bg-white text-purple-600 px-8 py-3 rounded-lg hover:bg-gray-100 text-lg font-bold">
                    <i class="fas fa-clipboard-check mr-2"></i>
                    패치 신청하기
                </button>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-800 text-white py-8">
            <div class="container mx-auto px-4 text-center">
                <p class="text-gray-400">© 2025 아로마펄스. All rights reserved.</p>
                <div class="mt-4">
                    <a href="https://blog.naver.com/aromapulse" target="_blank" class="text-gray-400 hover:text-white mx-2">
                        <i class="fas fa-blog"></i> 블로그
                    </a>
                </div>
            </div>
        </footer>

        <script>
            function selectUserType(userType, subType) {
                // Store user type selection in localStorage
                localStorage.setItem('userType', userType);
                localStorage.setItem('subType', subType);
                
                // Redirect to signup or appropriate page
                location.href = '/signup?type=' + userType + '&sub=' + subType;
            }
        </script>
    </body>
    </html>
  `);
});

export default app;
