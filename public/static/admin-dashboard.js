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
    }
}

// Load Dashboard
async function loadDashboard() {
    try {
        // Load stats
        const statsResponse = await fetch('/api/admin/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const stats = await statsResponse.json();
        
        document.getElementById('stat-users').textContent = stats.users || 0;
        document.getElementById('stat-products').textContent = stats.products || 0;
        document.getElementById('stat-workshops').textContent = stats.workshops || 0;
        document.getElementById('stat-classes').textContent = stats.classes || 0;
        
        // Load recent activity
        const activityResponse = await fetch('/api/admin/dashboard/activity', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
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
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

// Load Users
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const users = await response.json();
        
        const tbody = document.getElementById('users-table-body');
        document.getElementById('users-total').textContent = users.length;
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    회원이 없습니다.
                </td></tr>
            `;
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${user.name || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${user.email}</td>
                <td class="px-6 py-4 text-sm">
                    <span class="px-2 py-1 bg-${user.user_type === 'B2C' ? 'blue' : 'purple'}-100 text-${user.user_type === 'B2C' ? 'blue' : 'purple'}-800 rounded-full text-xs">
                        ${user.user_type === 'B2C' ? '개인' : '기업'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${user.role || 'user'}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${formatDate(user.created_at)}</td>
                <td class="px-6 py-4 text-sm">
                    <span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
                        ${user.is_active ? '활성' : '비활성'}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Users load error:', error);
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
                <tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    검색 결과가 없습니다.
                </td></tr>
            `;
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${user.name || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${user.email}</td>
                <td class="px-6 py-4 text-sm">
                    <span class="px-2 py-1 bg-${user.user_type === 'B2C' ? 'blue' : 'purple'}-100 text-${user.user_type === 'B2C' ? 'blue' : 'purple'}-800 rounded-full text-xs">
                        ${user.user_type === 'B2C' ? '개인' : '기업'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${user.role || 'user'}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${formatDate(user.created_at)}</td>
                <td class="px-6 py-4 text-sm">
                    <span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
                        ${user.is_active ? '활성' : '비활성'}
                    </span>
                </td>
            </tr>
        `).join('');
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

function openClassModal() {
    openWorkshopModal(); // Same form structure
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

// Update loadDashboard to include visitor stats
const originalLoadDashboard = loadDashboard;
async function loadDashboard() {
    if (originalLoadDashboard) await originalLoadDashboard();
    await loadVisitorStats();
    await loadUserStats();
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
        
        if (!data.devices || data.devices.length === 0) {
            ctx.parentElement.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-inbox text-gray-400 text-3xl mb-2"></i>
                    <p class="text-gray-400 text-sm">디바이스 통계가 없습니다</p>
                    <p class="text-gray-400 text-xs mt-1">로그인 후 데이터가 수집됩니다</p>
                </div>
            `;
            return;
        }
        
        const labels = data.devices.map(d => getDeviceLabel(d.device_type));
        const counts = data.devices.map(d => d.count);
        const colors = [
            'rgba(147, 51, 234, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)'
        ];
        
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
                        position: 'bottom'
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
let b2bCategoryChart = null;
let regionChart = null;
let genderChart = null;
let monthlySignupChart = null;

// Load User Analytics
async function loadUserAnalytics() {
    console.log('📊 Loading user analytics...');
    
    try {
        const response = await fetch('/api/admin/users/analytics', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('⚠️ User analytics API failed:', response.status);
            return;
        }
        
        const data = await response.json();
        console.log('✅ User analytics data:', data);
        
        // Render all charts with new data structure
        renderUserTypeChartNew(data);
        renderStressTypeChartNew(data);
        renderB2bCategoryChartNew(data);
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

// Enhance loadUsers to include analytics
const _originalLoadUsers2 = loadUsers;
loadUsers = async function() {
    console.log('📊 Enhanced loadUsers called');
    await loadUserStats();
    await loadUserAnalytics();
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

// 3. B2B Category Chart - New
function renderB2bCategoryChartNew(data) {
    const ctx = document.getElementById('b2bCategoryChart');
    if (!ctx) return;
    
    if (!data.b2b_categories || data.b2b_categories.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i><p class="text-gray-400 text-sm">데이터 없음</p></div>';
        return;
    }
    
    const labels = data.b2b_categories.map(item => {
        const map = {
            'perfumer': '조향사',
            'company': '기업',
            'shop': '공방/가게'
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
                label: '회원 수',
                data: counts,
                backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(147, 51, 234, 0.8)'],
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

// 4. Region Chart - New
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

// 5. Gender Chart - New
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

// 6. Monthly Signup Chart - New
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
