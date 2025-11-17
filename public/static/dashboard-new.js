// Dashboard New JavaScript

let currentUser = null;
let selectedImageFile = null;

// Load dashboard on page load
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        // Decode JWT to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.userId;

        // Fetch user data
        const response = await fetch(`/api/auth/me/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        currentUser = await response.json();
        displayDashboard(currentUser);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('대시보드를 불러오는데 실패했습니다.');
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
});

// Display dashboard based on user type
function displayDashboard(user) {
    document.getElementById('loading').classList.add('hidden');

    if (user.user_type?.startsWith('B2C')) {
        displayB2CDashboard(user);
    } else if (user.user_type?.startsWith('B2B')) {
        displayB2BDashboard(user);
    }
}

// Display B2C Dashboard
function displayB2CDashboard(user) {
    const b2cDashboard = document.getElementById('b2c-dashboard');
    b2cDashboard.classList.remove('hidden');

    // Header
    document.getElementById('header-user-name').textContent = `${user.name}님`;

    // Welcome
    document.getElementById('welcome-name').textContent = user.name;

    // Profile Card
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;
    
    // Set profile initial
    const initial = user.name.charAt(0).toUpperCase();
    document.getElementById('profile-placeholder').textContent = initial;

    // Badge
    const badgeText = user.user_type === 'B2C_daily' ? '일상 스트레스 관리' : '직무 스트레스 관리';
    document.getElementById('profile-badge').textContent = badgeText;

    // Member Info
    const createdDate = new Date(user.created_at).toLocaleDateString('ko-KR');
    document.getElementById('member-since').textContent = createdDate;
    document.getElementById('member-region').textContent = user.region || '-';
    
    const ageGroupMap = {
        '10s': '10대', '20s': '20대', '30s': '30대',
        '40s': '40대', '50s': '50대', '60s_plus': '60대 이상'
    };
    document.getElementById('member-age').textContent = ageGroupMap[user.age_group] || '-';
    
    // Symptoms
    const symptoms = user.user_data?.symptoms || [];
    const symptomMap = {
        'insomnia': '불면증',
        'depression': '우울감',
        'anxiety': '불안감',
        'stress': '스트레스'
    };
    const symptomText = symptoms.length > 0 
        ? symptoms.map(s => symptomMap[s] || s).join(', ')
        : '-';
    document.getElementById('member-symptoms').textContent = symptomText;

    // Load profile image if exists
    loadProfileImage(user.id);
}

// Display B2B Dashboard
function displayB2BDashboard(user) {
    const b2bDashboard = document.getElementById('b2b-dashboard');
    b2bDashboard.classList.remove('hidden');

    // Header
    document.getElementById('header-user-name').textContent = `${user.name}님`;

    // Welcome
    const businessName = user.user_data?.business_name || user.name;
    document.getElementById('b2b-welcome-name').textContent = businessName;

    // B2B Profile Card
    document.getElementById('b2b-business-name').textContent = businessName;
    document.getElementById('b2b-email').textContent = user.email;
    
    // Set B2B profile initial
    const initial = businessName.charAt(0).toUpperCase();
    document.getElementById('b2b-profile-placeholder').textContent = initial;

    // Badge
    const typeMap = {
        'B2B_perfumer': '조향사',
        'B2B_company': '기업',
        'B2B_shop': '매장',
        'B2B_independent': '독립 직군'
    };
    document.getElementById('b2b-badge').textContent = typeMap[user.user_type] || '비즈니스 회원';

    // Business Info
    const createdDate = new Date(user.created_at).toLocaleDateString('ko-KR');
    document.getElementById('b2b-member-since').textContent = createdDate;
    document.getElementById('b2b-type').textContent = typeMap[user.user_type] || '-';
    document.getElementById('b2b-contact-name').textContent = user.name;
    document.getElementById('b2b-phone').textContent = user.phone || '-';

    // Load B2B profile image if exists
    loadB2BProfileImage(user.id);
}

// Load profile image
async function loadProfileImage(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/profile-image`);
        if (response.ok) {
            const data = await response.json();
            if (data.image_url) {
                document.getElementById('profile-image').src = data.image_url;
                document.getElementById('profile-image').classList.remove('hidden');
                document.getElementById('profile-placeholder').classList.add('hidden');
            }
        }
    } catch (error) {
        console.log('No profile image found');
    }
}

// Load B2B profile image
async function loadB2BProfileImage(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/profile-image`);
        if (response.ok) {
            const data = await response.json();
            if (data.image_url) {
                document.getElementById('b2b-profile-image').src = data.image_url;
                document.getElementById('b2b-profile-image').classList.remove('hidden');
                document.getElementById('b2b-profile-placeholder').classList.add('hidden');
            }
        }
    } catch (error) {
        console.log('No profile image found');
    }
}

// Open Edit Profile Modal
function openEditProfileModal() {
    if (!currentUser) return;

    document.getElementById('edit-name').value = currentUser.name || '';
    document.getElementById('edit-phone').value = currentUser.phone || '';
    document.getElementById('edit-region').value = currentUser.region || '';
    document.getElementById('edit-age-group').value = currentUser.age_group || '';

    document.getElementById('edit-profile-modal').classList.add('show');
}

// Close Edit Profile Modal
function closeEditProfileModal() {
    document.getElementById('edit-profile-modal').classList.remove('show');
}

// Open B2B Edit Modal
function openB2BEditModal() {
    openEditProfileModal();
}

// Handle Edit Profile Form Submit
document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
        return;
    }

    const updateData = {
        name: document.getElementById('edit-name').value,
        phone: document.getElementById('edit-phone').value,
        region: document.getElementById('edit-region').value,
        age_group: document.getElementById('edit-age-group').value
    };

    try {
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        const result = await response.json();
        alert('프로필이 성공적으로 업데이트되었습니다!');
        closeEditProfileModal();
        
        // Reload page to reflect changes
        location.reload();
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('프로필 업데이트에 실패했습니다.');
    }
});

// Open Image Upload Modal
function openImageUploadModal() {
    document.getElementById('image-upload-modal').classList.add('show');
}

// Open B2B Image Upload Modal
function openB2BImageUploadModal() {
    openImageUploadModal();
}

// Close Image Upload Modal
function closeImageUploadModal() {
    document.getElementById('image-upload-modal').classList.remove('show');
    selectedImageFile = null;
    
    // Reset preview
    document.getElementById('image-preview').classList.add('hidden');
    document.getElementById('image-preview-placeholder').classList.remove('hidden');
}

// Preview selected image
function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('이미지 파일은 최대 5MB까지 업로드 가능합니다.');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }

    selectedImageFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('image-preview').src = e.target.result;
        document.getElementById('image-preview').classList.remove('hidden');
        document.getElementById('image-preview-placeholder').classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

// Upload profile image
async function uploadProfileImage() {
    if (!selectedImageFile) {
        alert('이미지를 선택해주세요.');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
        return;
    }

    try {
        // Convert image to base64
        const base64 = await fileToBase64(selectedImageFile);

        const response = await fetch('/api/users/profile-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                image_data: base64,
                image_type: selectedImageFile.type
            })
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        alert('프로필 이미지가 업로드되었습니다!');
        closeImageUploadModal();
        
        // Reload page to show new image
        location.reload();
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('이미지 업로드에 실패했습니다.');
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const editModal = document.getElementById('edit-profile-modal');
    const imageModal = document.getElementById('image-upload-modal');
    
    if (event.target === editModal) {
        closeEditProfileModal();
    }
    if (event.target === imageModal) {
        closeImageUploadModal();
    }
}
