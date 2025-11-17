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
import ordersRoutes from './routes/orders';

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
app.route('/api/orders', ordersRoutes);

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

// Shop page - redirect to static file
app.get('/shop', (c) => c.redirect('/static/shop.html'));
app.get('/shop.html', (c) => c.redirect('/static/shop.html'));

// Checkout pages
app.get('/checkout', (c) => c.redirect('/static/checkout.html'));
app.get('/checkout.html', (c) => c.redirect('/static/checkout.html'));
app.get('/order-complete.html', (c) => c.redirect('/static/order-complete.html'));

// Admin login page
app.get('/admin-login', (c) => c.redirect('/static/admin-login.html'));
app.get('/admin/login', (c) => c.redirect('/static/admin-login.html'));
app.get('/admin-login.html', (c) => c.redirect('/static/admin-login.html'));

// Admin product management page
app.get('/admin/products', (c) => c.redirect('/static/admin-products.html'));
app.get('/admin-products', (c) => c.redirect('/static/admin-products.html'));
app.get('/admin-products.html', (c) => c.redirect('/static/admin-products.html'));

// Admin orders management page
app.get('/admin-orders', (c) => c.redirect('/static/admin-orders.html'));
app.get('/admin/orders', (c) => c.redirect('/static/admin-orders.html'));
app.get('/admin-orders.html', (c) => c.redirect('/static/admin-orders.html'));

// Chatbot page
app.get('/chatbot', (c) => c.redirect('/static/chatbot.html'));
app.get('/admin/chatbot', (c) => c.redirect('/static/chatbot.html'));

// Blog review analysis page
app.get('/admin/blog-reviews', (c) => c.redirect('/static/blog-reviews.html'));

// B2B Leads management page
app.get('/admin/b2b-leads', (c) => c.redirect('/static/b2b-leads.html'));
app.get('/b2b-leads', (c) => c.redirect('/static/b2b-leads.html'));

// Admin creation page
app.get('/create-admin', (c) => c.redirect('/static/create-admin.html'));

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
        <style>
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .fade-in-up {
                animation: fadeInUp 0.8s ease-out forwards;
            }
            .hero-gradient {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            }
            .glass-effect {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
            }
            .product-card {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .product-card:hover {
                transform: translateY(-10px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="glass-effect shadow-lg sticky top-0 z-50">
            <nav class="container mx-auto px-6 py-4">
                <div class="flex justify-between items-center">
                    <a href="/" class="flex items-center space-x-3">
                        <img src="/static/logo-light.png" alt="아로마펄스" class="h-16">
                    </a>
                    <div class="hidden md:flex items-center space-x-8">
                        <a href="/shop" class="text-gray-700 hover:text-purple-600 font-semibold transition flex items-center">
                            <i class="fas fa-shopping-bag mr-2"></i>쇼핑
                        </a>
                        <a href="/workshops" class="text-gray-700 hover:text-purple-600 font-semibold transition flex items-center">
                            <i class="fas fa-spa mr-2"></i>워크샵
                        </a>
                        <a href="/dashboard" class="text-gray-700 hover:text-purple-600 font-semibold transition flex items-center">
                            <i class="fas fa-chart-line mr-2"></i>대시보드
                        </a>
                    </div>
                    <div class="flex items-center space-x-4">
                        <!-- 비로그인 상태 -->
                        <div id="auth-buttons" class="flex items-center space-x-4">
                            <button onclick="location.href='/login'" class="text-purple-600 hover:text-purple-800 font-semibold transition">
                                로그인
                            </button>
                            <button onclick="location.href='/signup'" class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-full hover:shadow-lg transition transform hover:scale-105">
                                회원가입
                            </button>
                        </div>
                        
                        <!-- 로그인 상태 (처음엔 숨김) -->
                        <div id="user-menu" class="hidden flex items-center space-x-4">
                            <a href="/shop" class="relative text-gray-700 hover:text-purple-600 transition">
                                <i class="fas fa-shopping-cart text-2xl"></i>
                                <span id="cart-badge" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
                            </a>
                            <div class="relative">
                                <button id="profile-btn" class="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition">
                                    <div class="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                                        <span id="user-initial">U</span>
                                    </div>
                                    <span id="user-name" class="font-semibold hidden md:block">사용자</span>
                                    <i class="fas fa-chevron-down text-sm"></i>
                                </button>
                                
                                <!-- 드롭다운 메뉴 -->
                                <div id="profile-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                                    <a href="/static/profile" class="block px-4 py-2 text-gray-800 hover:bg-purple-50 transition">
                                        <i class="fas fa-user mr-2"></i>프로필
                                    </a>
                                    <a href="/dashboard" class="block px-4 py-2 text-gray-800 hover:bg-purple-50 transition">
                                        <i class="fas fa-chart-line mr-2"></i>대시보드
                                    </a>
                                    <hr class="my-2">
                                    <button onclick="logout()" class="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition">
                                        <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>

        <!-- Hero Section -->
        <section class="hero-gradient text-white py-24 relative overflow-hidden">
            <div class="absolute inset-0 opacity-10">
                <div class="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                <div class="absolute bottom-20 right-20 w-96 h-96 bg-pink-300 rounded-full blur-3xl"></div>
            </div>
            <div class="container mx-auto px-6 relative z-10">
                <div class="text-center max-w-4xl mx-auto fade-in-up">
                    <h1 class="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        향기로 시작하는<br/>
                        <span class="text-yellow-300">행복한 변화</span>
                    </h1>
                    <p class="text-xl md:text-2xl mb-10 text-purple-100">
                        불면, 우울, 불안을 위한 전문 아로마 솔루션<br/>
                        당신의 일상에 평온함을 더합니다
                    </p>
                    <div class="flex flex-col sm:flex-row justify-center gap-4">
                        <button onclick="location.href='/shop'" 
                                class="bg-white text-purple-600 px-10 py-4 rounded-full text-lg font-bold hover:shadow-2xl transition transform hover:scale-105">
                            <i class="fas fa-shopping-bag mr-2"></i>
                            제품 둘러보기
                        </button>
                        <button onclick="location.href='/workshops'" 
                                class="bg-purple-800 bg-opacity-50 backdrop-blur text-white px-10 py-4 rounded-full text-lg font-bold border-2 border-white hover:bg-opacity-70 transition">
                            <i class="fas fa-spa mr-2"></i>
                            워크샵 신청
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features -->
        <section class="py-20 bg-white">
            <div class="container mx-auto px-6">
                <div class="text-center mb-16">
                    <h2 class="text-4xl font-bold text-gray-800 mb-4">왜 아로마펄스인가요?</h2>
                    <p class="text-xl text-gray-600">전문성과 신뢰를 바탕으로 한 향기 케어</p>
                </div>
                <div class="grid md:grid-cols-3 gap-10">
                    <div class="product-card bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl shadow-lg text-center">
                        <div class="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="fas fa-user-md text-white text-3xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-gray-800">전문성 기반</h3>
                        <p class="text-gray-600 leading-relaxed">증상별 맞춤 아로마 솔루션으로<br/>효과적인 케어를 제공합니다</p>
                    </div>
                    <div class="product-card bg-gradient-to-br from-pink-50 to-white p-8 rounded-2xl shadow-lg text-center">
                        <div class="w-20 h-20 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="fas fa-map-marker-alt text-white text-3xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-gray-800">로컬 공방 연결</h3>
                        <p class="text-gray-600 leading-relaxed">지역 기반 향기 공방과<br/>직접 만나는 특별한 경험</p>
                    </div>
                    <div class="product-card bg-gradient-to-br from-indigo-50 to-white p-8 rounded-2xl shadow-lg text-center">
                        <div class="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="fas fa-star text-white text-3xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-gray-800">실제 후기 기반</h3>
                        <p class="text-gray-600 leading-relaxed">사용자 경험 데이터를 바탕으로<br/>신뢰할 수 있는 제품 추천</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Popular Products Section -->
        <section class="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
            <div class="container mx-auto px-6">
                <div class="text-center mb-16">
                    <h2 class="text-4xl font-bold text-gray-800 mb-4">인기 제품</h2>
                    <p class="text-xl text-gray-600">가장 사랑받는 아로마 제품을 만나보세요</p>
                </div>
                <div id="popular-products" class="grid md:grid-cols-3 gap-8">
                    <!-- 제품들이 동적으로 로드됩니다 -->
                </div>
                <div class="text-center mt-12">
                    <button onclick="location.href='/shop'" class="bg-purple-600 text-white px-10 py-4 rounded-full text-lg font-bold hover:shadow-lg transition transform hover:scale-105">
                        <i class="fas fa-arrow-right mr-2"></i>
                        모든 제품 보기
                    </button>
                </div>
            </div>
        </section>

        <!-- User Type Selection -->
        <section class="py-20 bg-white" id="user-type">
            <div class="container mx-auto px-6">
                <div class="text-center mb-16">
                    <h2 class="text-4xl font-bold text-gray-800 mb-4">어떤 목적으로 방문하셨나요?</h2>
                    <p class="text-xl text-gray-600">고객님에게 맞는 서비스를 제공합니다</p>
                </div>
                <div class="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                    <!-- B2C -->
                    <div class="product-card bg-gradient-to-br from-purple-100 to-purple-50 p-10 rounded-3xl shadow-xl">
                        <div class="text-center mb-8">
                            <div class="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i class="fas fa-user text-white text-4xl"></i>
                            </div>
                            <h3 class="text-3xl font-bold text-gray-800 mb-2">개인 고객</h3>
                            <p class="text-gray-600">나만을 위한 특별한 향기 케어</p>
                        </div>
                        <div class="space-y-4">
                            <button onclick="selectUserType('B2C', 'daily')" 
                                    class="w-full text-left p-5 bg-white rounded-xl hover:shadow-lg transition transform hover:scale-105 border-2 border-transparent hover:border-purple-400">
                                <i class="fas fa-home text-purple-600 mr-3"></i>
                                <span class="font-semibold">일상 스트레스 관리</span>
                            </button>
                            <button onclick="selectUserType('B2C', 'work')" 
                                    class="w-full text-left p-5 bg-white rounded-xl hover:shadow-lg transition transform hover:scale-105 border-2 border-transparent hover:border-purple-400">
                                <i class="fas fa-briefcase text-purple-600 mr-3"></i>
                                <span class="font-semibold">직무 스트레스 관리</span>
                            </button>
                        </div>
                    </div>

                    <!-- B2B -->
                    <div class="product-card bg-gradient-to-br from-pink-100 to-pink-50 p-10 rounded-3xl shadow-xl">
                        <div class="text-center mb-8">
                            <div class="w-24 h-24 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i class="fas fa-building text-white text-4xl"></i>
                            </div>
                            <h3 class="text-3xl font-bold text-gray-800 mb-2">비즈니스 고객</h3>
                            <p class="text-gray-600">함께 성장하는 파트너십</p>
                        </div>
                        <div class="space-y-4">
                            <button onclick="selectUserType('B2B', 'perfumer')" 
                                    class="w-full text-left p-5 bg-white rounded-xl hover:shadow-lg transition transform hover:scale-105 border-2 border-transparent hover:border-pink-400">
                                <i class="fas fa-flask text-pink-600 mr-3"></i>
                                <span class="font-semibold">조향사 (파트너 제휴)</span>
                            </button>
                            <button onclick="selectUserType('B2B', 'company')" 
                                    class="w-full text-left p-5 bg-white rounded-xl hover:shadow-lg transition transform hover:scale-105 border-2 border-transparent hover:border-pink-400">
                                <i class="fas fa-building text-pink-600 mr-3"></i>
                                <span class="font-semibold">기업 (대량 납품/클래스)</span>
                            </button>
                            <button onclick="selectUserType('B2B', 'shop')" 
                                    class="w-full text-left p-5 bg-white rounded-xl hover:shadow-lg transition transform hover:scale-105 border-2 border-transparent hover:border-pink-400">
                                <i class="fas fa-store text-pink-600 mr-3"></i>
                                <span class="font-semibold">매장 (제품 문의)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="hero-gradient text-white py-24 relative overflow-hidden">
            <div class="absolute inset-0 opacity-10">
                <div class="absolute top-10 right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                <div class="absolute bottom-10 left-20 w-80 h-80 bg-pink-300 rounded-full blur-3xl"></div>
            </div>
            <div class="container mx-auto px-6 text-center relative z-10">
                <h2 class="text-4xl md:text-5xl font-bold mb-6">지금 바로 시작하세요</h2>
                <p class="text-xl md:text-2xl mb-10 text-purple-100">
                    스트레스 패치 무료 체험으로 효과를 직접 느껴보세요
                </p>
                <button onclick="location.href='/patch-apply'" 
                        class="bg-white text-purple-600 px-12 py-5 rounded-full text-lg font-bold hover:shadow-2xl transition transform hover:scale-105">
                    <i class="fas fa-gift mr-2"></i>
                    무료 체험 신청하기
                </button>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-white py-12">
            <div class="container mx-auto px-6">
                <div class="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h4 class="text-xl font-bold mb-4">아로마펄스</h4>
                        <p class="text-gray-400">향기로 시작하는 행복한 변화</p>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold mb-4">제품</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/shop" class="hover:text-white transition">전체 제품</a></li>
                            <li><a href="/shop?category=symptom_care" class="hover:text-white transition">증상 케어</a></li>
                            <li><a href="/shop?category=refresh" class="hover:text-white transition">리프레시</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold mb-4">서비스</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/workshops" class="hover:text-white transition">워크샵</a></li>
                            <li><a href="/dashboard" class="hover:text-white transition">대시보드</a></li>
                            <li><a href="/patch-apply" class="hover:text-white transition">패치 체험</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold mb-4">소셜 미디어</h4>
                        <div class="flex space-x-4">
                            <a href="https://blog.naver.com/aromapulse" target="_blank" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition">
                                <i class="fas fa-blog"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
                    <p>© 2025 아로마펄스 (AromaPulse). All rights reserved.</p>
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
            
            // Load popular products
            async function loadPopularProducts() {
                try {
                    const response = await fetch('/api/products');
                    const data = await response.json();
                    const products = data.products || [];
                    
                    // Get first 3 active products
                    const popularProducts = products.filter(p => p.is_active).slice(0, 3);
                    
                    const container = document.getElementById('popular-products');
                    if (popularProducts.length === 0) {
                        container.innerHTML = '<div class="col-span-3 text-center text-gray-500"><p>곧 멋진 제품들이 준비됩니다!</p></div>';
                        return;
                    }
                    
                    // 관리자 페이지와 동일한 제품 카드 생성
                    container.innerHTML = popularProducts.map(product => {
                        const thumbnailUrl = product.thumbnail_image || 'https://via.placeholder.com/300x200?text=No+Image';
                        
                        // 제품 컨셉 뱃지
                        const conceptBadge = product.concept === 'refresh'
                            ? '<span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">리프레시</span>'
                            : '<span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">증상케어</span>';
                        
                        // 리프레시 제품 유형 표시
                        const refreshTypeLabels = {
                            fabric_perfume: '섬유 향수',
                            room_spray: '룸 스프레이',
                            fabric_deodorizer: '섬유 탈취제',
                            diffuser: '디퓨저',
                            candle: '캔들',
                            perfume: '향수'
                        };
                        
                        const refreshTypeInfo = product.concept === 'refresh' && product.refresh_type
                            ? \`<div class="text-xs text-purple-600 mb-2 font-semibold">
                                 <i class="fas fa-spray-can mr-1"></i>\${refreshTypeLabels[product.refresh_type] || product.refresh_type}
                                 \${product.volume ? \` · \${product.volume}\` : ''}
                                 \${product.items_per_box ? \` · <span class="text-purple-800">\${product.items_per_box}개입</span>\` : ''}
                               </div>\`
                            : '';
                        
                        // 공방 정보 (증상케어 제품일 때만)
                        const workshopInfo = product.concept === 'symptom_care' && product.workshop_name 
                            ? \`<div class="text-xs text-gray-500 mb-2">
                                 <i class="fas fa-store mr-1"></i>\${product.workshop_name}
                                 \${product.workshop_location ? \` · \${product.workshop_location}\` : ''}
                               </div>\`
                            : '';
                        
                        return \`
                            <div class="product-card bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer" onclick="location.href='/static/product-detail?id=\${product.id}'">
                                <div class="relative">
                                    <img src="\${thumbnailUrl}" alt="\${product.name}" class="w-full h-48 object-cover">
                                    <div class="absolute top-2 right-2">
                                        \${conceptBadge}
                                    </div>
                                </div>
                                <div class="p-4">
                                    <h3 class="font-bold text-lg mb-2 text-gray-800">\${product.name}</h3>
                                    \${refreshTypeInfo}
                                    \${workshopInfo}
                                    <p class="text-sm text-gray-600 mb-3 line-clamp-2">\${product.description || '설명 없음'}</p>
                                    <div class="flex items-center justify-between mb-3">
                                        <span class="text-lg font-bold text-purple-600">\${product.price.toLocaleString()}원</span>
                                        <span class="text-sm text-gray-500">재고: \${product.stock}\${product.concept === 'refresh' ? '박스' : '개'}</span>
                                    </div>
                                    <button onclick="event.stopPropagation(); location.href='/shop'" class="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                        <i class="fas fa-shopping-cart mr-1"></i> 구매하기
                                    </button>
                                </div>
                            </div>
                        \`;
                    }).join('');
                } catch (error) {
                    console.error('Failed to load products:', error);
                }
            }
            
            // 로그아웃 함수
            function logout() {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                alert('로그아웃되었습니다.');
                location.reload();
            }
            
            // 프로필 드롭다운 토글
            function toggleProfileDropdown() {
                const dropdown = document.getElementById('profile-dropdown');
                dropdown.classList.toggle('hidden');
            }
            
            // 로그인 상태 확인 및 UI 업데이트
            function updateAuthUI() {
                const token = localStorage.getItem('token');
                const authButtons = document.getElementById('auth-buttons');
                const userMenu = document.getElementById('user-menu');
                
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        
                        // 토큰 만료 체크
                        if (payload.exp && payload.exp * 1000 < Date.now()) {
                            // 토큰 만료됨
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            return;
                        }
                        
                        // 로그인 상태 UI 표시
                        authButtons.classList.add('hidden');
                        userMenu.classList.remove('hidden');
                        userMenu.classList.add('flex');
                        
                        // 사용자 정보 표시
                        const userName = payload.name || '사용자';
                        const userInitial = userName.charAt(0).toUpperCase();
                        
                        document.getElementById('user-name').textContent = userName;
                        document.getElementById('user-initial').textContent = userInitial;
                        
                        // 장바구니 개수 표시
                        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                        if (cart.length > 0) {
                            const cartBadge = document.getElementById('cart-badge');
                            cartBadge.textContent = cart.length;
                            cartBadge.classList.remove('hidden');
                        }
                        
                    } catch (e) {
                        console.error('Token parse error:', e);
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    }
                }
            }
            
            // 페이지 로드 시 실행
            document.addEventListener('DOMContentLoaded', function() {
                // 로그인 상태 체크 및 UI 업데이트
                updateAuthUI();
                
                // 프로필 버튼 클릭 이벤트
                const profileBtn = document.getElementById('profile-btn');
                if (profileBtn) {
                    profileBtn.addEventListener('click', toggleProfileDropdown);
                }
                
                // 드롭다운 외부 클릭 시 닫기
                document.addEventListener('click', function(e) {
                    const profileBtn = document.getElementById('profile-btn');
                    const dropdown = document.getElementById('profile-dropdown');
                    if (profileBtn && dropdown && !profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
                        dropdown.classList.add('hidden');
                    }
                });
                
                // Load popular products
                loadPopularProducts();
                
                // 메뉴 가시성 제어
                const token = localStorage.getItem('token');
                const workshopLink = document.querySelector('a[href="/workshops"]');
                
                if (workshopLink) {
                    if (token) {
                        try {
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            // B2B 사용자만 워크샵 메뉴 표시
                            if (payload.userType === 'B2B') {
                                workshopLink.style.display = 'flex';
                            } else {
                                workshopLink.style.display = 'none';
                            }
                        } catch (e) {
                            workshopLink.style.display = 'none';
                        }
                    } else {
                        workshopLink.style.display = 'none';
                    }
                }
            });
        </script>

        <!-- 사이드톡 AI 챗봇 -->
        <script src="https://pages.sidetalk.ai/sidetalk.js"></script>
        <script>
        SidetalkAI('init', {
            siteKey: '2836b61bcbfd435c0e1a407bf6ce71885c532aba4c648de494338d3942f565c1',
            buttonText: 'AI 상담',
            buttonBottom: '20px',
            buttonRight: '20px'
        });
        </script>
    </body>
    </html>
  `);
});

export default app;
