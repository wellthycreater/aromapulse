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
