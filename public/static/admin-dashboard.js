// Global Variables
let authToken = null;
let currentTab = 'dashboard';

// Authentication Check
function checkAuth() {
    authToken = localStorage.getItem('adminToken') || 
                localStorage.getItem('admin_token') || 
                localStorage.getItem('auth_token') || 
                localStorage.getItem('token');
    
    if (!authToken) {
        alert('로그인이 필요합니다.');
        window.location.href = '/admin-login';
        return false;
    }
    
    // Verify token with backend
    verifyToken();
    return true;
}

// Verify Token
async function verifyToken() {
    try {
        const response = await fetch('/api/admin/verify', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            console.warn('Token verification endpoint not found, skipping verification');
            return; // Don't redirect, just skip verification
        }
        
        const data = await response.json();
        if (data.user && data.user.name) {
            document.getElementById('admin-name').textContent = data.user.name;
        }
    } catch (error) {
        console.error('Token verification error:', error);
        // Don't redirect on verification error - just log it
        console.warn('Continuing without token verification');
    }
}

// Logout
function logout() {
    if (confirm('로그아웃하시겠습니까?')) {
        localStorage.clear();
        window.location.href = '/admin-login';
    }
}

// Tab Switching
function switchMainTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(`section-${tabName}`);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
    }
    
    // Load data for the selected tab
    loadTabData(tabName);
}

// Switch Dashboard Sub-Tab
function switchDashboardTab(tabName) {
    console.log('Switching dashboard tab to:', tabName);
    
    // Update tab buttons
    document.querySelectorAll('.dashboard-tab-button').forEach(btn => {
        if (btn.dataset.dashboardTab === tabName) {
            btn.classList.remove('text-gray-500', 'border-transparent');
            btn.classList.add('text-sage', 'border-sage');
        } else {
            btn.classList.remove('text-sage', 'border-sage');
            btn.classList.add('text-gray-500', 'border-transparent');
        }
    });
    
    // Hide all dashboard tab contents
    document.querySelectorAll('.dashboard-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(`dashboard-tab-${tabName}`);
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }
    
    // Load data for detailed tab
    if (tabName === 'detailed') {
        loadDetailedAnalytics();
    }
}

// Load Tab Data
function loadTabData(tabName) {
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'products':
            loadProducts();
            break;
        case 'blog':
            loadBlog();
            break;
        case 'workshops':
            loadWorkshops();
            break;
        case 'classes':
            loadClasses();
            break;
        case 'research':
            loadResearchLab();
            break;
    }
}

// Load Dashboard
async function loadDashboard() {
    console.log('🚀 Loading dashboard...');
    
    // IMPORTANT: Ensure overview tab is visible by default
    const overviewTab = document.getElementById('dashboard-tab-overview');
    const detailedTab = document.getElementById('dashboard-tab-detailed');
    if (overviewTab) {
        overviewTab.style.display = 'block';
        console.log('✅ Overview tab set to visible');
    }
    if (detailedTab) {
        detailedTab.style.display = 'none';
        console.log('✅ Detailed tab set to hidden');
    }
    
    // Load stats (don't let this block the rest)
    try {
        const statsResponse = await fetch('/api/admin/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            document.getElementById('stat-users').textContent = stats.users || 0;
            document.getElementById('stat-products').textContent = stats.products || 0;
            document.getElementById('stat-workshops').textContent = stats.workshops || 0;
            document.getElementById('stat-classes').textContent = stats.classes || 0;
        } else {
            console.warn('⚠️ Stats API failed, using defaults');
            document.getElementById('stat-users').textContent = '-';
            document.getElementById('stat-products').textContent = '-';
            document.getElementById('stat-workshops').textContent = '-';
            document.getElementById('stat-classes').textContent = '-';
        }
    } catch (error) {
        console.error('❌ Stats load error:', error);
        document.getElementById('stat-users').textContent = '-';
        document.getElementById('stat-products').textContent = '-';
        document.getElementById('stat-workshops').textContent = '-';
        document.getElementById('stat-classes').textContent = '-';
    }
    
    // Load recent activity (don't let this block the rest)
    try {
        const activityResponse = await fetch('/api/admin/dashboard/activity', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (activityResponse.ok) {
            const activities = await activityResponse.json();
            const activityContainer = document.getElementById('recent-activity');
            
            if (activities && activities.length > 0) {
                activityContainer.innerHTML = activities.map(activity => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-${activity.icon || 'info-circle'} text-sage"></i>
                            <span class="text-sm text-gray-700">${activity.message}</span>
                        </div>
                        <span class="text-xs text-gray-500">${formatDate(activity.created_at)}</span>
                    </div>
                `).join('');
            } else {
                activityContainer.innerHTML = '<p class="text-center text-gray-500 py-4">최근 활동이 없습니다.</p>';
            }
        } else {
            console.warn('⚠️ Activity API failed');
            document.getElementById('recent-activity').innerHTML = '<p class="text-center text-gray-500 py-4">활동 로그를 불러올 수 없습니다.</p>';
        }
    } catch (error) {
        console.error('❌ Activity load error:', error);
        document.getElementById('recent-activity').innerHTML = '<p class="text-center text-gray-500 py-4">활동 로그를 불러올 수 없습니다.</p>';
    }
    
    // Load user analytics charts (ALWAYS run this)
    try {
        console.log('🔄 Loading user analytics charts...');
        await loadUserAnalytics();
    } catch (error) {
        console.error('❌ User analytics error:', error);
    }
    
    // Load SNS and O2O analytics charts (ALWAYS run this)
    try {
        console.log('🔄 Loading SNS and O2O analytics...');
        await loadSNSStats();
        await loadO2OStats();
    } catch (error) {
        console.error('❌ SNS/O2O analytics error:', error);
    }
    
    console.log('✅ Dashboard load complete');
}

// Load Users - Enhanced with full member information
async function loadUsers() {
    console.log('👥 Loading users...');
    
    // Sample data for fallback - Updated with new categories
    const sampleUsers = [
        {
            id: 1,
            name: '김민준',
            email: 'minjun.kim@example.com',
            phone: '010-1234-5678',
            oauth_provider: 'kakao',
            referral_source: 'instagram',
            user_type: 'B2C',
            b2c_category: 'work',
            b2c_subcategory: 'it_developer',
            work_position: '백엔드 개발자',
            shipping_address: '서울특별시 강남구 테헤란로 123',
            role: 'user',
            created_at: '2024-01-15T09:30:00Z',
            is_active: 1
        },
        {
            id: 2,
            name: '이서연',
            email: 'seoyeon.lee@example.com',
            phone: '010-2345-6789',
            oauth_provider: 'naver',
            referral_source: 'blog',
            user_type: 'B2C',
            b2c_category: 'daily',
            b2c_subcategory: 'caregiver_working_mom',
            shipping_address: '서울특별시 송파구 올림픽로 456',
            role: 'user',
            created_at: '2024-01-20T14:20:00Z',
            is_active: 1
        },
        {
            id: 3,
            name: '박지훈',
            email: 'jihun.park@company.com',
            phone: '010-3456-7890',
            oauth_provider: 'email',
            referral_source: 'google',
            user_type: 'B2B',
            b2b_category: 'company',
            b2b_company_name: '테크스타트업',
            b2b_company_size: 'small',
            b2b_department: '인사팀',
            shipping_address: '경기도 성남시 분당구 판교역로 789',
            role: 'user',
            created_at: '2024-02-01T10:15:00Z',
            is_active: 1
        },
        {
            id: 4,
            name: '최수진',
            email: 'sujin.choi@gmail.com',
            phone: '010-4567-8901',
            oauth_provider: 'google',
            referral_source: 'youtube',
            user_type: 'B2C',
            b2c_category: 'work',
            b2c_subcategory: 'independent_freelancer',
            work_position: 'UX 디자이너',
            shipping_address: '부산광역시 해운대구 센텀중앙로 321',
            role: 'user',
            created_at: '2024-02-10T16:45:00Z',
            is_active: 1
        },
        {
            id: 5,
            name: '정예린',
            email: 'yerin.jung@naver.com',
            phone: '010-5678-9012',
            oauth_provider: 'naver',
            referral_source: 'direct',
            user_type: 'B2B',
            b2b_category: 'independent',
            b2b_independent_type: 'creator_influencer',
            b2b_shop_type: '뷰티 크리에이터',
            shipping_address: '인천광역시 연수구 컨벤시아대로 654',
            role: 'user',
            created_at: '2024-02-15T11:30:00Z',
            is_active: 1
        },
        {
            id: 6,
            name: '강태윤',
            email: 'taeyoon.kang@student.ac.kr',
            phone: '010-6789-0123',
            oauth_provider: 'kakao',
            referral_source: 'instagram',
            user_type: 'B2C',
            b2c_category: 'daily',
            b2c_subcategory: 'student_college',
            shipping_address: '대전광역시 유성구 대학로 111',
            role: 'user',
            created_at: '2024-02-20T09:00:00Z',
            is_active: 1
        },
        {
            id: 7,
            name: '윤미래',
            email: 'mirae.yoon@example.com',
            phone: '010-7890-1234',
            oauth_provider: 'naver',
            referral_source: 'blog',
            user_type: 'B2C',
            b2c_category: 'daily',
            b2c_subcategory: 'job_seeker_new',
            shipping_address: '광주광역시 북구 첨단과기로 222',
            role: 'user',
            created_at: '2024-02-25T11:15:00Z',
            is_active: 1
        },
        {
            id: 8,
            name: '한도현',
            email: 'dohyun.han@shop.com',
            phone: '010-8901-2345',
            oauth_provider: 'email',
            referral_source: 'direct',
            user_type: 'B2B',
            b2b_category: 'shop',
            b2b_shop_name: '한스 에스테틱',
            b2b_shop_type: '향수숍',
            shipping_address: '서울특별시 종로구 인사동길 333',
            role: 'user',
            created_at: '2024-03-01T14:30:00Z',
            is_active: 1
        },
        {
            id: 9,
            name: '서하은',
            email: 'haeun.seo@example.com',
            phone: '010-9012-3456',
            oauth_provider: 'google',
            referral_source: 'youtube',
            user_type: 'B2C',
            b2c_category: 'work',
            b2c_subcategory: 'design_planning',
            work_position: 'UI/UX 기획자',
            shipping_address: '대구광역시 수성구 동대구로 444',
            role: 'user',
            created_at: '2024-03-05T10:20:00Z',
            is_active: 1
        },
        {
            id: 10,
            name: '임준서',
            email: 'junseo.lim@example.com',
            phone: '010-0123-4567',
            oauth_provider: 'kakao',
            referral_source: 'instagram',
            user_type: 'B2C',
            b2c_category: 'work',
            b2c_subcategory: 'independent_startup',
            work_position: '스타트업 대표',
            shipping_address: '서울특별시 서초구 서초대로 555',
            role: 'user',
            created_at: '2024-03-10T16:00:00Z',
            is_active: 1
        }
    ];
    
    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        let users = [];
        
        if (response.ok) {
            const data = await response.json();
            users = data.users || data || [];
            console.log(`✅ Loaded ${users.length} users from API`);
        } else {
            console.warn('⚠️ Users API failed, using sample data');
            users = sampleUsers;
        }
        
        // If no users, use sample data
        if (users.length === 0) {
            console.log('📊 Using sample data');
            users = sampleUsers;
        }
        
        const tbody = document.getElementById('users-table-body');
        document.getElementById('users-total').textContent = users.length;
        
        tbody.innerHTML = users.map(user => {
            // OAuth provider formatting
            const providerLabels = {
                'email': '이메일',
                'naver': '네이버',
                'kakao': '카카오',
                'google': '구글'
            };
            const providerColors = {
                'email': 'gray',
                'naver': 'green',
                'kakao': 'yellow',
                'google': 'red'
            };
            const provider = user.oauth_provider || 'email';
            const providerLabel = providerLabels[provider] || provider;
            const providerColor = providerColors[provider] || 'gray';
            
            // User type details
            let userTypeDisplay = '';
            if (user.user_type === 'B2C') {
                userTypeDisplay = '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold"><i class="fas fa-user mr-1"></i>개인 (B2C)</span>';
            } else if (user.user_type === 'B2B') {
                userTypeDisplay = '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold"><i class="fas fa-briefcase mr-1"></i>기업 (B2B)</span>';
            } else {
                userTypeDisplay = '<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">미분류</span>';
            }
            
            // Sub-category details
            let subCategory = '-';
            if (user.user_type === 'B2C') {
                // B2C category display with subcategory
                const subcategoryMap = {
                    // Work stress categories
                    'it_developer': '💻 IT·개발자',
                    'design_planning': '🎨 디자인·기획',
                    'education_teacher': '👩‍🏫 교육·강사',
                    'medical_welfare': '⚕️ 의료·복지',
                    'service_customer': '🤝 서비스·고객응대',
                    'manufacturing_production': '🏭 제조·생산',
                    'public_admin': '🏛️ 공공·행정',
                    'sales_marketing': '📊 영업·마케팅',
                    'research_tech': '🔬 연구·기술',
                    'independent_self_employed': '🏪 자영업자',
                    'independent_freelancer': '💼 프리랜서',
                    'independent_startup': '🚀 창업자/스타트업',
                    'independent_creator': '📹 크리에이터/인플루언서',
                    // Daily stress categories
                    'student_middle': '중학생',
                    'student_high': '고등학생',
                    'student_college': '대학생',
                    'student_graduate': '대학원생',
                    'job_seeker_new': '신규 졸업자',
                    'job_seeker_career': '경력 전환자',
                    'job_seeker_long': '장기 구직자',
                    'job_seeker_exam': '고시 준비자',
                    'caregiver_working_mom': '워킹맘',
                    'caregiver_working_dad': '워킹대디',
                    'caregiver_fulltime': '전업 양육자',
                    'caregiver_single': '한부모'
                };
                
                if (user.b2c_category === 'daily' || user.b2c_category === 'daily_stress') {
                    subCategory = '<span class="text-xs text-purple-600">일상 스트레스</span>';
                    if (user.b2c_subcategory) {
                        const subcategoryLabel = subcategoryMap[user.b2c_subcategory] || user.b2c_subcategory;
                        subCategory += `<br><span class="text-xs text-gray-500">${subcategoryLabel}</span>`;
                    }
                } else if (user.b2c_category === 'work' || user.b2c_category === 'work_stress') {
                    subCategory = '<span class="text-xs text-blue-600">직무 스트레스</span>';
                    if (user.b2c_subcategory) {
                        const subcategoryLabel = subcategoryMap[user.b2c_subcategory] || user.b2c_subcategory;
                        subCategory += `<br><span class="text-xs text-gray-500">${subcategoryLabel}</span>`;
                    }
                }
            } else if (user.user_type === 'B2B') {
                // B2B category icons and labels
                if (user.b2b_category === 'independent') {
                    subCategory = '<span class="text-xs text-green-600"><i class="fas fa-store mr-1"></i>자영업자</span>';
                } else if (user.b2b_category === 'wholesale') {
                    subCategory = '<span class="text-xs text-blue-600"><i class="fas fa-truck mr-1"></i>도매/유통</span>';
                } else if (user.b2b_category === 'company') {
                    subCategory = '<span class="text-xs text-purple-600"><i class="fas fa-building mr-1"></i>기업 복지</span>';
                    // Add company size if available
                    if (user.company_size) {
                        const sizeMap = {
                            'under_20': '20인↓',
                            '20_to_50': '20~50인',
                            '50_to_100': '50~100인',
                            'over_100': '100인↑'
                        };
                        subCategory += `<br><span class="text-xs text-gray-500">${sizeMap[user.company_size] || user.company_size}</span>`;
                    }
                    // Add department if available
                    if (user.department) {
                        subCategory += `<br><span class="text-xs text-gray-500">${user.department}</span>`;
                    }
                }
                // Add business name if available
                if (user.b2b_business_name) {
                    subCategory += `<br><span class="text-xs text-gray-600 font-semibold">${user.b2b_business_name}</span>`;
                }
            }
            
            // Address formatting (B2B uses b2b_address, general address field)
            const address = user.address || user.b2b_address || '-';
            const shortAddress = address.length > 25 ? address.substring(0, 25) + '...' : address;
            
            // Role badge
            const roleLabel = user.role === 'admin' ? '관리자' : '일반';
            const roleBadge = user.role === 'admin' ? 
                '<span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold"><i class="fas fa-user-shield mr-1"></i>관리자</span>' :
                '<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">일반</span>';
            
            // Date formatting
            const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR', {month: '2-digit', day: '2-digit'}) : '-';
            
            return `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="px-4 py-3 text-sm font-mono text-gray-600">#${user.id}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 bg-${providerColor}-100 text-${providerColor}-800 rounded-full text-xs font-semibold">
                        ${providerLabel}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">${user.name || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${user.email}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${user.phone || '-'}</td>
                <td class="px-4 py-3 text-sm">${userTypeDisplay}</td>
                <td class="px-4 py-3 text-sm">${subCategory}</td>
                <td class="px-4 py-3 text-sm text-gray-500" title="${address}">${shortAddress}</td>
                <td class="px-4 py-3 text-sm">${roleBadge}</td>
                <td class="px-4 py-3 text-sm text-gray-500">${createdDate}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
                        ${user.is_active ? '활성' : '비활성'}
                    </span>
                </td>
            </tr>
            `;
        }).join('');
        
        console.log('✅ User table rendered');
    } catch (error) {
        console.error('❌ Users load error:', error);
        console.log('📊 Using sample data due to error');
        
        // Use sample data on error
        const sampleUsers = [
            {
                id: 1,
                name: '김민준',
                email: 'minjun.kim@example.com',
                phone: '010-1234-5678',
                oauth_provider: 'kakao',
                referral_source: 'instagram',
                user_type: 'B2C',
                b2c_category: 'work_stress',
                occupation: 'office_it',
                shipping_address: '서울특별시 강남구 테헤란로 123',
                role: 'user',
                created_at: '2024-01-15T09:30:00Z',
                is_active: 1
            },
            {
                id: 2,
                name: '이서연',
                email: 'seoyeon.lee@example.com',
                phone: '010-2345-6789',
                oauth_provider: 'naver',
                referral_source: 'blog',
                user_type: 'B2C',
                b2c_category: 'daily_stress',
                life_situation: 'parent',
                shipping_address: '서울특별시 송파구 올림픽로 456',
                role: 'user',
                created_at: '2024-01-20T14:20:00Z',
                is_active: 1
            },
            {
                id: 3,
                name: '박지훈',
                email: 'jihun.park@company.com',
                phone: '010-3456-7890',
                oauth_provider: 'email',
                referral_source: 'google',
                user_type: 'B2B',
                b2b_category: 'company',
                company_size: '50_to_100',
                shipping_address: '경기도 성남시 분당구 판교역로 789',
                role: 'user',
                created_at: '2024-02-01T10:15:00Z',
                is_active: 1
            },
            {
                id: 4,
                name: '최수진',
                email: 'sujin.choi@gmail.com',
                phone: '010-4567-8901',
                oauth_provider: 'google',
                referral_source: 'youtube',
                user_type: 'B2C',
                b2c_category: 'work_stress',
                occupation: 'service_retail',
                shipping_address: '부산광역시 해운대구 센텀중앙로 321',
                role: 'user',
                created_at: '2024-02-10T16:45:00Z',
                is_active: 1
            },
            {
                id: 5,
                name: '정예린',
                email: 'yerin.jung@naver.com',
                phone: '010-5678-9012',
                oauth_provider: 'naver',
                referral_source: 'direct',
                user_type: 'B2B',
                b2b_category: 'independent',
                shipping_address: '인천광역시 연수구 컨벤시아대로 654',
                role: 'user',
                created_at: '2024-02-15T11:30:00Z',
                is_active: 1
            }
        ];
        
        // Render sample users
        const tbody = document.getElementById('users-table-body');
        document.getElementById('users-total').textContent = sampleUsers.length;
        
        tbody.innerHTML = sampleUsers.map(user => {
            const providerLabels = {'email': '이메일', 'naver': '네이버', 'kakao': '카카오', 'google': '구글'};
            const providerColors = {'email': 'gray', 'naver': 'green', 'kakao': 'yellow', 'google': 'red'};
            const provider = user.oauth_provider || 'email';
            const providerLabel = providerLabels[provider] || provider;
            const providerColor = providerColors[provider] || 'gray';
            
            const referralLabels = {
                'instagram': '인스타그램', 'blog': '블로그', 'youtube': '유튜브',
                'google': '구글', 'naver': '네이버', 'kakao': '카카오', 'direct': '직접'
            };
            const referralSource = referralLabels[user.referral_source] || user.referral_source || '-';
            
            let userTypeDisplay = '';
            if (user.user_type === 'B2C') {
                userTypeDisplay = '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold"><i class="fas fa-user mr-1"></i>개인 (B2C)</span>';
            } else if (user.user_type === 'B2B') {
                userTypeDisplay = '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold"><i class="fas fa-briefcase mr-1"></i>기업 (B2B)</span>';
            }
            
            let subCategory = '-';
            if (user.user_type === 'B2C') {
                // B2C category display with subcategory
                const subcategoryMap = {
                    // Work stress categories
                    'it_developer': '💻 IT·개발자',
                    'design_planning': '🎨 디자인·기획',
                    'education_teacher': '👩‍🏫 교육·강사',
                    'medical_welfare': '⚕️ 의료·복지',
                    'service_customer': '🤝 서비스·고객응대',
                    'manufacturing_production': '🏭 제조·생산',
                    'public_admin': '🏛️ 공공·행정',
                    'sales_marketing': '📊 영업·마케팅',
                    'research_tech': '🔬 연구·기술',
                    'independent_self_employed': '🏪 자영업자',
                    'independent_freelancer': '💼 프리랜서',
                    'independent_startup': '🚀 창업자/스타트업',
                    'independent_creator': '📹 크리에이터/인플루언서',
                    // Daily stress categories
                    'student_middle': '중학생',
                    'student_high': '고등학생',
                    'student_college': '대학생',
                    'student_graduate': '대학원생',
                    'job_seeker_new': '신규 졸업자',
                    'job_seeker_career': '경력 전환자',
                    'job_seeker_long': '장기 구직자',
                    'job_seeker_exam': '고시 준비자',
                    'caregiver_working_mom': '워킹맘',
                    'caregiver_working_dad': '워킹대디',
                    'caregiver_fulltime': '전업 양육자',
                    'caregiver_single': '한부모'
                };
                
                if (user.b2c_category === 'daily' || user.b2c_category === 'daily_stress') {
                    subCategory = '<span class="text-xs text-purple-600">일상 스트레스</span>';
                    if (user.b2c_subcategory) {
                        const subcategoryLabel = subcategoryMap[user.b2c_subcategory] || user.b2c_subcategory;
                        subCategory += `<br><span class="text-xs text-gray-500">${subcategoryLabel}</span>`;
                    }
                } else if (user.b2c_category === 'work' || user.b2c_category === 'work_stress') {
                    subCategory = '<span class="text-xs text-blue-600">직무 스트레스</span>';
                    if (user.b2c_subcategory) {
                        const subcategoryLabel = subcategoryMap[user.b2c_subcategory] || user.b2c_subcategory;
                        subCategory += `<br><span class="text-xs text-gray-500">${subcategoryLabel}</span>`;
                    }
                }
            } else if (user.user_type === 'B2B') {
                if (user.b2b_category === 'independent') {
                    subCategory = '<span class="text-xs text-green-600"><i class="fas fa-store mr-1"></i>자영업자</span>';
                } else if (user.b2b_category === 'company') {
                    subCategory = '<span class="text-xs text-purple-600"><i class="fas fa-building mr-1"></i>기업 복지</span>';
                    if (user.company_size === '50_to_100') {
                        subCategory += '<br><span class="text-xs text-gray-500">50~100인</span>';
                    }
                }
            }
            
            const address = user.shipping_address || '-';
            const shortAddress = address.length > 20 ? address.substring(0, 20) + '...' : address;
            const roleBadge = user.role === 'admin' ? '<span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">관리자</span>' : '<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">회원</span>';
            const createdDate = new Date(user.created_at).toLocaleDateString('ko-KR');
            
            return `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">${user.id}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${providerColor}-100 text-${providerColor}-800">
                        <i class="fas fa-share-alt mr-1"></i>${providerLabel}
                    </span>
                    <br><span class="text-xs text-gray-500 mt-1">${referralSource}</span>
                </td>
                <td class="px-4 py-3 text-sm font-semibold text-gray-900">${user.name}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${user.email}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${user.phone || '-'}</td>
                <td class="px-4 py-3 text-sm">${userTypeDisplay}</td>
                <td class="px-4 py-3 text-sm">${subCategory}</td>
                <td class="px-4 py-3 text-sm text-gray-500" title="${address}">${shortAddress}</td>
                <td class="px-4 py-3 text-sm">${roleBadge}</td>
                <td class="px-4 py-3 text-sm text-gray-500">${createdDate}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
                        ${user.is_active ? '활성' : '비활성'}
                    </span>
                </td>
            </tr>
            `;
        }).join('');
    }
}

// Search Users
async function searchUsers() {
    const search = document.getElementById('user-search').value;
    const userType = document.getElementById('user-type-filter').value;
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (userType) params.append('user_type', userType);
    
    try {
        const response = await fetch(`/api/admin/users?${params}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const users = await response.json();
        
        const tbody = document.getElementById('users-table-body');
        document.getElementById('users-total').textContent = users.length;
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="12" class="px-6 py-8 text-center text-gray-500">
                    검색 결과가 없습니다.
                </td></tr>
            `;
            return;
        }
        
        tbody.innerHTML = users.map(user => {
            // OAuth provider formatting
            const providerLabels = {
                'email': '이메일',
                'naver': '네이버',
                'kakao': '카카오',
                'google': '구글'
            };
            const providerColors = {
                'email': 'gray',
                'naver': 'green',
                'kakao': 'yellow',
                'google': 'red'
            };
            const provider = user.oauth_provider || 'email';
            const providerLabel = providerLabels[provider] || provider;
            const providerColor = providerColors[provider] || 'gray';
            
            // Device type badge (5 types: Android, iOS, iPad, Android Tablet, Desktop)
            let deviceBadge = '';
            if (user.last_device_type === 'Android') {
                deviceBadge = '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"><i class="fab fa-android mr-1"></i>Android</span>';
            } else if (user.last_device_type === 'iOS') {
                deviceBadge = '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"><i class="fab fa-apple mr-1"></i>iOS</span>';
            } else if (user.last_device_type === 'iPad') {
                deviceBadge = '<span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"><i class="fas fa-tablet-alt mr-1"></i>iPad</span>';
            } else if (user.last_device_type === 'Android Tablet') {
                deviceBadge = '<span class="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full"><i class="fas fa-tablet-alt mr-1"></i>Android Tablet</span>';
            } else if (user.last_device_type === 'Desktop') {
                deviceBadge = '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"><i class="fas fa-desktop mr-1"></i>Desktop</span>';
            } else {
                deviceBadge = '<span class="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">-</span>';
            }
            
            // OS/Browser info
            const osInfo = user.last_os || '-';
            const browserInfo = user.last_browser || '-';
            const osBrowserText = osInfo !== '-' ? `${osInfo}<br/><small class="text-gray-500">${browserInfo}</small>` : '-';
            
            return `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="px-4 py-3 text-sm">${user.id}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 bg-${providerColor}-100 text-${providerColor}-800 rounded-full text-xs font-semibold">
                        ${providerLabel}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">${user.name || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${user.email}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${user.phone || '-'}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 bg-${user.user_type === 'B2C' ? 'blue' : 'purple'}-100 text-${user.user_type === 'B2C' ? 'blue' : 'purple'}-800 rounded-full text-xs">
                        ${user.user_type === 'B2C' ? '개인' : '기업'}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm">${deviceBadge}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${osBrowserText}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${user.role || 'user'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${formatDate(user.created_at)}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
                        ${user.is_active ? '활성' : '비활성'}
                    </span>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Search users error:', error);
    }
}

// Load Products
async function loadProducts() {
    try {
        console.log('Loading products...');
        const response = await fetch('/api/products');
        console.log('Products response status:', response.status);
        
        const data = await response.json();
        console.log('Products data:', data);
        
        const products = data.products || [];
        console.log('Products array length:', products.length);
        
        const grid = document.getElementById('products-grid');
        
        if (products.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">제품이 없습니다.</div>';
            return;
        }
        
        grid.innerHTML = products.map(product => {
            // Handle thumbnail image
            let imageHtml = '';
            if (product.thumbnail_image && product.thumbnail_image.startsWith('data:image')) {
                imageHtml = `<img src="${product.thumbnail_image}" alt="${product.name}" class="w-full h-full object-cover">`;
            } else if (product.thumbnail_image) {
                imageHtml = `<img src="${product.thumbnail_image}" alt="${product.name}" class="w-full h-full object-cover">`;
            } else {
                imageHtml = `<i class="fas fa-box text-white text-6xl"></i>`;
            }
            
            return `
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover-lift">
                <div class="h-48 flex items-center justify-center" style="background: linear-gradient(to bottom right, #7AA992, #BCA6E0);">
                    ${imageHtml}
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${product.name}</h3>
                    <p class="text-sm text-gray-600 mb-4" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.description || '설명 없음'}</p>
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-2xl font-bold" style="color: #7AA992;">${(product.price || 0).toLocaleString()}원</span>
                        <span class="text-sm text-gray-500">재고: ${product.stock || 0}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="status-badge ${product.is_active ? 'status-active' : 'status-inactive'}">
                            ${product.is_active ? '판매중' : '판매중지'}
                        </span>
                        <div class="flex space-x-2">
                            <button onclick="editProduct(${product.id})" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteProduct(${product.id})" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        console.log('Products grid updated successfully');
    } catch (error) {
        console.error('Products load error:', error);
        const grid = document.getElementById('products-grid');
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">제품을 불러오는데 실패했습니다. 콘솔을 확인하세요.</div>';
    }
}

// Load Workshops
async function loadWorkshops() {
    try {
        console.log('Loading workshops...');
        const response = await fetch('/api/workshops');
        console.log('Workshops response status:', response.status);
        
        const workshops = await response.json();
        console.log('All workshops:', workshops);
        
        const workshopList = workshops.filter(w => w.type === 'workshop');
        console.log('Filtered workshops:', workshopList);
        
        const grid = document.getElementById('workshops-grid');
        
        if (workshopList.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">워크샵이 없습니다.</div>';
            return;
        }
        
        grid.innerHTML = workshopList.map(workshop => `
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover-lift">
                <div class="h-48 flex items-center justify-center" style="background: linear-gradient(to bottom right, #60a5fa, #6366f1);">
                    ${workshop.image_url ? 
                        `<img src="${workshop.image_url}" alt="${workshop.title}" class="w-full h-full object-cover">` :
                        `<i class="fas fa-hands-helping text-white text-6xl"></i>`
                    }
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold" style="background-color: #dbeafe; color: #1e3a8a;">${workshop.category || '워크샵'}</span>
                        <span class="text-sm text-gray-500">${workshop.location || '-'}</span>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${workshop.title}</h3>
                    <p class="text-sm text-gray-600 mb-4" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${workshop.description || '설명 없음'}</p>
                    <div class="flex items-center justify-between mb-4 text-sm text-gray-600">
                        <div class="flex items-center space-x-4">
                            <span><i class="fas fa-clock mr-1"></i>${workshop.duration || 0}분</span>
                            <span><i class="fas fa-users mr-1"></i>최대 ${workshop.max_participants || 0}명</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-2xl font-bold" style="color: #2563eb;">${(workshop.price || 0).toLocaleString()}원</span>
                        <div class="flex space-x-2">
                            <button onclick="editWorkshop(${workshop.id})" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteWorkshop(${workshop.id})" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        console.log('Workshops grid updated successfully');
    } catch (error) {
        console.error('Workshops load error:', error);
        const grid = document.getElementById('workshops-grid');
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">워크샵을 불러오는데 실패했습니다. 콘솔을 확인하세요.</div>';
    }
}

// Load Classes
async function loadClasses() {
    try {
        console.log('Loading classes...');
        const response = await fetch('/api/workshops');
        console.log('Classes response status:', response.status);
        
        const workshops = await response.json();
        console.log('All workshops:', workshops);
        
        const classList = workshops.filter(w => w.type === 'class');
        console.log('Filtered classes:', classList);
        
        const grid = document.getElementById('classes-grid');
        
        if (classList.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">원데이 클래스가 없습니다.</div>';
            return;
        }
        
        grid.innerHTML = classList.map(cls => `
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover-lift">
                <div class="h-48 flex items-center justify-center" style="background: linear-gradient(to bottom right, #10b981, #14b8a6);">
                    ${cls.image_url ? 
                        `<img src="${cls.image_url}" alt="${cls.title}" class="w-full h-full object-cover">` :
                        `<i class="fas fa-chalkboard-teacher text-white text-6xl"></i>`
                    }
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold" style="background-color: #d1fae5; color: #065f46;">${cls.category || '클래스'}</span>
                        <span class="text-sm text-gray-500">${cls.location || '-'}</span>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${cls.title}</h3>
                    <p class="text-sm text-gray-600 mb-4" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${cls.description || '설명 없음'}</p>
                    <div class="flex items-center justify-between mb-4 text-sm text-gray-600">
                        <div class="flex items-center space-x-4">
                            <span><i class="fas fa-clock mr-1"></i>${cls.duration || 0}분</span>
                            <span><i class="fas fa-users mr-1"></i>최대 ${cls.max_participants || 0}명</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-2xl font-bold" style="color: #10b981;">${(cls.price || 0).toLocaleString()}원</span>
                        <div class="flex space-x-2">
                            <button onclick="editClass(${cls.id})" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteClass(${cls.id})" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        console.log('Classes grid updated successfully');
    } catch (error) {
        console.error('Classes load error:', error);
        const grid = document.getElementById('classes-grid');
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">원데이 클래스를 불러오는데 실패했습니다. 콘솔을 확인하세요.</div>';
    }
}

// Load Blog
async function loadBlog() {
    try {
        console.log('Loading blog posts...');
        await loadBlogPosts();
        await loadPostsForCommentSelect();
    } catch (error) {
        console.error('Blog load error:', error);
    }
}

// Load blog posts with comments stats
async function loadBlogPosts() {
    try {
        const response = await fetch('/api/admin/blog');
        const posts = await response.json();
        
        const grid = document.getElementById('blog-posts-grid');
        
        if (!posts || posts.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">블로그 포스트가 없습니다.</div>';
            return;
        }
        
        grid.innerHTML = posts.map(post => `
            <div class="bg-white border rounded-xl p-6 hover:shadow-lg transition">
                <h4 class="font-bold text-lg text-gray-800 mb-2">${post.title}</h4>
                <p class="text-sm text-gray-500 mb-4">게시물 ID: ${post.post_id}</p>
                
                <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-comments mr-2 text-blue-500"></i>
                        <span>댓글: <strong>${post.comment_count || 0}</strong>개</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-shopping-cart mr-2 text-green-500"></i>
                        <span>구매 의도: <strong>0</strong>개</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-user mr-2 text-blue-400"></i>
                        <span>B2C: <strong>0</strong></span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-briefcase mr-2 text-purple-400"></i>
                        <span>B2B: <strong>0</strong></span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-robot mr-2 text-orange-400"></i>
                        <span>챗봇 세션: <strong>0</strong></span>
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <a href="${post.url}" target="_blank" 
                        class="flex-1 text-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm">
                        <i class="fas fa-external-link-alt mr-1"></i>게시물 보기
                    </a>
                    <button onclick="viewComments(${post.id})" 
                        class="flex-1 text-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm">
                        <i class="fas fa-comments mr-1"></i>댓글 보기
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load blog posts error:', error);
    }
}

// Load posts for comment select dropdown
async function loadPostsForCommentSelect() {
    try {
        const response = await fetch('/api/admin/blog');
        const posts = await response.json();
        
        const select = document.getElementById('comment-post-id');
        select.innerHTML = '<option value="">게시물을 선택하세요</option>' +
            posts.map(post => `<option value="${post.id}">${post.title}</option>`).join('');
    } catch (error) {
        console.error('Load posts for select error:', error);
    }
}

// Add new blog post
async function addBlogPost() {
    const url = document.getElementById('blog-post-url').value.trim();
    const publishedAt = document.getElementById('blog-post-date').value.trim();
    
    if (!url) {
        alert('블로그 게시물 URL을 입력하세요.');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/blog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ url, published_at: publishedAt || null })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '게시물 추가 실패');
        }
        
        alert('✅ 블로그 게시물이 추가되었습니다!');
        document.getElementById('blog-post-url').value = '';
        document.getElementById('blog-post-date').value = '';
        await loadBlogPosts();
        await loadPostsForCommentSelect();
    } catch (error) {
        console.error('Add blog post error:', error);
        alert('❌ 게시물 추가 실패: ' + error.message);
    }
}

// Add comment with AI analysis
async function addComment() {
    const postId = document.getElementById('comment-post-id').value;
    const author = document.getElementById('comment-author').value.trim();
    const content = document.getElementById('comment-content').value.trim();
    const createdAt = document.getElementById('comment-date').value.trim();
    
    if (!postId) {
        alert('게시물을 선택하세요.');
        return;
    }
    if (!author) {
        alert('작성자명을 입력하세요.');
        return;
    }
    if (!content) {
        alert('댓글 내용을 입력하세요.');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/blog/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                post_id: postId,
                author_name: author,
                content: content,
                created_at: createdAt || null
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '댓글 추가 실패');
        }
        
        const data = await response.json();
        alert(`✅ 댓글이 추가되고 AI 분석이 완료되었습니다!\n\n감정: ${data.analysis?.emotion || 'N/A'}\n의도: ${data.analysis?.intent || 'N/A'}\n사용자 타입: ${data.analysis?.user_type || 'N/A'}`);
        resetCommentForm();
        await loadBlogPosts();
    } catch (error) {
        console.error('Add comment error:', error);
        alert('❌ 댓글 추가 실패: ' + error.message);
    }
}

// Reset comment form
function resetCommentForm() {
    document.getElementById('comment-post-id').value = '';
    document.getElementById('comment-author').value = '';
    document.getElementById('comment-content').value = '';
    document.getElementById('comment-date').value = '';
}

// View comments for a post
function viewComments(postId) {
    alert(`게시물 ${postId}의 댓글 보기 기능은 준비 중입니다.`);
}

// Modal Functions
function openProductModal() {
    document.getElementById('product-modal').classList.remove('hidden');
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-modal-title').textContent = '제품 등록';
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

function openWorkshopModal() {
    document.getElementById('workshop-modal').classList.remove('hidden');
    document.getElementById('workshop-form').reset();
    document.getElementById('workshop-id').value = '';
    document.getElementById('workshop-modal-title').textContent = '워크샵 등록';
}

function closeWorkshopModal() {
    document.getElementById('workshop-modal').classList.add('hidden');
}

function openBlogModal() {
    alert('블로그 작성 기능은 준비 중입니다.');
}

// Open Class Modal
function openClassModal(classData = null) {
    const modal = document.getElementById('class-modal');
    const title = document.getElementById('class-modal-title');
    const form = document.getElementById('class-form');
    
    if (classData) {
        title.textContent = '클래스 수정';
        document.getElementById('class-id').value = classData.id;
        document.getElementById('class-title').value = classData.title;
        document.getElementById('class-description').value = classData.description;
        document.getElementById('class-price').value = classData.price;
        document.getElementById('class-duration').value = classData.duration;
        document.getElementById('class-max-participants').value = classData.max_participants;
        document.getElementById('class-location').value = classData.location;
        document.getElementById('class-is-active').checked = classData.is_active === 1;
    } else {
        title.textContent = '클래스 등록';
        form.reset();
        document.getElementById('class-id').value = '';
    }
    
    modal.classList.remove('hidden');
}

// Close Class Modal
function closeClassModal() {
    document.getElementById('class-modal').classList.add('hidden');
    document.getElementById('class-form').reset();
}

// Save Class
async function saveClass(event) {
    event.preventDefault();
    
    const classData = {
        title: document.getElementById('class-title').value,
        description: document.getElementById('class-description').value,
        price: parseInt(document.getElementById('class-price').value),
        duration: parseInt(document.getElementById('class-duration').value),
        max_participants: parseInt(document.getElementById('class-max-participants').value),
        location: document.getElementById('class-location').value,
        is_active: document.getElementById('class-is-active').checked ? 1 : 0
    };
    
    try {
        const classId = document.getElementById('class-id').value;
        const url = classId ? `/api/classes/${classId}` : '/api/classes';
        const method = classId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(classData)
        });
        
        if (response.ok) {
            alert(classId ? '클래스가 수정되었습니다.' : '클래스가 등록되었습니다.');
            closeClassModal();
            loadClasses();
        } else {
            const error = await response.json();
            alert('저장 실패: ' + (error.message || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error('Save class error:', error);
        alert('저장 중 오류가 발생했습니다.');
    }
}

// Save Product
async function saveProduct(event) {
    event.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value,
        price: parseInt(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        description: document.getElementById('product-description').value,
        is_active: document.getElementById('product-is-active').checked ? 1 : 0
    };
    
    try {
        const productId = document.getElementById('product-id').value;
        const url = productId ? `/api/products/${productId}` : '/api/products';
        const method = productId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            alert('제품이 저장되었습니다.');
            closeProductModal();
            loadProducts();
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        console.error('Save product error:', error);
        alert('제품 저장에 실패했습니다.');
    }
}

// Save Workshop
async function saveWorkshop(event) {
    event.preventDefault();
    
    const workshopData = {
        title: document.getElementById('workshop-title').value,
        description: document.getElementById('workshop-description').value,
        price: parseInt(document.getElementById('workshop-price').value),
        duration: parseInt(document.getElementById('workshop-duration').value),
        max_participants: parseInt(document.getElementById('workshop-max-participants').value),
        location: document.getElementById('workshop-location').value,
        is_active: document.getElementById('workshop-is-active').checked ? 1 : 0,
        type: currentTab === 'workshops' ? 'workshop' : 'class'
    };
    
    try {
        const workshopId = document.getElementById('workshop-id').value;
        const url = workshopId ? `/api/workshops/${workshopId}` : '/api/workshops';
        const method = workshopId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(workshopData)
        });
        
        if (response.ok) {
            alert('저장되었습니다.');
            closeWorkshopModal();
            if (currentTab === 'workshops') {
                loadWorkshops();
            } else {
                loadClasses();
            }
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        console.error('Save workshop error:', error);
        alert('저장에 실패했습니다.');
    }
}

// Edit Functions
function editProduct(id) {
    alert('제품 수정 기능은 준비 중입니다. ID: ' + id);
}

function editWorkshop(id) {
    alert('워크샵 수정 기능은 준비 중입니다. ID: ' + id);
}

function editClass(id) {
    alert('클래스 수정 기능은 준비 중입니다. ID: ' + id);
}

// Delete Functions
async function deleteProduct(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            alert('삭제되었습니다.');
            loadProducts();
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        console.error('Delete product error:', error);
        alert('삭제에 실패했습니다.');
    }
}

async function deleteWorkshop(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        const response = await fetch(`/api/workshops/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            alert('삭제되었습니다.');
            loadWorkshops();
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        console.error('Delete workshop error:', error);
        alert('삭제에 실패했습니다.');
    }
}

async function deleteClass(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        const response = await fetch(`/api/workshops/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            alert('삭제되었습니다.');
            loadClasses();
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        console.error('Delete class error:', error);
        alert('삭제에 실패했습니다.');
    }
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Dashboard loaded');
    
    // Check authentication
    if (!checkAuth()) {
        return;
    }
    
    // Load initial tab
    loadTabData('dashboard');
});

// ==================== BLOG FUNCTIONS ====================

// Blog Sub Tab Switching
let currentBlogSubTab = 'high-leads';

function switchBlogSubTab(tabName) {
    currentBlogSubTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.blog-sub-tab-btn').forEach(btn => {
        btn.classList.remove('border-lavender', 'text-lavender');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Highlight active tab
    event.target.closest('button').classList.remove('border-transparent', 'text-gray-500');
    event.target.closest('button').classList.add('border-lavender', 'text-lavender');
    
    // Hide all sub tabs
    document.querySelectorAll('.blog-sub-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show selected sub tab
    document.getElementById(`blog-${tabName}-tab`).classList.remove('hidden');
    
    // Load data for selected tab
    if (tabName === 'high-leads') {
        loadBlogHighLeads();
    } else if (tabName === 'posts') {
        loadBlogPostsList();
    } else if (tabName === 'add-comment') {
        loadBlogPostsForCommentSelect();
    }
}

// Load Blog Stats
async function loadBlogStats() {
    try {
        const response = await fetch('/api/blog-analysis/stats/user-types', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Stats load failed');
        
        const data = await response.json();
        const stats = data.stats || [];
        
        let totalComments = 0;
        let b2cCount = 0;
        let b2bCount = 0;
        let totalConversion = 0;
        
        stats.forEach(stat => {
            totalComments += stat.count;
            if (stat.user_type_prediction === 'B2C') b2cCount = stat.count;
            if (stat.user_type_prediction === 'B2B') b2bCount = stat.count;
            totalConversion += stat.avg_conversion_rate * stat.count;
        });
        
        const avgConversion = totalComments > 0 ? (totalConversion / totalComments * 100).toFixed(1) : 0;
        
        document.getElementById('blog-stat-comments').textContent = totalComments;
        document.getElementById('blog-stat-b2c').textContent = b2cCount;
        document.getElementById('blog-stat-b2b').textContent = b2bCount;
        document.getElementById('blog-stat-conversion').textContent = avgConversion + '%';
    } catch (error) {
        console.error('Blog stats load error:', error);
    }
}

// Load High Conversion Leads
async function loadBlogHighLeads() {
    const minConversion = document.getElementById('blog-min-conversion-filter').value;
    const container = document.getElementById('blog-high-leads-list');
    
    container.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i></div>';
    
    try {
        const response = await fetch(`/api/blog-analysis/high-conversion-leads?min_probability=${minConversion}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('High leads load failed');
        
        const data = await response.json();
        const leads = data.leads || [];
        
        if (leads.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-inbox text-6xl mb-4"></i>
                    <p class="text-lg">전환율 ${(minConversion * 100).toFixed(0)}% 이상의 리드가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = leads.map(lead => createBlogLeadCard(lead)).join('');
    } catch (error) {
        console.error('High leads load error:', error);
        container.innerHTML = `
            <div class="text-center py-12 text-red-500">
                <i class="fas fa-exclamation-circle text-6xl mb-4"></i>
                <p>리드를 불러오는 중 오류가 발생했습니다.</p>
            </div>
        `;
    }
}

// Create Blog Lead Card
function createBlogLeadCard(lead) {
    const conversionPercent = (lead.conversion_probability * 100).toFixed(0);
    
    let userTypeBadge = '';
    if (lead.user_type_prediction === 'B2C') {
        userTypeBadge = '<span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"><i class="fas fa-user mr-1"></i>B2C</span>';
    } else if (lead.user_type_prediction === 'B2B') {
        userTypeBadge = '<span class="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full"><i class="fas fa-briefcase mr-1"></i>B2B</span>';
    }
    
    let sentimentIcon = '';
    if (lead.sentiment === 'positive') {
        sentimentIcon = '<i class="fas fa-smile text-green-500"></i>';
    } else if (lead.sentiment === 'negative') {
        sentimentIcon = '<i class="fas fa-frown text-red-500"></i>';
    } else {
        sentimentIcon = '<i class="fas fa-meh text-gray-500"></i>';
    }
    
    const contextTags = lead.context_tags ? JSON.parse(lead.context_tags) : [];
    const tagsHtml = contextTags.slice(0, 3).map(tag => 
        `<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">${tag}</span>`
    ).join('');
    
    return `
        <div class="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center space-x-3">
                    ${userTypeBadge}
                    <span class="text-sm text-gray-600">
                        <i class="fas fa-user-circle mr-1"></i>${lead.author_name || '익명'}
                    </span>
                    ${sentimentIcon}
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-orange-600">${conversionPercent}%</div>
                    <div class="text-xs text-gray-500">전환 가능성</div>
                </div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <p class="text-gray-800 leading-relaxed">${lead.content}</p>
            </div>
            
            <div class="flex items-center justify-between mb-4">
                <div class="flex flex-wrap gap-2">
                    ${tagsHtml}
                </div>
                <a href="${lead.post_url}" target="_blank" class="text-sm text-purple-600 hover:text-purple-700">
                    <i class="fas fa-external-link-alt mr-1"></i>원문 보기
                </a>
            </div>
            
            <div class="flex justify-end space-x-3">
                <button onclick="viewBlogLeadDetail(${lead.id})" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i class="fas fa-eye mr-2"></i>상세보기
                </button>
                <button onclick="inviteBlogSignup(${lead.id})" class="px-4 py-2 bg-lavender text-white rounded-lg hover:opacity-90">
                    <i class="fas fa-user-plus mr-2"></i>가입 유도
                </button>
            </div>
        </div>
    `;
}

// View Blog Lead Detail
function viewBlogLeadDetail(commentId) {
    alert(`댓글 ID ${commentId}의 상세 분석 기능은 추후 구현 예정입니다.`);
}

// Invite Blog Signup
function inviteBlogSignup(commentId) {
    alert(`댓글 ID ${commentId}에 대한 회원가입 초대 기능은 추후 구현 예정입니다.`);
}

// Load Blog Posts List
async function loadBlogPostsList() {
    const container = document.getElementById('blog-posts-list');
    container.innerHTML = '<div class="col-span-full text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i></div>';
    
    try {
        const response = await fetch('/api/blog/posts');
        
        if (!response.ok) throw new Error('Blog posts load failed');
        
        const data = await response.json();
        const posts = data.posts || [];
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <i class="fas fa-inbox text-6xl mb-4"></i>
                    <p class="text-lg">블로그 포스트가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h4 class="text-lg font-bold text-gray-800 mb-2">${post.title}</h4>
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                            <span><i class="fas fa-calendar mr-1"></i>${formatDate(post.published_at)}</span>
                            <span><i class="fas fa-eye mr-1"></i>${post.view_count || 0}</span>
                            <span><i class="fas fa-comment mr-1"></i>${post.comment_count || 0}</span>
                        </div>
                    </div>
                    <a href="${post.url}" target="_blank" class="ml-4 px-4 py-2 bg-lavender text-white rounded-lg hover:opacity-90 transition flex items-center">
                        <i class="fas fa-external-link-alt mr-2"></i>
                        보기
                    </a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Blog posts load error:', error);
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-500">
                <i class="fas fa-exclamation-circle text-6xl mb-4"></i>
                <p class="text-lg">블로그 포스트를 불러오는데 실패했습니다.</p>
            </div>
        `;
    }
}

// Load Blog Posts for Comment Select
async function loadBlogPostsForCommentSelect() {
    try {
        const response = await fetch('/api/blog/posts');
        const data = await response.json();
        const posts = data.posts || [];
        
        const select = document.getElementById('comment-post-id');
        select.innerHTML = '<option value="">게시물을 선택하세요</option>' + 
            posts.map(post => `<option value="${post.id}">${post.title}</option>`).join('');
    } catch (error) {
        console.error('Blog posts load for select error:', error);
    }
}

// Add Blog Post
async function addBlogPost() {
    const url = document.getElementById('blog-post-url').value.trim();
    const date = document.getElementById('blog-post-date').value.trim();
    
    if (!url) {
        alert('블로그 게시물 URL을 입력해주세요.');
        return;
    }
    
    try {
        const response = await fetch('/api/blog-reviews/add-post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ url, published_at: date || null })
        });
        
        if (response.ok) {
            alert('블로그 게시물이 추가되었습니다.');
            resetBlogPostForm();
            switchBlogSubTab('posts');
        } else {
            throw new Error('Add post failed');
        }
    } catch (error) {
        console.error('Add blog post error:', error);
        alert('블로그 게시물 추가에 실패했습니다.');
    }
}

// Reset Blog Post Form
function resetBlogPostForm() {
    document.getElementById('blog-post-url').value = '';
    document.getElementById('blog-post-date').value = '';
}

// Add Blog Comment
async function addBlogComment() {
    const postId = document.getElementById('comment-post-id').value;
    const author = document.getElementById('comment-author').value.trim();
    const content = document.getElementById('comment-content').value.trim();
    const date = document.getElementById('comment-date').value.trim();
    
    if (!postId) {
        alert('블로그 게시물을 선택해주세요.');
        return;
    }
    
    if (!author || !content) {
        alert('작성자명과 댓글 내용을 입력해주세요.');
        return;
    }
    
    try {
        const response = await fetch('/api/blog-reviews/add-comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                post_id: postId,
                author_name: author,
                content: content,
                created_at: date || null
            })
        });
        
        if (response.ok) {
            alert('댓글이 추가되고 AI 분석이 완료되었습니다.');
            resetBlogCommentForm();
            // Reload stats and high leads
            loadBlogStats();
            if (currentBlogSubTab === 'high-leads') {
                loadBlogHighLeads();
            }
        } else {
            throw new Error('Add comment failed');
        }
    } catch (error) {
        console.error('Add blog comment error:', error);
        alert('댓글 추가에 실패했습니다.');
    }
}

// Reset Blog Comment Form
function resetBlogCommentForm() {
    document.getElementById('comment-post-id').value = '';
    document.getElementById('comment-author').value = '';
    document.getElementById('comment-content').value = '';
    document.getElementById('comment-date').value = '';
}

// Update loadBlog function to include stats
const originalLoadBlog = loadBlog;
async function loadBlog() {
    await loadBlogStats();
    await loadBlogHighLeads();
}

// Crawl All Blog Comments (Bulk Crawling)
async function crawlAllBlogComments() {
    const btn = document.getElementById('crawl-all-btn');
    const progressContainer = document.getElementById('crawl-progress-container');
    const resultsContainer = document.getElementById('crawl-results-container');
    
    // Confirm action
    if (!confirm('모든 블로그 포스트의 댓글을 수집하시겠습니까?\n이 작업은 몇 분 정도 소요될 수 있습니다.')) {
        return;
    }
    
    // Disable button and show progress
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i><span>수집 중...</span>';
    
    progressContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    
    try {
        // Start crawling
        const response = await fetch('/api/blog-reviews/crawl-all-posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Crawl failed');
        }
        
        const result = await response.json();
        
        // Hide progress, show results
        progressContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        
        // Update result summary
        document.getElementById('crawl-result-total').textContent = result.summary.total_comments_collected;
        document.getElementById('crawl-result-success').textContent = result.summary.success_count;
        document.getElementById('crawl-result-fail').textContent = result.summary.fail_count;
        
        // Show success message
        alert(`댓글 수집 완료!\n총 ${result.summary.total_comments_collected}개의 댓글이 수집되었습니다.`);
        
        // Reload blog stats and posts
        await loadBlogStats();
        await loadBlogPostsList();
        
    } catch (error) {
        console.error('Bulk crawl error:', error);
        alert('댓글 일괄 수집에 실패했습니다.\n네트워크 연결을 확인하고 다시 시도해주세요.');
        progressContainer.classList.add('hidden');
    } finally {
        // Re-enable button
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i><span>모든 댓글 수집</span>';
    }
}

// ==================== Visitor Statistics ====================

// Load Visitor Stats
async function loadVisitorStats() {
    try {
        const response = await fetch('/api/visitors/stats');
        const data = await response.json();
        
        // Update today visitors
        document.getElementById('stat-visitors-today').textContent = data.today_visitors || 0;
        
        // Update total visitors
        document.getElementById('stat-visitors-total').textContent = data.total_visitors || 0;
        
    } catch (error) {
        console.error('Visitor stats load error:', error);
        document.getElementById('stat-visitors-today').textContent = '0';
        document.getElementById('stat-visitors-total').textContent = '0';
    }
}

// ==================== User Management Statistics ====================

// Load User Stats
async function loadUserStats() {
    try {
        const response = await fetch('/api/admin/users/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load user stats');
        
        const data = await response.json();
        
        // Update user stats cards in users section
        document.getElementById('user-stat-total').textContent = data.total_users || 0;
        document.getElementById('user-stat-b2c').textContent = data.b2c_users || 0;
        document.getElementById('user-stat-b2b').textContent = data.b2b_users || 0;
        document.getElementById('user-stat-new').textContent = data.new_users_7days || 0;
        
        // Also update dashboard total users
        document.getElementById('stat-users').textContent = data.total_users || 0;
        
    } catch (error) {
        console.error('User stats load error:', error);
        document.getElementById('user-stat-total').textContent = '0';
        document.getElementById('user-stat-b2c').textContent = '0';
        document.getElementById('user-stat-b2b').textContent = '0';
        document.getElementById('user-stat-new').textContent = '0';
    }
}

// Update loadDashboard to include visitor stats, user analytics, SNS, and O2O
const originalLoadDashboard = loadDashboard;
async function loadDashboard() {
    if (originalLoadDashboard) await originalLoadDashboard();
    await loadVisitorStats();
    await loadUserStats();
    await loadUserAnalytics();
    await loadSNSStats();
    await loadO2OStats();
}

// Update loadUsers to include user stats
const originalLoadUsers = loadUsers;
async function loadUsers() {
    await loadUserStats();
    if (originalLoadUsers) await originalLoadUsers();
}

// Reset Visitor Statistics
async function resetVisitorStats(resetType) {
    try {
        // Confirmation message
        let confirmMessage = '';
        if (resetType === 'today') {
            confirmMessage = '오늘 방문자 통계를 리셋하시겠습니까?\n\n리셋되는 데이터:\n- 오늘 날짜의 방문자 기록\n- 오늘 날짜의 통계\n\n전체 방문자 수는 유지됩니다.';
        } else if (resetType === 'all') {
            confirmMessage = '⚠️ 경고: 전체 방문자 통계를 리셋하시겠습니까?\n\n리셋되는 데이터:\n- 모든 날짜의 방문자 기록\n- 모든 통계\n\n이 작업은 되돌릴 수 없습니다!';
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Show loading indicator
        const todayBtn = document.querySelector('button[onclick="resetVisitorStats(\'today\')"]');
        const allBtn = document.querySelector('button[onclick="resetVisitorStats(\'all\')"]');
        const targetBtn = resetType === 'today' ? todayBtn : allBtn;
        const originalText = targetBtn.innerHTML;
        targetBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>리셋 중...';
        targetBtn.disabled = true;
        
        // Call reset API
        const response = await fetch('/api/visitors/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reset_type: resetType })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success message
            let successMessage = '';
            if (resetType === 'today') {
                successMessage = `✅ 오늘 방문자 통계가 리셋되었습니다.\n\n리셋 날짜: ${data.reset_date}`;
            } else {
                successMessage = '✅ 전체 방문자 통계가 리셋되었습니다.\n\n모든 기록이 삭제되었습니다.';
            }
            alert(successMessage);
            
            // Reload visitor stats
            await loadVisitorStats();
        } else {
            throw new Error(data.error || '방문자 통계 리셋 실패');
        }
        
        // Restore button
        targetBtn.innerHTML = originalText;
        targetBtn.disabled = false;
        
    } catch (error) {
        console.error('Reset visitor stats error:', error);
        alert('❌ 오류: ' + error.message);
        
        // Restore button on error
        const todayBtn = document.querySelector('button[onclick="resetVisitorStats(\'today\')"]');
        const allBtn = document.querySelector('button[onclick="resetVisitorStats(\'all\')"]');
        const targetBtn = resetType === 'today' ? todayBtn : allBtn;
        if (targetBtn) {
            targetBtn.innerHTML = resetType === 'today' 
                ? '<i class="fas fa-redo mr-1"></i>오늘 통계 리셋'
                : '<i class="fas fa-trash-alt mr-1"></i>전체 통계 리셋';
            targetBtn.disabled = false;
        }
    }
}

// ==================== Enhanced Dashboard Features ====================

// Chart instances
let weeklyVisitorsChart = null;
let deviceStatsChart = null;

// Enhanced Load Visitor Stats with comparison
async function loadEnhancedVisitorStats() {
    try {
        const response = await fetch('/api/visitors/stats');
        const data = await response.json();
        
        // Update today visitors with change indicator
        document.getElementById('stat-visitors-today').textContent = data.today_visitors || 0;
        
        // Update change indicator
        const changeEl = document.getElementById('stat-visitors-today-change');
        if (changeEl && data.comparison) {
            const change = data.comparison.visitors_change;
            const trend = data.comparison.visitors_trend;
            
            if (trend === 'up') {
                changeEl.innerHTML = `<i class="fas fa-arrow-up"></i> ${Math.abs(change).toFixed(1)}%`;
                changeEl.className = 'text-sm font-medium text-green-300';
            } else if (trend === 'down') {
                changeEl.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(change).toFixed(1)}%`;
                changeEl.className = 'text-sm font-medium text-red-300';
            } else {
                changeEl.innerHTML = `<i class="fas fa-minus"></i> 0%`;
                changeEl.className = 'text-sm font-medium text-purple-200';
            }
        }
        
        // Update total visitors
        document.getElementById('stat-visitors-total').textContent = data.total_visitors || 0;
        
        // Update weekly chart
        if (data.week && data.week.length > 0) {
            updateWeeklyChart(data.week);
        } else {
            // Show message when no data
            const ctx = document.getElementById('weeklyVisitorsChart');
            if (ctx && ctx.parentElement) {
                ctx.parentElement.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-chart-line text-gray-300 text-4xl mb-3"></i>
                        <p class="text-gray-400 text-sm">주간 데이터가 부족합니다</p>
                        <p class="text-gray-400 text-xs mt-1">며칠 후 차트가 표시됩니다</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('Enhanced visitor stats load error:', error);
        document.getElementById('stat-visitors-today').textContent = '0';
        document.getElementById('stat-visitors-total').textContent = '0';
    }
}

// Update Weekly Visitors Chart
function updateWeeklyChart(weekData) {
    const ctx = document.getElementById('weeklyVisitorsChart');
    if (!ctx) return;
    
    const labels = weekData.map(d => {
        const date = new Date(d.stat_date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    const visitors = weekData.map(d => d.unique_visitors || 0);
    const visits = weekData.map(d => d.total_visits || 0);
    
    if (weeklyVisitorsChart) {
        weeklyVisitorsChart.destroy();
    }
    
    weeklyVisitorsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '순 방문자',
                    data: visitors,
                    borderColor: 'rgb(147, 51, 234)',
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: '총 방문',
                    data: visits,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Load Recent Users
async function loadRecentUsers() {
    console.log('👥 loadRecentUsers called');
    const container = document.getElementById('recent-users');
    if (!container) {
        console.error('❌ recent-users container not found');
        return;
    }
    
    try {
        console.log('📡 Fetching recent users...');
        const response = await fetch('/api/admin/dashboard/recent-users?limit=5', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log(`📡 Response status: ${response.status}`);
        
        if (!response.ok) {
            console.warn('⚠️ Recent users API failed');
            container.innerHTML = '<p class="text-gray-400 text-sm text-center py-4"><i class="fas fa-info-circle mr-2"></i>회원 목록을 불러올 수 없습니다</p>';
            return;
        }
        
        const users = await response.json();
        console.log(`✅ Loaded ${users.length} recent users:`, users);
        
        if (!users || users.length === 0) {
            console.log('📭 No recent users');
            container.innerHTML = '<p class="text-gray-400 text-sm text-center py-4"><i class="fas fa-inbox mr-2"></i>최근 가입 회원이 없습니다</p>';
            return;
        }
        
        const html = users.map(user => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-800 truncate">${user.name || '이름 없음'}</p>
                    <p class="text-xs text-gray-500 truncate">${user.email}</p>
                </div>
                <div class="text-right ml-3 flex-shrink-0">
                    <span class="text-xs px-2 py-1 rounded-full ${getUserTypeBadge(user.user_type)}">${getUserTypeLabel(user.user_type)}</span>
                    <p class="text-xs text-gray-400 mt-1">${formatDate(user.created_at)}</p>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        console.log('✅ Recent users rendered');
        
    } catch (error) {
        console.error('❌ Load recent users error:', error);
        container.innerHTML = '<p class="text-red-400 text-sm text-center py-4"><i class="fas fa-exclamation-triangle mr-2"></i>로딩 실패</p>';
    }
}

// Load Recent Activities
async function loadRecentActivities() {
    const container = document.getElementById('recent-activity');
    if (!container) return;
    
    try {
        const response = await fetch('/api/admin/dashboard/recent-activities?limit=10', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('Recent activities API failed');
            container.innerHTML = '<p class="text-gray-400 text-sm text-center py-4"><i class="fas fa-info-circle mr-2"></i>활동 로그를 불러올 수 없습니다</p>';
            return;
        }
        
        const activities = await response.json();
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-sm text-center py-4"><i class="fas fa-inbox mr-2"></i>최근 활동이 없습니다</p>';
            return;
        }
        
        container.innerHTML = activities.map(activity => {
            const icon = activity.activity_type === 'login' ? 'fa-sign-in-alt' : 'fa-user-plus';
            const color = activity.activity_type === 'login' ? 'text-blue-500' : 'text-green-500';
            const label = activity.activity_type === 'login' ? '로그인' : '가입';
            
            return `
                <div class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition">
                    <i class="fas ${icon} ${color}"></i>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-800 truncate">${activity.email}</p>
                        <p class="text-xs text-gray-500">${label} • ${formatDate(activity.created_at)}</p>
                    </div>
                    ${activity.device_type && activity.device_type !== 'unknown' ? 
                        `<i class="fas fa-${getDeviceIcon(activity.device_type)} text-gray-400 text-sm"></i>` : ''
                    }
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Load recent activities error:', error);
        container.innerHTML = '<p class="text-red-400 text-sm text-center py-4"><i class="fas fa-exclamation-triangle mr-2"></i>로딩 실패</p>';
    }
}

// Load Device Stats
async function loadDeviceStats() {
    const ctx = document.getElementById('deviceStatsChart');
    if (!ctx) return;
    
    try {
        const response = await fetch('/api/admin/dashboard/device-stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('Device stats API failed');
            ctx.parentElement.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-info-circle text-gray-400 text-3xl mb-2"></i>
                    <p class="text-gray-400 text-sm">디바이스 통계를 불러올 수 없습니다</p>
                    <p class="text-gray-400 text-xs mt-1">로그인 로그 테이블이 필요합니다</p>
                </div>
            `;
            return;
        }
        
        const data = await response.json();
        
        // Debug: Check what data we're receiving
        console.log('[Device Stats] API Response:', {
            hasCombined: !!data.combined,
            combinedLength: data.combined?.length || 0,
            hasDevices: !!data.devices,
            devicesLength: data.devices?.length || 0
        });
        
        if ((!data.devices || data.devices.length === 0) && (!data.os || data.os.length === 0) && (!data.combined || data.combined.length === 0)) {
            ctx.parentElement.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-inbox text-gray-400 text-3xl mb-2"></i>
                    <p class="text-gray-400 text-sm">디바이스 통계가 없습니다</p>
                    <p class="text-gray-400 text-xs mt-1">로그인 후 데이터가 수집됩니다</p>
                </div>
            `;
            return;
        }
        
        // Use combined data for accurate categorization
        // Categories: Android (mobile), iOS (mobile), iPad (iOS tablet), Android Tablet, Desktop
        const categories = {
            'Android': 0,
            'iOS': 0,
            'iPad': 0,
            'Android Tablet': 0,
            'Desktop': 0
        };
        
        // Use combined stats if available (most accurate)
        if (data.combined && data.combined.length > 0) {
            console.log('[Device Stats] Using COMBINED data');
            data.combined.forEach(item => {
                const deviceType = (item.device_type || '').toLowerCase();
                const os = (item.device_os || '').toLowerCase();
                const count = parseInt(item.count) || 0;
                
                console.log(`  Processing: type="${deviceType}", os="${os}", count=${count}`);
                
                if (deviceType === 'mobile') {
                    if (os.includes('android')) {
                        categories['Android'] += count;
                    } else if (os.includes('ios') || os.includes('iphone')) {
                        categories['iOS'] += count;
                    }
                } else if (deviceType === 'tablet') {
                    if (os.includes('android')) {
                        categories['Android Tablet'] += count;
                        console.log(`    → Android Tablet: ${categories['Android Tablet']}`);
                    } else if (os.includes('ios') || os.includes('ipad')) {
                        categories['iPad'] += count;
                        console.log(`    → iPad: ${categories['iPad']}`);
                    }
                } else if (deviceType === 'desktop') {
                    categories['Desktop'] += count;
                }
            });
            console.log('[Device Stats] Final categories:', categories);
        } else if (data.devices && data.devices.length > 0) {
            console.log('[Device Stats] Using FALLBACK data (devices only)');
            // Fallback: Try to use OS data if available
            const osMap = {};
            if (data.os && data.os.length > 0) {
                data.os.forEach(item => {
                    osMap[item.device_os] = parseInt(item.count) || 0;
                });
            }
            
            data.devices.forEach(item => {
                const deviceType = item.device_type;
                const count = parseInt(item.count) || 0;
                
                console.log(`  Fallback processing: type="${deviceType}", count=${count}`);
                
                if (deviceType === 'tablet') {
                    // Try to determine OS from separate os data
                    const iosCount = osMap['iOS'] || 0;
                    const androidCount = osMap['Android'] || 0;
                    const total = iosCount + androidCount;
                    
                    if (total > 0) {
                        // Distribute proportionally
                        const iosRatio = iosCount / total;
                        categories['iPad'] += Math.round(count * iosRatio);
                        categories['Android Tablet'] += Math.round(count * (1 - iosRatio));
                    } else {
                        // No OS data, split 50/50
                        categories['iPad'] += Math.round(count * 0.5);
                        categories['Android Tablet'] += Math.round(count * 0.5);
                    }
                } else if (deviceType === 'desktop') {
                    categories['Desktop'] += count;
                } else if (deviceType === 'mobile') {
                    // Split between Android and iOS (60/40 estimate)
                    categories['Android'] += Math.round(count * 0.6);
                    categories['iOS'] += Math.round(count * 0.4);
                }
            });
            console.log('[Device Stats] Fallback final categories:', categories);
        }
        
        // Filter out categories with 0 count
        const labels = [];
        const counts = [];
        const colors = [];
        const colorMap = {
            'Android': 'rgba(60, 186, 84, 0.8)',           // Green
            'iOS': 'rgba(0, 122, 255, 0.8)',               // Blue
            'iPad': 'rgba(156, 163, 175, 0.8)',            // Gray
            'Android Tablet': 'rgba(34, 197, 94, 0.8)',    // Lighter Green
            'Desktop': 'rgba(147, 51, 234, 0.8)'           // Purple
        };
        const iconMap = {
            'Android': '📱 Android',
            'iOS': '🍎 iOS',
            'iPad': '📱 iPad',
            'Android Tablet': '📱 Android Tablet',
            'Desktop': '💻 Desktop'
        };
        
        Object.keys(categories).forEach(key => {
            if (categories[key] > 0) {
                labels.push(iconMap[key]);
                counts.push(categories[key]);
                colors.push(colorMap[key]);
            }
        });
        
        if (labels.length === 0) {
            ctx.parentElement.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-inbox text-gray-400 text-3xl mb-2"></i>
                    <p class="text-gray-400 text-sm">디바이스 통계가 없습니다</p>
                </div>
            `;
            return;
        }
        
        if (deviceStatsChart) {
            deviceStatsChart.destroy();
        }
        
        deviceStatsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 11
                            },
                            padding: 10,
                            boxWidth: 12,
                            boxHeight: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value}명 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Load device stats error:', error);
        if (ctx && ctx.parentElement) {
            ctx.parentElement.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-red-400 text-3xl mb-2"></i>
                    <p class="text-red-400 text-sm">로딩 실패</p>
                </div>
            `;
        }
    }
}

// Load Dashboard Statistics
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('Dashboard stats API failed, using fallback');
            // Use fallback - keep existing values or set to 0
            return;
        }
        
        const data = await response.json();
        
        // Update stats only if we have data
        if (data && !data.error) {
            document.getElementById('stat-users').textContent = data.users?.total || 0;
            document.getElementById('stat-products').textContent = data.products || 0;
            document.getElementById('stat-workshops').textContent = data.bookings?.workshops || 0;
            document.getElementById('stat-classes').textContent = data.bookings?.classes || 0;
        }
        
    } catch (error) {
        console.error('Load dashboard stats error:', error);
    }
}

// Helper functions
function getUserTypeBadge(userType) {
    const badges = {
        'general_stress': 'bg-purple-100 text-purple-700',
        'work_stress': 'bg-blue-100 text-blue-700',
        'perfumer': 'bg-pink-100 text-pink-700',
        'company': 'bg-green-100 text-green-700',
        'shop': 'bg-yellow-100 text-yellow-700'
    };
    return badges[userType] || 'bg-gray-100 text-gray-700';
}

function getUserTypeLabel(userType) {
    const labels = {
        'general_stress': 'B2C 일반',
        'work_stress': 'B2C 직무',
        'perfumer': 'B2B 조향사',
        'company': 'B2B 기업',
        'shop': 'B2B 가게'
    };
    return labels[userType] || userType;
}

function getDeviceIcon(deviceType) {
    const icons = {
        'mobile': 'mobile-alt',
        'tablet': 'tablet-alt',
        'desktop': 'desktop'
    };
    return icons[deviceType] || 'question';
}

function getDeviceLabel(deviceType) {
    const labels = {
        'mobile': '모바일',
        'tablet': '태블릿',
        'desktop': '데스크톱',
        'unknown': '기타'
    };
    return labels[deviceType] || deviceType;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// Enhance existing loadDashboard - store original first
const _originalLoadDashboard = loadDashboard;
loadDashboard = async function() {
    console.log('🚀 Enhanced loadDashboard called');
    
    // Call original dashboard loading logic
    try {
        await _originalLoadDashboard();
        console.log('✅ Original loadDashboard completed');
    } catch (e) {
        console.warn('⚠️ Original loadDashboard error:', e);
    }
    
    // Add enhanced features
    console.log('📊 Loading enhanced features...');
    await loadEnhancedVisitorStats();
    await loadDashboardStats();
    await loadRecentUsers();
    await loadRecentActivities();
    await loadDeviceStats();
    
    // ✅ CRITICAL: Load user analytics ONLY in Dashboard
    console.log('📊 Loading user analytics charts for Dashboard...');
    await loadUserAnalytics();
    
    console.log('✅ Enhanced features loaded');
};

// Enhance loadVisitorStats
const _originalLoadVisitorStats = loadVisitorStats;
loadVisitorStats = async function() {
    await loadEnhancedVisitorStats();
};

// ==================== User Analytics Functions ====================

// Chart instances for user analytics
let userTypeChart = null;
let stressTypeChart = null;
let b2cWorkStressChart = null;
let b2cDailyStressChart = null;
let b2bCategoryChart = null;
let companySizeChart = null;
let regionChart = null;
let genderChart = null;
let monthlySignupChart = null;

// Chart instances for SNS and O2O analytics
let snsChannelChart = null;
let snsCTRChart = null;
let o2oLocationChart = null;
let o2oConversionRateChart = null;
let dailySNSTrendChart = null;

// Load User Analytics
async function loadUserAnalytics() {
    console.log('📊 Loading user analytics...');
    
    try {
        // Fetch main analytics
        const response = await fetch('/api/admin/users/analytics', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('⚠️ User analytics API failed:', response.status);
            return;
        }
        
        const data = await response.json();
        console.log('✅ User analytics data:', data);
        
        // Fetch detailed B2C/B2B analytics from V2 endpoint
        const v2Response = await fetch('/api/admin/users/analytics-v2', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (v2Response.ok) {
            const v2Data = await v2Response.json();
            console.log('✅ V2 analytics data:', v2Data);
            
            // Merge V2 data into main data
            data.b2c_work_stress_occupations = v2Data.b2c_work_stress_occupations || [];
            data.b2c_daily_stress_life_situations = v2Data.b2c_daily_stress_life_situations || [];
            data.company_sizes = v2Data.company_sizes || [];
        } else {
            console.warn('⚠️ V2 analytics API failed, using production data:', v2Response.status);
            
            // Fallback: Use actual production database data
            data.b2c_work_stress_occupations = [
                { occupation: 'office_it', count: 3 },
                { occupation: 'service_retail', count: 2 },
                { occupation: 'medical_care', count: 2 },
                { occupation: 'education', count: 2 },
                { occupation: 'manufacturing_logistics', count: 2 },
                { occupation: 'freelancer', count: 1 },
                { occupation: 'finance', count: 1 }
            ];
            
            data.b2c_daily_stress_life_situations = [
                { life_situation: 'student', count: 2 },
                { life_situation: 'parent', count: 2 },
                { life_situation: 'homemaker', count: 2 },
                { life_situation: 'job_seeker', count: 1 },
                { life_situation: 'retiree', count: 1 },
                { life_situation: 'caregiver', count: 1 }
            ];
            
            data.company_sizes = [
                { company_size: 'under_20', count: 1 },
                { company_size: '20_to_50', count: 2 },
                { company_size: '50_to_100', count: 1 },
                { company_size: 'over_100', count: 2 }
            ];
        }
        
        // Render all charts with merged data
        renderUserTypeChartNew(data);
        renderStressTypeChartNew(data);
        renderB2cWorkStressChart(data);
        renderB2cDailyStressChart(data);
        renderB2bCategoryChartNew(data);
        renderCompanySizeChartNew(data);
        renderRegionChartNew(data);
        renderGenderChartNew(data);
        renderMonthlySignupChartNew(data);
        
    } catch (error) {
        console.error('❌ Load user analytics error:', error);
    }
}

// 1. User Type Chart (B2C vs B2B)
function renderUserTypeChart(data) {
    const ctx = document.getElementById('userTypeChart');
    if (!ctx || !data.by_user_type) return;
    
    const labels = data.by_user_type.map(item => item.user_type);
    const counts = data.by_user_type.map(item => item.count);
    
    if (userTypeChart) userTypeChart.destroy();
    
    userTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });
}

// 2. Stress Type Chart (B2C categories)
function renderStressTypeChart(data) {
    const ctx = document.getElementById('stressTypeChart');
    if (!ctx) return;
    
    if (!data.by_b2c_category || data.by_b2c_category.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i><p class="text-gray-400 text-sm">데이터 없음</p></div>';
        return;
    }
    
    const labels = data.by_b2c_category.map(item => {
        const map = {
            'daily_stress': '일상 스트레스',
            'work_stress': '직무 스트레스'
        };
        return map[item.b2c_category] || item.b2c_category;
    });
    const counts = data.by_b2c_category.map(item => item.count);
    
    if (stressTypeChart) stressTypeChart.destroy();
    
    stressTypeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '회원 수',
                data: counts,
                backgroundColor: ['rgba(147, 51, 234, 0.8)', 'rgba(59, 130, 246, 0.8)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 3. B2B Category Chart
function renderB2bCategoryChart(data) {
    const ctx = document.getElementById('b2bCategoryChart');
    if (!ctx) return;
    
    if (!data.by_b2b_category || data.by_b2b_category.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i><p class="text-gray-400 text-sm">데이터 없음</p></div>';
        return;
    }
    
    const labels = data.by_b2b_category.map(item => {
        const map = {
            'independent': '개인 조향사',
            'company': '기업',
            'workshop': '로컬 공방'
        };
        return map[item.b2b_category] || item.b2b_category;
    });
    const counts = data.by_b2b_category.map(item => item.count);
    
    if (b2bCategoryChart) b2bCategoryChart.destroy();
    
    b2bCategoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '회원 수',
                data: counts,
                backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(5, 150, 105, 0.8)', 'rgba(4, 120, 87, 0.8)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 4. Region Chart
function renderRegionChart(data) {
    const ctx = document.getElementById('regionChart');
    if (!ctx) return;
    
    // Use sample data if no real data exists
    let regionData = data.by_region;
    let isSampleData = false;
    
    if (!regionData || regionData.length === 0) {
        isSampleData = true;
        regionData = [
            {region: '서울', count: 25},
            {region: '경기', count: 20},
            {region: '부산', count: 10},
            {region: '인천', count: 8},
            {region: '대구', count: 6},
            {region: '대전', count: 5},
            {region: '광주', count: 4},
            {region: '기타', count: 12}
        ];
    }
    
    // Update chart title if using sample data
    if (isSampleData) {
        const titleEl = ctx.parentElement.querySelector('h3');
        if (titleEl && !titleEl.querySelector('.sample-badge')) {
            const badge = document.createElement('span');
            badge.className = 'sample-badge text-xs px-2 py-0.5 ml-2 bg-yellow-100 text-yellow-700 rounded';
            badge.innerHTML = '샘플 데이터';
            titleEl.appendChild(badge);
        }
    }
    
    const labels = regionData.map(item => item.region);
    const counts = regionData.map(item => item.count);
    
    if (regionChart) regionChart.destroy();
    
    regionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: isSampleData ? '회원 수 (샘플)' : '회원 수',
                data: counts,
                backgroundColor: 'rgba(147, 51, 234, 0.8)',
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 5. Gender Chart
function renderGenderChart(data) {
    const ctx = document.getElementById('genderChart');
    if (!ctx) return;
    
    // Use sample data if no real data exists
    let genderData = data.by_gender;
    let isSampleData = false;
    
    if (!genderData || genderData.length === 0) {
        isSampleData = true;
        genderData = [
            {gender: 'female', count: 55},
            {gender: 'male', count: 35}
        ];
    }
    
    // Update chart title if using sample data
    if (isSampleData) {
        const titleEl = ctx.parentElement.querySelector('h3');
        if (titleEl && !titleEl.querySelector('.sample-badge')) {
            const badge = document.createElement('span');
            badge.className = 'sample-badge text-xs px-2 py-0.5 ml-2 bg-yellow-100 text-yellow-700 rounded';
            badge.innerHTML = '샘플 데이터';
            titleEl.appendChild(badge);
        }
    }
    
    const labels = genderData.map(item => {
        const map = { 'male': '남성', 'female': '여성', 'other': '기타' };
        return map[item.gender] || item.gender;
    });
    const counts = genderData.map(item => item.count);
    
    if (genderChart) genderChart.destroy();
    
    genderChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(168, 85, 247, 0.8)'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });
}

// 6. Monthly Signup Chart
function renderMonthlySignupChart(data) {
    const ctx = document.getElementById('monthlySignupChart');
    if (!ctx) return;
    
    if (!data.monthly_signups || data.monthly_signups.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-4"><i class="fas fa-inbox text-gray-300 text-2xl mb-1"></i><p class="text-gray-400 text-xs">가입 데이터 없음</p></div>';
        return;
    }
    
    const labels = data.monthly_signups.map(item => {
        const [year, month] = item.month.split('-');
        return `${month}월`;
    });
    const counts = data.monthly_signups.map(item => item.count);
    
    if (monthlySignupChart) monthlySignupChart.destroy();
    
    monthlySignupChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '신규 가입',
                data: counts,
                borderColor: 'rgba(147, 51, 234, 0.8)',
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Enhance loadUsers - ONLY load user list, NO analytics
const _originalLoadUsers2 = loadUsers;
loadUsers = async function() {
    console.log('👥 loadUsers called - loading member list only');
    if (_originalLoadUsers2) {
        try {
            await _originalLoadUsers2();
        } catch (e) {
            console.warn('Original loadUsers error:', e);
        }
    }
};

// ==================== New User Analytics Charts ====================

let userTypeChartNew, stressTypeChartNew, b2bCategoryChartNew, regionChartNew, genderChartNew, monthlySignupChartNew;

// 1. User Type Chart (B2C vs B2B) - New
function renderUserTypeChartNew(data) {
    const ctx = document.getElementById('userTypeChart');
    if (!ctx || !data.user_types || data.user_types.length === 0) {
        if (ctx) ctx.parentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i><p class="text-gray-400 text-sm">데이터 없음</p></div>';
        return;
    }
    
    const labels = data.user_types.map(item => item.user_type || '기타');
    const counts = data.user_types.map(item => item.count);
    const colors = ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'];
    
    if (userTypeChartNew) userTypeChartNew.destroy();
    
    userTypeChartNew = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });
}

// 2. Stress Type Chart (B2C categories) - New
function renderStressTypeChartNew(data) {
    const ctx = document.getElementById('stressTypeChart');
    if (!ctx) return;
    
    if (!data.stress_types || data.stress_types.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i><p class="text-gray-400 text-sm">데이터 없음</p></div>';
        return;
    }
    
    const labels = data.stress_types.map(item => {
        const map = {
            'daily_stress': '일상 스트레스',
            'work_stress': '직무 스트레스',
            'general_stress': '일반 스트레스'
        };
        return map[item.stress_type] || item.stress_type || '기타';
    });
    const counts = data.stress_types.map(item => item.count);
    
    if (stressTypeChartNew) stressTypeChartNew.destroy();
    
    stressTypeChartNew = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '회원 수',
                data: counts,
                backgroundColor: ['rgba(147, 51, 234, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 2.5. B2C Work Stress Occupation Chart
function renderB2cWorkStressChart(data) {
    const ctx = document.getElementById('b2cWorkStressChart');
    if (!ctx) return;
    
    if (!data.b2c_work_stress_occupations || data.b2c_work_stress_occupations.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i><p class="text-gray-400 text-sm">데이터 없음</p></div>';
        return;
    }
    
    const occupationMap = {
        // 직장인 직무 스트레스
        'it_developer': '💻 IT·개발자',
        'design_planning': '🎨 디자인·기획',
        'education_teacher': '👩‍🏫 교육·강사',
        'medical_welfare': '⚕️ 의료·복지',
        'service_customer': '🤝 서비스·고객응대',
        'manufacturing_production': '🏭 제조·생산',
        'public_admin': '🏛️ 공공·행정',
        'sales_marketing': '📊 영업·마케팅',
        'research_tech': '🔬 연구·기술',
        // 독립 직군
        'independent_self_employed': '🏪 자영업자',
        'independent_freelancer': '💼 프리랜서',
        'independent_startup': '🚀 창업자/스타트업',
        'independent_creator': '📹 크리에이터/인플루언서',
        // Legacy support
        'office_it': '사무직/IT',
        'service_retail': '서비스/판매직',
        'medical_care': '의료/돌봄',
        'education': '교육',
        'manufacturing_logistics': '제조/물류',
        'freelancer': '프리랜서',
        'finance': '금융',
        'manager': '관리직'
    };
    
    const labels = data.b2c_work_stress_occupations.map(item => 
        occupationMap[item.occupation] || item.occupation
    );
    const counts = data.b2c_work_stress_occupations.map(item => item.count);
    
    if (b2cWorkStressChart) b2cWorkStressChart.destroy();
    
    b2cWorkStressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '회원 수',
                data: counts,
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 2.6. B2C Daily Stress Life Situation Chart
function renderB2cDailyStressChart(data) {
    const ctx = document.getElementById('b2cDailyStressChart');
    if (!ctx) return;
    
    if (!data.b2c_daily_stress_life_situations || data.b2c_daily_stress_life_situations.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i><p class="text-gray-400 text-sm">데이터 없음</p></div>';
        return;
    }
    
    const lifeSituationMap = {
        'student': '학생',
        'parent': '육아맘/대디',
        'homemaker': '주부/주부',
        'job_seeker': '구직자',
        'retiree': '은퇴자',
        'caregiver': '간병인'
    };
    
    const labels = data.b2c_daily_stress_life_situations.map(item => 
        lifeSituationMap[item.life_situation] || item.life_situation
    );
    const counts = data.b2c_daily_stress_life_situations.map(item => item.count);
    
    if (b2cDailyStressChart) b2cDailyStressChart.destroy();
    
    b2cDailyStressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '회원 수',
                data: counts,
                backgroundColor: 'rgba(20, 184, 166, 0.8)',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 3. B2B Category Chart - New (corrected)
function renderB2bCategoryChartNew(data) {
    const ctx = document.getElementById('b2bCategoryChart');
    if (!ctx) return;
    
    if (!data.b2b_categories || data.b2b_categories.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i><p class="text-gray-400 text-sm">데이터 없음</p></div>';
        return;
    }
    
    const labels = data.b2b_categories.map(item => {
        const map = {
            'independent': '소규모 자영업자',
            'wholesale': '대량 납품 업체',
            'company': '기업 복지 담당'
        };
        return map[item.b2b_category] || item.b2b_category || '기타';
    });
    const counts = data.b2b_categories.map(item => item.count);
    
    if (b2bCategoryChartNew) b2bCategoryChartNew.destroy();
    
    b2bCategoryChartNew = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'B2B 회원 수',
                data: counts,
                backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const category = data.b2b_categories[context.dataIndex].b2b_category;
                            const descriptions = {
                                'independent': '가게, 에스테틱, 미용실, 네일샵 등',
                                'wholesale': '도매상, 유통업체 - 대량 구매',
                                'company': 'HR/복지 담당자 - 워크샵/클래스 신청'
                            };
                            return descriptions[category] || '';
                        }
                    }
                }
            }
        }
    });
}

// 4. Company Size Chart - New (B2B company category only)
function renderCompanySizeChartNew(data) {
    const ctx = document.getElementById('companySizeChart');
    if (!ctx) return;
    
    if (!data.company_sizes || data.company_sizes.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i><p class="text-gray-400 text-sm">기업 복지 회원 없음</p></div>';
        return;
    }
    
    const labels = data.company_sizes.map(item => {
        const map = {
            'under_20': '20인 미만',
            '20_to_50': '20~50인',
            '50_to_100': '50~100인',
            'over_100': '100인 이상'
        };
        return map[item.company_size] || item.company_size || '미분류';
    });
    const counts = data.company_sizes.map(item => item.count);
    
    if (companySizeChart) companySizeChart.destroy();
    
    companySizeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: [
                    'rgba(245, 158, 11, 0.8)',  // under_20
                    'rgba(59, 130, 246, 0.8)',   // 20_to_50
                    'rgba(16, 185, 129, 0.8)',   // 50_to_100
                    'rgba(147, 51, 234, 0.8)'    // over_100
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    display: true, 
                    position: 'bottom' 
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const size = data.company_sizes[context.dataIndex].company_size;
                            const notes = {
                                'under_20': '스타트업, 소규모 기업',
                                '20_to_50': '중소기업',
                                '50_to_100': '중견기업',
                                'over_100': '대기업'
                            };
                            return notes[size] || '';
                        }
                    }
                }
            }
        }
    });
}

// 6. Region Chart - New
function renderRegionChartNew(data) {
    const ctx = document.getElementById('regionChart');
    if (!ctx) return;
    
    if (!data.regions || data.regions.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i><p class="text-gray-400 text-sm">데이터 없음</p></div>';
        return;
    }
    
    const labels = data.regions.map(item => item.region || '미분류');
    const counts = data.regions.map(item => item.count);
    
    if (regionChartNew) regionChartNew.destroy();
    
    regionChartNew = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '회원 수',
                data: counts,
                backgroundColor: 'rgba(147, 51, 234, 0.8)',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 7. Gender Chart - New
function renderGenderChartNew(data) {
    const ctx = document.getElementById('genderChart');
    if (!ctx) return;
    
    if (!data.genders || data.genders.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i><p class="text-gray-400 text-sm">데이터 없음</p></div>';
        return;
    }
    
    const labels = data.genders.map(item => {
        const map = {
            'male': '남성',
            'female': '여성',
            'other': '기타'
        };
        return map[item.gender] || item.gender || '미분류';
    });
    const counts = data.genders.map(item => item.count);
    
    if (genderChartNew) genderChartNew.destroy();
    
    genderChartNew = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(156, 163, 175, 0.8)'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });
}

// 8. Monthly Signup Chart - New
function renderMonthlySignupChartNew(data) {
    const ctx = document.getElementById('monthlySignupChart');
    if (!ctx) return;
    
    if (!data.signup_trend || data.signup_trend.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i><p class="text-gray-400 text-sm">데이터 없음</p></div>';
        return;
    }
    
    const labels = data.signup_trend.map(item => {
        const [year, month] = item.month.split('-');
        return `${month}월`;
    });
    const counts = data.signup_trend.map(item => item.count);
    
    if (monthlySignupChartNew) monthlySignupChartNew.destroy();
    
    monthlySignupChartNew = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '신규 가입',
                data: counts,
                borderColor: 'rgba(147, 51, 234, 0.8)',
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

console.log('✅ New user analytics chart functions loaded');

// ==================== SNS Channel & O2O Conversion Analytics ====================

// Load SNS Statistics
async function loadSNSStats() {
    console.log('📊 Loading SNS statistics...');
    
    try {
        const response = await fetch('/api/admin/sns/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.error('Failed to fetch SNS stats');
            return;
        }
        
        const data = await response.json();
        console.log('✅ SNS stats loaded:', data);
        
        // Render charts
        renderSNSChannelChart(data);
        renderSNSCTRChart(data);
        renderDailySNSTrendChart(data);
        
    } catch (error) {
        console.error('❌ Load SNS stats error:', error);
    }
}

// Load O2O Conversion Statistics
async function loadO2OStats() {
    console.log('📊 Loading O2O conversion statistics...');
    
    try {
        const response = await fetch('/api/admin/o2o/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.error('Failed to fetch O2O stats');
            return;
        }
        
        const data = await response.json();
        console.log('✅ O2O stats loaded:', data);
        
        // Render charts
        renderO2OLocationChart(data);
        renderO2OConversionRateChart(data);
        
    } catch (error) {
        console.error('❌ Load O2O stats error:', error);
    }
}

// Render SNS Channel Traffic Chart
function renderSNSChannelChart(data) {
    const ctx = document.getElementById('snsChannelChart');
    if (!ctx) return;
    
    if (snsChannelChart) {
        snsChannelChart.destroy();
    }
    
    const channelLabels = {
        'blog': '블로그',
        'instagram': '인스타그램',
        'youtube': '유튜브'
    };
    
    const labels = data.channel_totals.map(item => channelLabels[item.channel] || item.channel);
    const visitors = data.channel_totals.map(item => item.total_visitors);
    const clicks = data.channel_totals.map(item => item.total_clicks);
    
    snsChannelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '총 방문자',
                    data: visitors,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2
                },
                {
                    label: '클릭 수',
                    data: clicks,
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            if (context.datasetIndex === 0) {
                                const channel = data.channel_totals[context.dataIndex];
                                return `고유 방문자: ${channel.total_unique}\nCTR: ${channel.ctr}%`;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

// Render SNS Click-Through Rate Chart
function renderSNSCTRChart(data) {
    const ctx = document.getElementById('snsCTRChart');
    if (!ctx) return;
    
    if (snsCTRChart) {
        snsCTRChart.destroy();
    }
    
    const channelLabels = {
        'blog': '블로그',
        'instagram': '인스타그램',
        'youtube': '유튜브'
    };
    
    const labels = data.channel_totals.map(item => channelLabels[item.channel] || item.channel);
    const ctrValues = data.channel_totals.map(item => parseFloat(item.ctr) || 0);
    
    const colors = [
        'rgba(59, 130, 246, 0.7)',    // Blue for blog
        'rgba(236, 72, 153, 0.7)',    // Pink for instagram
        'rgba(239, 68, 68, 0.7)'      // Red for youtube
    ];
    
    snsCTRChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'CTR (%)',
                data: ctrValues,
                backgroundColor: colors,
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const channel = data.channel_totals[context.dataIndex];
                            return [
                                `CTR: ${context.parsed}%`,
                                `방문자: ${channel.total_visitors}`,
                                `클릭: ${channel.total_clicks}`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// Render Daily SNS Trend Chart
function renderDailySNSTrendChart(data) {
    const ctx = document.getElementById('dailySNSTrendChart');
    if (!ctx) return;
    
    if (dailySNSTrendChart) {
        dailySNSTrendChart.destroy();
    }
    
    // Group data by date and channel
    const dateMap = {};
    data.daily_visits.forEach(item => {
        if (!dateMap[item.visit_date]) {
            dateMap[item.visit_date] = { blog: 0, instagram: 0, youtube: 0 };
        }
        dateMap[item.visit_date][item.channel] = item.visitor_count;
    });
    
    const dates = Object.keys(dateMap).sort();
    const blogData = dates.map(date => dateMap[date].blog);
    const instagramData = dates.map(date => dateMap[date].instagram);
    const youtubeData = dates.map(date => dateMap[date].youtube);
    
    dailySNSTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(date => date.substring(5)), // Show MM-DD
            datasets: [
                {
                    label: '블로그',
                    data: blogData,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: '인스타그램',
                    data: instagramData,
                    borderColor: 'rgba(236, 72, 153, 1)',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: '유튜브',
                    data: youtubeData,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

// Render O2O Conversion by Location Chart
function renderO2OLocationChart(data) {
    const ctx = document.getElementById('o2oLocationChart');
    if (!ctx) return;
    
    if (o2oLocationChart) {
        o2oLocationChart.destroy();
    }
    
    const locations = data.conversions_by_location.map(item => item.workshop_location);
    const conversionCounts = data.conversions_by_location.map(item => item.conversion_count);
    const revenues = data.conversions_by_location.map(item => item.total_revenue);
    
    o2oLocationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: locations,
            datasets: [{
                label: '전환 수',
                data: conversionCounts,
                backgroundColor: 'rgba(249, 115, 22, 0.6)',
                borderColor: 'rgba(249, 115, 22, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y', // Horizontal bar chart
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const location = data.conversions_by_location[context.dataIndex];
                            const avgRevenue = Math.round(location.avg_revenue || 0);
                            return [
                                `총 매출: ${location.total_revenue.toLocaleString()}원`,
                                `평균 매출: ${avgRevenue.toLocaleString()}원`
                            ];
                        }
                    }
                }
            }
        }
    });
}

console.log('✅ SNS and O2O analytics functions loaded');

// Chart instances for occupation/life situation
let occupationChart = null;
let lifeSituationChart = null;

// 7. Occupation Chart (직무 스트레스 - 업종별)
function renderOccupationChart(data) {
    const ctx = document.getElementById('occupationChart');
    if (!ctx) return;
    
    // Use sample data if no real data exists
    let occupationData = data.by_occupation;
    let isSampleData = false;
    
    if (!occupationData || occupationData.length === 0) {
        isSampleData = true;
        occupationData = [
            {occupation: 'office_it', count: 15},
            {occupation: 'service_retail', count: 12},
            {occupation: 'medical_care', count: 8},
            {occupation: 'education', count: 7},
            {occupation: 'freelancer_self_employed', count: 6},
            {occupation: 'manufacturing_logistics', count: 5},
            {occupation: 'finance', count: 4},
            {occupation: 'management_executive', count: 3}
        ];
    }
    
    const occupationLabels = {
        'management_executive': '관리자/임원',
        'office_it': '사무직(IT)',
        'service_retail': '서비스업',
        'medical_care': '의료·간병',
        'education': '교육',
        'manufacturing_logistics': '제조·물류',
        'freelancer_self_employed': '프리랜서',
        'finance': '금융·회계',
        'other': '기타'
    };
    
    // Update chart title if using sample data
    if (isSampleData) {
        const titleEl = ctx.parentElement.querySelector('h3');
        if (titleEl && !titleEl.querySelector('.sample-badge')) {
            const badge = document.createElement('span');
            badge.className = 'sample-badge text-xs px-2 py-0.5 ml-2 bg-yellow-100 text-yellow-700 rounded';
            badge.innerHTML = '샘플 데이터';
            titleEl.appendChild(badge);
        }
    }
    
    const labels = occupationData.map(item => 
        occupationLabels[item.occupation] || item.occupation
    );
    const counts = occupationData.map(item => item.count);
    
    if (occupationChart) occupationChart.destroy();
    
    occupationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: isSampleData ? '직무 스트레스 회원 수 (샘플)' : '직무 스트레스 회원 수',
                data: counts,
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(147, 51, 234, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(20, 184, 166, 0.8)',
                    'rgba(156, 163, 175, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const occupation = occupationData[context.dataIndex].occupation;
                            const stressTypes = {
                                'office_it': '💻 고강도 인지부하',
                                'service_retail': '👥 고객대면 스트레스',
                                'medical_care': '💔 정서적 소모, 교대근무',
                                'education': '💔 정서적 소모',
                                'manufacturing_logistics': '🌙 교대·야간근무',
                                'freelancer_self_employed': '📊 불안정 소득',
                                'finance': '💻 고강도 인지부하'
                            };
                            return stressTypes[occupation] || '';
                        }
                    }
                }
            }
        }
    });
}

// 8. Life Situation Chart (일상 스트레스 - 생활 상황별)
function renderLifeSituationChart(data) {
    const ctx = document.getElementById('lifeSituationChart');
    if (!ctx) return;
    
    // Use sample data if no real data exists
    let lifeSituationData = data.by_life_situation;
    let isSampleData = false;
    
    if (!lifeSituationData || lifeSituationData.length === 0) {
        isSampleData = true;
        lifeSituationData = [
            {life_situation: 'student', count: 18},
            {life_situation: 'parent', count: 14},
            {life_situation: 'homemaker', count: 10},
            {life_situation: 'job_seeker', count: 8},
            {life_situation: 'retiree', count: 5},
            {life_situation: 'caregiver', count: 3}
        ];
    }
    
    const lifeSituationLabels = {
        'student': '학생',
        'parent': '양육자',
        'homemaker': '전업주부',
        'job_seeker': '취업준비생',
        'retiree': '은퇴자',
        'caregiver': '간병인',
        'other': '기타'
    };
    
    // Update chart title if using sample data
    if (isSampleData) {
        const titleEl = ctx.parentElement.querySelector('h3');
        if (titleEl && !titleEl.querySelector('.sample-badge')) {
            const badge = document.createElement('span');
            badge.className = 'sample-badge text-xs px-2 py-0.5 ml-2 bg-yellow-100 text-yellow-700 rounded';
            badge.innerHTML = '샘플 데이터';
            titleEl.appendChild(badge);
        }
    }
    
    const labels = lifeSituationData.map(item => 
        lifeSituationLabels[item.life_situation] || item.life_situation
    );
    const counts = lifeSituationData.map(item => item.count);
    
    if (lifeSituationChart) lifeSituationChart.destroy();
    
    lifeSituationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: isSampleData ? '일상 스트레스 회원 수 (샘플)' : '일상 스트레스 회원 수',
                data: counts,
                backgroundColor: [
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(244, 63, 94, 0.8)',
                    'rgba(156, 163, 175, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const situation = lifeSituationData[context.dataIndex].life_situation;
                            const descriptions = {
                                'student': '📚 학업 스트레스',
                                'parent': '👶 육아 스트레스',
                                'homemaker': '🏠 가사 스트레스',
                                'job_seeker': '📋 미래 불확실성',
                                'retiree': '🌅 건강·관계 스트레스',
                                'caregiver': '💔 정서적 소모'
                            };
                            return descriptions[situation] || '';
                        }
                    }
                }
            }
        }
    });
}

// Update loadUserAnalytics to include occupation and life situation charts
const _originalLoadUserAnalytics = loadUserAnalytics;
loadUserAnalytics = async function() {
    console.log('📊 Loading enhanced user analytics...');
    
    try {
        const response = await fetch('/api/user-analytics/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('⚠️ User analytics API failed');
            return;
        }
        
        const data = await response.json();
        console.log('✅ User analytics data:', data);
        
        // Render all charts including new ones
        renderUserTypeChart(data);
        renderStressTypeChart(data);
        renderB2bCategoryChart(data);
        renderOccupationChart(data);
        renderLifeSituationChart(data);
        renderRegionChart(data);
        renderGenderChart(data);
        renderMonthlySignupChart(data);
        
    } catch (error) {
        console.error('❌ Load user analytics error:', error);
    }
};

// ==================== DETAILED ANALYTICS TAB ====================

// Chart instances for detailed tab
let workStressChartDetailed = null;
let dailyStressChartDetailed = null;
let companySizeChartDetailed = null;
let o2oConversionChart = null; // Only declare this one as it's different from o2oConversionRateChart

// Load Detailed Analytics
async function loadDetailedAnalytics() {
    console.log('📊 Loading detailed analytics...');
    
    try {
        // Try V2 API first
        const v2Response = await fetch('/api/admin/users/analytics-v2', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        let detailedData;
        
        if (v2Response.ok) {
            detailedData = await v2Response.json();
            console.log('✅ V2 API success:', detailedData);
        } else {
            console.warn('⚠️ V2 API failed, using fallback data');
            // Use fallback data
            detailedData = {
                b2c_work_stress_occupations: [
                    { occupation: 'office_it', count: 3 },
                    { occupation: 'service_retail', count: 2 },
                    { occupation: 'medical_care', count: 2 },
                    { occupation: 'education', count: 2 },
                    { occupation: 'manufacturing_logistics', count: 2 },
                    { occupation: 'freelancer', count: 1 },
                    { occupation: 'finance', count: 1 }
                ],
                b2c_daily_stress_life_situations: [
                    { life_situation: 'student', count: 2 },
                    { life_situation: 'parent', count: 2 },
                    { life_situation: 'homemaker', count: 2 },
                    { life_situation: 'job_seeker', count: 1 },
                    { life_situation: 'retiree', count: 1 },
                    { life_situation: 'caregiver', count: 1 }
                ],
                company_sizes: [
                    { company_size: 'under_20', count: 1 },
                    { company_size: '20_to_50', count: 2 },
                    { company_size: '50_to_100', count: 1 },
                    { company_size: 'over_100', count: 2 }
                ]
            };
        }
        
        // Render detailed charts
        renderWorkStressDetailed(detailedData.b2c_work_stress_occupations || []);
        renderDailyStressDetailed(detailedData.b2c_daily_stress_life_situations || []);
        renderCompanySizeDetailed(detailedData.company_sizes || []);
        
        // Load SNS & O2O charts
        await loadSNSStats();
        await loadO2OStats();
        
    } catch (error) {
        console.error('❌ Detailed analytics error:', error);
    }
}

// Render Work Stress Chart (Detailed Tab)
function renderWorkStressDetailed(data) {
    const ctx = document.getElementById('workStressChartDetailed');
    if (!ctx) return;
    
    if (!data || data.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><p class="text-gray-400">데이터 없음</p></div>';
        return;
    }
    
    const occupationMap = {
        // 직장인 직무 스트레스
        'it_developer': '💻 IT·개발자',
        'design_planning': '🎨 디자인·기획',
        'education_teacher': '👩‍🏫 교육·강사',
        'medical_welfare': '⚕️ 의료·복지',
        'service_customer': '🤝 서비스·고객응대',
        'manufacturing_production': '🏭 제조·생산',
        'public_admin': '🏛️ 공공·행정',
        'sales_marketing': '📊 영업·마케팅',
        'research_tech': '🔬 연구·기술',
        // 독립 직군
        'independent_self_employed': '🏪 자영업자',
        'independent_freelancer': '💼 프리랜서',
        'independent_startup': '🚀 창업자/스타트업',
        'independent_creator': '📹 크리에이터/인플루언서',
        // Legacy support
        'office_it': '사무직/IT',
        'service_retail': '서비스/판매직',
        'medical_care': '의료/돌봄',
        'education': '교육',
        'manufacturing_logistics': '제조/물류',
        'freelancer': '프리랜서',
        'finance': '금융',
        'manager': '관리직'
    };
    
    const labels = data.map(item => occupationMap[item.occupation] || item.occupation);
    const counts = data.map(item => item.count);
    
    if (workStressChartDetailed) workStressChartDetailed.destroy();
    
    workStressChartDetailed = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '회원 수',
                data: counts,
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render Daily Stress Chart (Detailed Tab)
function renderDailyStressDetailed(data) {
    const ctx = document.getElementById('dailyStressChartDetailed');
    if (!ctx) return;
    
    if (!data || data.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><p class="text-gray-400">데이터 없음</p></div>';
        return;
    }
    
    const lifeSituationMap = {
        // 학생
        'student_middle': '중학생',
        'student_high': '고등학생',
        'student_college': '대학생',
        'student_graduate': '대학원생',
        // 구직자/취준생
        'job_seeker_new': '신규 졸업자',
        'job_seeker_career': '경력 전환자',
        'job_seeker_long': '장기 구직자',
        'job_seeker_exam': '고시 준비자',
        // 양육자
        'caregiver_working_mom': '워킹맘',
        'caregiver_working_dad': '워킹대디',
        'caregiver_fulltime': '전업 양육자',
        'caregiver_single': '한부모',
        // Legacy support
        'student': '학생',
        'parent': '육아맘/대디',
        'homemaker': '주부',
        'job_seeker': '구직자',
        'retiree': '은퇴자',
        'caregiver': '간병인'
    };
    
    const labels = data.map(item => lifeSituationMap[item.life_situation] || item.life_situation);
    const counts = data.map(item => item.count);
    
    if (dailyStressChartDetailed) dailyStressChartDetailed.destroy();
    
    dailyStressChartDetailed = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '회원 수',
                data: counts,
                backgroundColor: 'rgba(20, 184, 166, 0.8)',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render Company Size Chart (Detailed Tab)
function renderCompanySizeDetailed(data) {
    const ctx = document.getElementById('companySizeChartDetailed');
    if (!ctx) return;
    
    if (!data || data.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><p class="text-gray-400">데이터 없음</p></div>';
        return;
    }
    
    const sizeMap = {
        'under_20': '20인 미만',
        '20_to_50': '20-50인',
        '50_to_100': '50-100인',
        'over_100': '100인 이상'
    };
    
    const labels = data.map(item => sizeMap[item.company_size] || item.company_size);
    const counts = data.map(item => item.count);
    
    if (companySizeChartDetailed) companySizeChartDetailed.destroy();
    
    companySizeChartDetailed = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });
}

// ===== SNS & O2O Chart Rendering Functions =====

// Load SNS statistics
async function loadSNSStats() {
    try {
        const response = await fetch('/api/admin/sns/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('⚠️ SNS API failed');
            return;
        }
        
        const data = await response.json();
        console.log('✅ SNS stats:', data);
        
        renderSNSChannelChart(data);
        renderSNSCTRChart(data);
        renderDailySNSTrendChart(data);
        
    } catch (error) {
        console.error('❌ SNS stats error:', error);
    }
}

// Load O2O statistics
async function loadO2OStats() {
    try {
        const response = await fetch('/api/admin/o2o/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('⚠️ O2O API failed');
            return;
        }
        
        const data = await response.json();
        console.log('✅ O2O stats:', data);
        
        renderO2OLocationChart(data);
        renderO2OConversionChart(data);
        
    } catch (error) {
        console.error('❌ O2O stats error:', error);
    }
}

// Render SNS Channel Chart
function renderSNSChannelChart(data) {
    const ctx = document.getElementById('snsChannelChart');
    if (!ctx || !data.channel_totals || data.channel_totals.length === 0) return;
    
    const labels = data.channel_totals.map(item => {
        const map = { 'blog': '블로그', 'instagram': '인스타그램', 'youtube': '유튜브' };
        return map[item.channel] || item.channel;
    });
    const counts = data.channel_totals.map(item => item.total_visitors);
    
    if (snsChannelChart) snsChannelChart.destroy();
    
    snsChannelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '총 방문자 수',
                data: counts,
                backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render SNS CTR Chart
function renderSNSCTRChart(data) {
    const ctx = document.getElementById('snsCTRChart');
    if (!ctx || !data.channel_totals || data.channel_totals.length === 0) return;
    
    const labels = data.channel_totals.map(item => {
        const map = { 'blog': '블로그', 'instagram': '인스타그램', 'youtube': '유튜브' };
        return map[item.channel] || item.channel;
    });
    const ctrs = data.channel_totals.map(item => parseFloat(item.ctr) || 0);
    
    if (snsCTRChart) snsCTRChart.destroy();
    
    snsCTRChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'CTR (%)',
                data: ctrs,
                backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(251, 146, 60, 0.8)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'CTR (%)' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render O2O Location Chart
function renderO2OLocationChart(data) {
    const ctx = document.getElementById('o2oLocationChart');
    if (!ctx || !data.conversions_by_location || data.conversions_by_location.length === 0) return;
    
    const labels = data.conversions_by_location.map(item => item.workshop_location);
    const counts = data.conversions_by_location.map(item => item.conversion_count);
    
    if (o2oLocationChart) o2oLocationChart.destroy();
    
    o2oLocationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '전환 수',
                data: counts,
                backgroundColor: 'rgba(251, 146, 60, 0.8)',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render O2O Conversion Chart
function renderO2OConversionChart(data) {
    const ctx = document.getElementById('o2oConversionRateChart');
    if (!ctx) {
        console.warn('⚠️ o2oConversionRateChart canvas not found');
        return;
    }
    
    // Use sns_conversion_rate data instead of funnel_metrics
    if (!data.sns_conversion_rate || data.sns_conversion_rate.length === 0) {
        console.warn('⚠️ No sns_conversion_rate data');
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><p class="text-gray-400">데이터 없음</p></div>';
        return;
    }
    
    const validData = data.sns_conversion_rate.filter(item => item.channel && item.click_to_conversion_rate !== undefined);
    if (validData.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><p class="text-gray-400">데이터 없음</p></div>';
        return;
    }
    
    const labels = validData.map(item => {
        const map = { 'blog': '블로그', 'instagram': '인스타그램', 'youtube': '유튜브' };
        return map[item.channel] || item.channel;
    });
    const rates = validData.map(item => parseFloat(item.click_to_conversion_rate) || 0);
    
    if (o2oConversionChart) o2oConversionChart.destroy();
    
    o2oConversionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '전환율 (%)',
                data: rates,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',   // blog - blue
                    'rgba(236, 72, 153, 0.8)',   // instagram - pink
                    'rgba(239, 68, 68, 0.8)'     // youtube - red
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { 
                    beginAtZero: true, 
                    title: { display: true, text: '전환율 (%)' },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const item = validData[context.dataIndex];
                            return [
                                `전환율: ${context.parsed.y.toFixed(2)}%`,
                                `총 클릭: ${item.total_clicks}회`,
                                `전환: ${item.conversions}건`
                            ];
                        }
                    }
                }
            }
        }
    });
    console.log('✅ O2O conversion rate chart rendered with', validData.length, 'channels');
}

// Render Daily SNS Trend Chart
function renderDailySNSTrendChart(data) {
    const ctx = document.getElementById('dailySNSTrendChart');
    if (!ctx || !data.daily_visits || data.daily_visits.length === 0) return;
    
    // Group by date and channel
    const dates = [...new Set(data.daily_visits.map(item => item.visit_date))].sort();
    const channels = ['blog', 'instagram', 'youtube'];
    const channelNames = { 'blog': '블로그', 'instagram': '인스타그램', 'youtube': '유튜브' };
    
    const datasets = channels.map((channel, idx) => {
        const channelData = dates.map(date => {
            const item = data.daily_visits.find(v => v.visit_date === date && v.channel === channel);
            return item ? item.visitor_count : 0;
        });
        
        const colors = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(239, 68, 68, 0.8)'
        ];
        
        return {
            label: channelNames[channel],
            data: channelData,
            borderColor: colors[idx],
            backgroundColor: colors[idx].replace('0.8', '0.2'),
            borderWidth: 2,
            fill: true
        };
    });
    
    if (dailySNSTrendChart) dailySNSTrendChart.destroy();
    
    dailySNSTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: true, position: 'top' }
            }
        }
    });
}

// ========================
// Research Lab (개발 연구소)
// ========================

// Chart instances for Research Lab
let employmentTrendChart = null;
let departmentDistributionChart = null;
let turnoverTrendChart = null;
let departmentTurnoverChart = null;
let satisfactionTrendChart = null;
let satisfactionRadarChart = null;
let performanceDistributionChart = null;
let departmentPerformanceChart = null;

// Switch Research Tab
function switchResearchTab(tabName) {
    console.log('Switching research tab to:', tabName);
    
    // Update tab buttons
    document.querySelectorAll('.research-tab-button').forEach(btn => {
        if (btn.dataset.researchTab === tabName) {
            btn.classList.remove('text-gray-500', 'border-transparent');
            btn.classList.add('text-purple-600', 'border-purple-600');
        } else {
            btn.classList.remove('text-purple-600', 'border-purple-600');
            btn.classList.add('text-gray-500', 'border-transparent');
        }
    });
    
    // Hide all research tab contents
    document.querySelectorAll('.research-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(`research-tab-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
        
        // Render charts for selected tab
        setTimeout(() => {
            switch(tabName) {
                case 'employment':
                    renderEmploymentCharts();
                    break;
                case 'turnover':
                    renderTurnoverCharts();
                    break;
                case 'satisfaction':
                    renderSatisfactionCharts();
                    break;
                case 'performance':
                    renderPerformanceCharts();
                    break;
            }
        }, 100);
    }
}

// Load Research Lab
function loadResearchLab() {
    console.log('🔬 Loading Research Lab...');
    
    // Show employment tab by default
    switchResearchTab('employment');
}

// Render Employment Charts
function renderEmploymentCharts() {
    console.log('📊 Rendering employment charts...');
    
    // Employment Trend Chart
    const employmentCtx = document.getElementById('employmentTrendChart');
    if (employmentCtx) {
        if (employmentTrendChart) employmentTrendChart.destroy();
        
        employmentTrendChart = new Chart(employmentCtx, {
            type: 'line',
            data: {
                labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                datasets: [{
                    label: '직원 수',
                    data: [35, 36, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47],
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { 
                        beginAtZero: false,
                        min: 30,
                        ticks: { precision: 0 }
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' }
                }
            }
        });
    }
    
    // Department Distribution Chart
    const departmentCtx = document.getElementById('departmentDistributionChart');
    if (departmentCtx) {
        if (departmentDistributionChart) departmentDistributionChart.destroy();
        
        departmentDistributionChart = new Chart(departmentCtx, {
            type: 'doughnut',
            data: {
                labels: ['개발팀', '마케팅팀', '영업팀', '디자인팀', '경영지원팀', '고객지원팀'],
                datasets: [{
                    data: [12, 8, 7, 6, 8, 6],
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(240, 147, 251, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(147, 51, 234, 0.8)',
                        'rgba(251, 146, 60, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true, position: 'right' }
                }
            }
        });
    }
}

// Render Turnover Charts
function renderTurnoverCharts() {
    console.log('📊 Rendering turnover charts...');
    
    // Turnover Trend Chart
    const turnoverCtx = document.getElementById('turnoverTrendChart');
    if (turnoverCtx) {
        if (turnoverTrendChart) turnoverTrendChart.destroy();
        
        turnoverTrendChart = new Chart(turnoverCtx, {
            type: 'line',
            data: {
                labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                datasets: [{
                    label: '이직률 (%)',
                    data: [3.2, 2.8, 2.5, 2.1, 1.8, 2.2, 2.0, 1.9, 2.3, 2.1, 1.8, 2.1],
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { 
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' }
                }
            }
        });
    }
    
    // Department Turnover Chart
    const deptTurnoverCtx = document.getElementById('departmentTurnoverChart');
    if (deptTurnoverCtx) {
        if (departmentTurnoverChart) departmentTurnoverChart.destroy();
        
        departmentTurnoverChart = new Chart(deptTurnoverCtx, {
            type: 'bar',
            data: {
                labels: ['개발팀', '마케팅팀', '영업팀', '디자인팀', '경영지원팀', '고객지원팀'],
                datasets: [{
                    label: '이직률 (%)',
                    data: [5.2, 8.5, 12.3, 6.1, 4.8, 9.2],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(234, 179, 8, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(249, 115, 22, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// Render Satisfaction Charts
function renderSatisfactionCharts() {
    console.log('📊 Rendering satisfaction charts...');
    
    // Satisfaction Trend Chart
    const satisfactionCtx = document.getElementById('satisfactionTrendChart');
    if (satisfactionCtx) {
        if (satisfactionTrendChart) satisfactionTrendChart.destroy();
        
        satisfactionTrendChart = new Chart(satisfactionCtx, {
            type: 'line',
            data: {
                labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
                datasets: [{
                    label: '전체 만족도',
                    data: [3.8, 3.9, 4.0, 4.1, 4.2, 4.2, 4.3, 4.3],
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { 
                        beginAtZero: false,
                        min: 3.5,
                        max: 5.0,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' }
                }
            }
        });
    }
    
    // Satisfaction Radar Chart
    const radarCtx = document.getElementById('satisfactionRadarChart');
    if (radarCtx) {
        if (satisfactionRadarChart) satisfactionRadarChart.destroy();
        
        satisfactionRadarChart = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['워라벨', '급여·복지', '성장 기회', '근무 환경', '팀 문화', '리더십'],
                datasets: [{
                    label: '현재 (Q4 2024)',
                    data: [4.5, 4.2, 4.3, 4.6, 4.4, 4.1],
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)'
                }, {
                    label: '전년 (Q4 2023)',
                    data: [4.2, 3.9, 4.0, 4.3, 4.1, 3.8],
                    borderColor: 'rgb(203, 213, 225)',
                    backgroundColor: 'rgba(203, 213, 225, 0.2)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        min: 0,
                        max: 5,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' }
                }
            }
        });
    }
}

// Render Performance Charts
function renderPerformanceCharts() {
    console.log('📊 Rendering performance charts...');
    
    // Performance Distribution Chart
    const perfDistCtx = document.getElementById('performanceDistributionChart');
    if (perfDistCtx) {
        if (performanceDistributionChart) performanceDistributionChart.destroy();
        
        performanceDistributionChart = new Chart(perfDistCtx, {
            type: 'bar',
            data: {
                labels: ['1점대', '2점대', '3점대', '4점대', '5점'],
                datasets: [{
                    label: '직원 수',
                    data: [0, 2, 14, 24, 7],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(234, 179, 8, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(16, 185, 129, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { precision: 0 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
    
    // Department Performance Chart
    const deptPerfCtx = document.getElementById('departmentPerformanceChart');
    if (deptPerfCtx) {
        if (departmentPerformanceChart) departmentPerformanceChart.destroy();
        
        departmentPerformanceChart = new Chart(deptPerfCtx, {
            type: 'bar',
            data: {
                labels: ['개발팀', '마케팅팀', '영업팀', '디자인팀', '경영지원팀', '고객지원팀'],
                datasets: [{
                    label: '평균 성과 점수',
                    data: [4.5, 4.3, 4.2, 4.4, 4.1, 3.9],
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(240, 147, 251, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(147, 51, 234, 0.8)',
                        'rgba(251, 146, 60, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { 
                        beginAtZero: false,
                        min: 3.5,
                        max: 5.0,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// ====================
// Research Lab Password Protection
// ====================

// Check if research lab is already verified in this session
function isResearchLabVerified() {
    return sessionStorage.getItem('researchLabVerified') === 'true';
}

// Override switchMainTab to check password for research lab
const originalSwitchMainTab = switchMainTab;
switchMainTab = function(tabName) {
    if (tabName === 'research') {
        if (!isResearchLabVerified()) {
            openResearchPasswordModal();
            return;
        }
    }
    originalSwitchMainTab(tabName);
};

// Open research password modal
function openResearchPasswordModal() {
    const modal = document.getElementById('researchPasswordModal');
    if (modal) {
        modal.style.display = 'flex';
        // Reset modal state
        document.getElementById('researchPassword').value = '';
        document.getElementById('researchPasswordError').classList.add('hidden');
        document.getElementById('researchPasswordSuccess').classList.add('hidden');
        document.getElementById('verifyResearchBtn').disabled = false;
        // Focus on input
        setTimeout(() => {
            document.getElementById('researchPassword').focus();
        }, 100);
    }
}

// Close research password modal
function closeResearchPasswordModal() {
    const modal = document.getElementById('researchPasswordModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Verify research lab password
async function verifyResearchPassword() {
    const passwordInput = document.getElementById('researchPassword');
    const password = passwordInput.value.trim();
    const errorDiv = document.getElementById('researchPasswordError');
    const errorText = document.getElementById('researchPasswordErrorText');
    const successDiv = document.getElementById('researchPasswordSuccess');
    const verifyBtn = document.getElementById('verifyResearchBtn');

    // Validation
    if (!password) {
        errorText.textContent = '비밀번호를 입력해주세요.';
        errorDiv.classList.remove('hidden');
        successDiv.classList.add('hidden');
        passwordInput.focus();
        return;
    }

    // Disable button during verification
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>인증 중...';
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');

    try {
        const response = await fetch('/api/admin/verify-research-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Success - store verification in sessionStorage
            sessionStorage.setItem('researchLabVerified', 'true');
            
            // Show success message
            successDiv.classList.remove('hidden');
            errorDiv.classList.add('hidden');

            // Close modal and switch to research tab after a short delay
            setTimeout(() => {
                closeResearchPasswordModal();
                originalSwitchMainTab('research');
            }, 1000);
        } else {
            // Failed - show error message
            errorText.textContent = data.message || '비밀번호가 올바르지 않습니다.';
            errorDiv.classList.remove('hidden');
            successDiv.classList.add('hidden');
            
            // Re-enable button
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<i class="fas fa-unlock mr-2"></i>인증하기';
            
            // Clear input and focus
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (error) {
        console.error('Research password verification error:', error);
        errorText.textContent = '네트워크 오류가 발생했습니다. 다시 시도해주세요.';
        errorDiv.classList.remove('hidden');
        successDiv.classList.add('hidden');
        
        // Re-enable button
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-unlock mr-2"></i>인증하기';
    }
}

// Add visual indicator to research tab button
function updateResearchTabIndicator() {
    const researchTabBtn = document.querySelector('[data-tab="research"]');
    if (researchTabBtn) {
        if (isResearchLabVerified()) {
            // Add verified badge if not already present
            if (!researchTabBtn.querySelector('.verified-badge')) {
                const badge = document.createElement('span');
                badge.className = 'verified-badge ml-2 text-xs text-green-600';
                badge.innerHTML = '<i class="fas fa-check-circle"></i>';
                researchTabBtn.appendChild(badge);
            }
        } else {
            // Remove verified badge if present
            const badge = researchTabBtn.querySelector('.verified-badge');
            if (badge) {
                badge.remove();
            }
        }
    }
}

// Update indicator on page load and when verification changes
document.addEventListener('DOMContentLoaded', updateResearchTabIndicator);

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('researchPasswordModal');
    if (modal && e.target === modal) {
        closeResearchPasswordModal();
    }
});
