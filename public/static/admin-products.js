// ==========================================
// Global State
// ==========================================
let currentMainTab = 'products';
let currentUserTab = 'all';
let authToken = null;

// ==========================================
// Authentication
// ==========================================
function checkAuth() {
    authToken = localStorage.getItem('adminToken') || localStorage.getItem('admin_token') || localStorage.getItem('auth_token');
    if (!authToken) {
        window.location.href = '/admin-login';
        return false;
    }
    return true;
}

function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('auth_token');
        window.location.href = '/admin-login';
    }
}

// ==========================================
// Tab Management
// ==========================================
function switchMainTab(tabName) {
    currentMainTab = tabName;
    
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
    const section = document.getElementById(`section-${tabName}`);
    if (section) {
        section.classList.remove('hidden');
        
        // Load data for the section
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
}

function switchUserTab(tabName) {
    currentUserTab = tabName;
    
    // Update sub-tab buttons
    document.querySelectorAll('.sub-tab-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.userTab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Reload users with filter
    loadUsers();
}

// ==========================================
// Dashboard Functions
// ==========================================
async function loadDashboard() {
    try {
        const response = await fetch('/api/admin/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load dashboard');
        
        const stats = await response.json();
        
        // Update stats
        document.getElementById('stat-users').textContent = stats.users || 0;
        document.getElementById('stat-products').textContent = stats.products || 0;
        document.getElementById('stat-workshops').textContent = stats.workshops || 0;
        document.getElementById('stat-classes').textContent = stats.classes || 0;
        
        // Load recent activity
        loadRecentActivity();
    } catch (error) {
        console.error('Dashboard load error:', error);
        document.getElementById('stat-users').textContent = '0';
        document.getElementById('stat-products').textContent = '0';
        document.getElementById('stat-workshops').textContent = '0';
        document.getElementById('stat-classes').textContent = '0';
    }
}

async function loadRecentActivity() {
    const container = document.getElementById('recent-activity');
    try {
        const response = await fetch('/api/admin/dashboard/activity', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load activity');
        
        const activities = await response.json();
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">최근 활동이 없습니다.</p>';
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <i class="fas ${activity.icon} text-sage"></i>
                <div class="flex-1">
                    <p class="text-sm text-gray-800">${activity.message}</p>
                    <p class="text-xs text-gray-500">${formatDate(activity.created_at)}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Activity load error:', error);
        container.innerHTML = '<p class="text-gray-500 text-center py-8">활동을 불러올 수 없습니다.</p>';
    }
}

// ==========================================
// Users Functions
// ==========================================
async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>데이터를 불러오는 중...</p>
            </td>
        </tr>
    `;
    
    try {
        let url = '/api/admin/users';
        const params = new URLSearchParams();
        
        // Filter by user tab
        if (currentUserTab !== 'all') {
            if (currentUserTab === 'individual') {
                params.append('user_type', 'b2c');
            } else if (currentUserTab === 'business') {
                params.append('user_type', 'b2b');
            } else if (currentUserTab === 'partner') {
                params.append('role', 'partner');
            } else if (currentUserTab === 'admin') {
                params.append('role', 'admin');
            }
        }
        
        // Add search and status filter
        const search = document.getElementById('user-search')?.value;
        const status = document.getElementById('user-status-filter')?.value;
        if (search) params.append('search', search);
        if (status) params.append('is_active', status);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load users');
        
        const users = await response.json();
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-2"></i>
                        <p>회원이 없습니다.</p>
                    </td>
                </tr>
            `;
            document.getElementById('users-total').textContent = '0';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        ${user.profile_image ? 
                            `<img src="${user.profile_image}" class="w-8 h-8 rounded-full" alt="">` :
                            `<div class="w-8 h-8 rounded-full bg-sage text-white flex items-center justify-center text-sm font-bold">${user.name[0]}</div>`
                        }
                        <span class="font-medium">${user.name}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${user.email}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUserTypeBadgeColor(user)}">
                        ${getUserTypeLabel(user)}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${formatDate(user.created_at)}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${user.is_active ? '활성' : '비활성'}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="viewUser(${user.id})" class="text-sage hover:text-sage-dark mr-2" title="상세보기">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="toggleUserStatus(${user.id}, ${user.is_active})" 
                        class="text-${user.is_active ? 'red' : 'green'}-600 hover:text-${user.is_active ? 'red' : 'green'}-700" 
                        title="${user.is_active ? '비활성화' : '활성화'}">
                        <i class="fas fa-${user.is_active ? 'ban' : 'check'}"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        document.getElementById('users-total').textContent = users.length;
    } catch (error) {
        console.error('Users load error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-red-500">
                    <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                    <p>데이터를 불러오는데 실패했습니다.</p>
                </td>
            </tr>
        `;
    }
}

function getUserTypeLabel(user) {
    if (user.role === 'admin') return '관리자';
    if (user.role === 'partner') return '공방 파트너';
    if (user.user_type === 'b2c') return '개인 회원';
    if (user.user_type === 'b2b') {
        if (user.b2b_category) return `기업 (${user.b2b_category})`;
        return '기업 회원';
    }
    return '일반 회원';
}

function getUserTypeBadgeColor(user) {
    if (user.role === 'admin') return 'bg-purple-100 text-purple-800';
    if (user.role === 'partner') return 'bg-blue-100 text-blue-800';
    if (user.user_type === 'b2b') return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
}

function searchUsers() {
    loadUsers();
}

async function viewUser(userId) {
    alert('회원 상세보기 기능은 개발 중입니다.');
}

async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? '비활성화' : '활성화';
    if (!confirm(`정말 이 회원을 ${action} 하시겠습니까?`)) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: !currentStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update user');
        
        alert(`회원이 ${action} 되었습니다.`);
        loadUsers();
    } catch (error) {
        console.error('User update error:', error);
        alert(`회원 ${action}에 실패했습니다.`);
    }
}

// ==========================================
// Products Functions
// ==========================================
async function loadProducts() {
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>데이터를 불러오는 중...</p>
            </td>
        </tr>
    `;
    
    try {
        let url = '/api/admin/products';
        const params = new URLSearchParams();
        
        const concept = document.getElementById('product-concept-filter')?.value;
        const status = document.getElementById('product-status-filter')?.value;
        const search = document.getElementById('product-search')?.value;
        
        if (concept) params.append('concept', concept);
        if (status) params.append('is_active', status);
        if (search) params.append('search', search);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load products');
        
        const products = await response.json();
        
        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-2"></i>
                        <p>제품이 없습니다.</p>
                    </td>
                </tr>
            `;
            document.getElementById('products-total').textContent = '0';
            return;
        }
        
        tbody.innerHTML = products.map(product => `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-3">
                        ${product.thumbnail_image ? 
                            `<img src="${product.thumbnail_image}" class="w-12 h-12 rounded-lg object-cover" alt="">` :
                            `<div class="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center"><i class="fas fa-image text-gray-400"></i></div>`
                        }
                        <span class="font-medium">${product.name}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.concept === 'symptom_care' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                        ${product.concept === 'symptom_care' ? '증상 케어' : '리프레시'}
                    </span>
                </td>
                <td class="px-6 py-4 font-semibold">${formatPrice(product.price)}</td>
                <td class="px-6 py-4">${product.stock || 0}개</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${product.is_active ? '판매중' : '판매중지'}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="editProduct(${product.id})" class="text-sage hover:text-sage-dark mr-2" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct(${product.id})" class="text-red-600 hover:text-red-700" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        document.getElementById('products-total').textContent = products.length;
    } catch (error) {
        console.error('Products load error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-red-500">
                    <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                    <p>데이터를 불러오는데 실패했습니다.</p>
                </td>
            </tr>
        `;
    }
}

function openProductModal(productId = null) {
    document.getElementById('product-modal').classList.remove('hidden');
    document.getElementById('product-modal-title').textContent = productId ? '제품 수정' : '제품 등록';
    
    if (productId) {
        // Load product data for editing
        loadProductData(productId);
    } else {
        // Reset form for new product
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-is-active').checked = true;
    }
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
    document.getElementById('product-form').reset();
}

async function loadProductData(productId) {
    try {
        const response = await fetch(`/api/admin/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load product');
        
        const product = await response.json();
        
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-concept').value = product.concept;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-is-active').checked = product.is_active === 1;
    } catch (error) {
        console.error('Product load error:', error);
        alert('제품 정보를 불러오는데 실패했습니다.');
        closeProductModal();
    }
}

async function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('product-id').value;
    const data = {
        name: document.getElementById('product-name').value,
        concept: document.getElementById('product-concept').value,
        price: parseInt(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        description: document.getElementById('product-description').value,
        is_active: document.getElementById('product-is-active').checked ? 1 : 0
    };
    
    try {
        const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';
        const method = productId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Failed to save product');
        
        alert(productId ? '제품이 수정되었습니다.' : '제품이 등록되었습니다.');
        closeProductModal();
        loadProducts();
    } catch (error) {
        console.error('Product save error:', error);
        alert('제품 저장에 실패했습니다.');
    }
}

function editProduct(productId) {
    openProductModal(productId);
}

async function deleteProduct(productId) {
    if (!confirm('정말 이 제품을 삭제하시겠습니까?')) return;
    
    try {
        const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete product');
        
        alert('제품이 삭제되었습니다.');
        loadProducts();
    } catch (error) {
        console.error('Product delete error:', error);
        alert('제품 삭제에 실패했습니다.');
    }
}

// ==========================================
// Blog Functions
// ==========================================
async function loadBlog() {
    const tbody = document.getElementById('blog-table-body');
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>데이터를 불러오는 중...</p>
            </td>
        </tr>
    `;
    
    try {
        const response = await fetch('/api/admin/blog', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load blog posts');
        
        const posts = await response.json();
        
        if (posts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-2"></i>
                        <p>블로그 포스트가 없습니다.</p>
                    </td>
                </tr>
            `;
            document.getElementById('blog-total').textContent = '0';
            return;
        }
        
        tbody.innerHTML = posts.map(post => `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="px-6 py-4 font-medium">${post.title}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${post.category || '일반'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${post.view_count || 0}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${formatDate(post.published_at || post.created_at)}</td>
                <td class="px-6 py-4 text-center">
                    <button onclick="editBlog(${post.id})" class="text-sage hover:text-sage-dark mr-2" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteBlog(${post.id})" class="text-red-600 hover:text-red-700" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        document.getElementById('blog-total').textContent = posts.length;
    } catch (error) {
        console.error('Blog load error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-red-500">
                    <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                    <p>데이터를 불러오는데 실패했습니다.</p>
                </td>
            </tr>
        `;
    }
}

function openBlogModal() {
    alert('블로그 작성 기능은 개발 중입니다.');
}

function editBlog(postId) {
    alert('블로그 수정 기능은 개발 중입니다.');
}

async function deleteBlog(postId) {
    if (!confirm('정말 이 포스트를 삭제하시겠습니까?')) return;
    alert('블로그 삭제 기능은 개발 중입니다.');
}

// ==========================================
// Workshops Functions
// ==========================================
async function loadWorkshops() {
    const grid = document.getElementById('workshops-grid');
    grid.innerHTML = `
        <div class="col-span-full text-center py-12 text-gray-500">
            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
            <p>데이터를 불러오는 중...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/admin/workshops', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load workshops');
        
        const workshops = await response.json();
        
        if (workshops.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>워크샵이 없습니다.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = workshops.map(workshop => `
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                ${workshop.image_url ? 
                    `<img src="${workshop.image_url}" class="w-full h-48 object-cover" alt="${workshop.title}">` :
                    `<div class="w-full h-48 bg-gray-200 flex items-center justify-center"><i class="fas fa-image text-4xl text-gray-400"></i></div>`
                }
                <div class="p-4">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">${workshop.title}</h3>
                    <p class="text-sm text-gray-600 mb-2 line-clamp-2">${workshop.description || ''}</p>
                    <div class="flex items-center text-sm text-gray-600 mb-1">
                        <i class="fas fa-map-marker-alt text-sage mr-2"></i>
                        ${workshop.location}
                    </div>
                    <div class="flex items-center text-sm text-gray-600 mb-3">
                        <i class="fas fa-won-sign text-sage mr-2"></i>
                        ${formatPrice(workshop.price)}
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="editWorkshop(${workshop.id})" class="flex-1 bg-sage text-white py-2 rounded-lg hover:opacity-90 text-sm">
                            <i class="fas fa-edit mr-1"></i>수정
                        </button>
                        <button onclick="deleteWorkshop(${workshop.id})" class="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 text-sm">
                            <i class="fas fa-trash mr-1"></i>삭제
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Workshops load error:', error);
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-500">
                <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                <p>데이터를 불러오는데 실패했습니다.</p>
            </div>
        `;
    }
}

function openWorkshopModal() {
    alert('워크샵 등록 기능은 개발 중입니다.');
}

function editWorkshop(workshopId) {
    alert('워크샵 수정 기능은 개발 중입니다.');
}

async function deleteWorkshop(workshopId) {
    if (!confirm('정말 이 워크샵을 삭제하시겠습니까?')) return;
    alert('워크샵 삭제 기능은 개발 중입니다.');
}

// ==========================================
// Classes Functions
// ==========================================
async function loadClasses() {
    const grid = document.getElementById('classes-grid');
    grid.innerHTML = `
        <div class="col-span-full text-center py-12 text-gray-500">
            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
            <p>데이터를 불러오는 중...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/admin/classes', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load classes');
        
        const classes = await response.json();
        
        if (classes.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>원데이 클래스가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = classes.map(cls => `
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                ${cls.image_url ? 
                    `<img src="${cls.image_url}" class="w-full h-48 object-cover" alt="${cls.title}">` :
                    `<div class="w-full h-48 bg-gray-200 flex items-center justify-center"><i class="fas fa-image text-4xl text-gray-400"></i></div>`
                }
                <div class="p-4">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">${cls.title}</h3>
                    <p class="text-sm text-gray-600 mb-2 line-clamp-2">${cls.description || ''}</p>
                    <div class="flex items-center text-sm text-gray-600 mb-1">
                        <i class="fas fa-map-marker-alt text-sage mr-2"></i>
                        ${cls.location}
                    </div>
                    <div class="flex items-center text-sm text-gray-600 mb-3">
                        <i class="fas fa-won-sign text-sage mr-2"></i>
                        ${formatPrice(cls.price)}
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="editClass(${cls.id})" class="flex-1 bg-sage text-white py-2 rounded-lg hover:opacity-90 text-sm">
                            <i class="fas fa-edit mr-1"></i>수정
                        </button>
                        <button onclick="deleteClass(${cls.id})" class="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 text-sm">
                            <i class="fas fa-trash mr-1"></i>삭제
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Classes load error:', error);
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-500">
                <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                <p>데이터를 불러오는데 실패했습니다.</p>
            </div>
        `;
    }
}

function openClassModal() {
    alert('원데이 클래스 등록 기능은 개발 중입니다.');
}

function editClass(classId) {
    alert('원데이 클래스 수정 기능은 개발 중입니다.');
}

async function deleteClass(classId) {
    if (!confirm('정말 이 클래스를 삭제하시겠습니까?')) return;
    alert('원데이 클래스 삭제 기능은 개발 중입니다.');
}

// ==========================================
// Utility Functions
// ==========================================
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
}

function formatPrice(price) {
    if (!price) return '0원';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

// ==========================================
// Event Listeners & Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    // Add event listeners for filters
    const productConceptFilter = document.getElementById('product-concept-filter');
    const productStatusFilter = document.getElementById('product-status-filter');
    const productSearch = document.getElementById('product-search');
    
    if (productConceptFilter) productConceptFilter.addEventListener('change', loadProducts);
    if (productStatusFilter) productStatusFilter.addEventListener('change', loadProducts);
    if (productSearch) {
        let searchTimeout;
        productSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(loadProducts, 500);
        });
    }
    
    // Load initial data for current tab
    switchMainTab(currentMainTab);
});
