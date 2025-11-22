// Workshop/Class Detail Page JavaScript (shared)

let workshopId = null;
let workshopData = null;
let isClassPage = false; // Detect if this is a class detail page

// Initialize page
window.addEventListener('DOMContentLoaded', async () => {
    // Detect page type from URL
    isClassPage = window.location.pathname.includes('class-detail');
    
    // Get workshop/class ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    workshopId = urlParams.get('id');
    
    if (!workshopId) {
        alert(isClassPage ? '클래스 ID가 없습니다.' : '워크샵 ID가 없습니다.');
        window.location.href = isClassPage ? '/classes' : '/workshops';
        return;
    }
    
    // Load workshop data
    await loadWorkshop();
    
    // Setup form handlers
    setupFormHandlers();
});

// Authentication check removed - using unified login system

// Load workshop or class data
async function loadWorkshop() {
    try {
        // Call the appropriate API endpoint based on page type
        const apiEndpoint = isClassPage ? `/api/classes/${workshopId}` : `/api/workshops/${workshopId}`;
        const response = await fetch(apiEndpoint);
        
        if (!response.ok) {
            throw new Error(isClassPage ? '클래스를 찾을 수 없습니다' : '워크샵을 찾을 수 없습니다');
        }
        
        workshopData = await response.json();
        renderWorkshop(workshopData);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        
    } catch (error) {
        console.error(isClassPage ? '클래스 로드 오류:' : '워크샵 로드 오류:', error);
        alert(isClassPage ? '클래스 정보를 불러오는데 실패했습니다.' : '워크샵 정보를 불러오는데 실패했습니다.');
        window.location.href = isClassPage ? '/classes' : '/workshops';
    }
}

// Render workshop data
function renderWorkshop(workshop) {
    // Title and basic info
    document.getElementById('workshop-title').textContent = workshop.title;
    document.getElementById('workshop-category').textContent = workshop.category || '워크샵';
    document.getElementById('workshop-description').textContent = workshop.description || '상세 설명이 없습니다.';
    
    // Location and details
    document.getElementById('workshop-location').textContent = workshop.location;
    document.getElementById('workshop-duration').textContent = workshop.duration ? `${workshop.duration}분` : '미정';
    document.getElementById('workshop-max-participants').textContent = workshop.max_participants ? `최대 ${workshop.max_participants}명` : '인원 제한 없음';
    document.getElementById('workshop-address').textContent = workshop.address || '상세 주소 정보 없음';
    
    // Price
    const price = workshop.price || 0;
    document.getElementById('workshop-price').textContent = `${price.toLocaleString()}원`;
    
    // Created date
    if (workshop.created_at) {
        const date = new Date(workshop.created_at);
        document.getElementById('workshop-created').textContent = date.toLocaleDateString('ko-KR');
    }
    
    // Image
    if (workshop.image_url) {
        const img = document.getElementById('workshop-image');
        img.src = workshop.image_url;
        img.style.display = 'block';
        document.getElementById('placeholder-icon').style.display = 'none';
    }
    
    // Provider info
    if (workshop.provider_name) {
        document.getElementById('provider-info').innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-16 h-16 gradient-pink-purple rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    ${workshop.provider_name.charAt(0)}
                </div>
                <div>
                    <div class="font-bold text-xl text-gray-900">${workshop.provider_name}</div>
                    ${workshop.provider_phone ? `<div class="text-gray-600"><i class="fas fa-phone mr-2"></i>${workshop.provider_phone}</div>` : ''}
                </div>
            </div>
        `;
    }
}

// Adjust participants count
function adjustParticipants(amount) {
    const input = document.getElementById('participants');
    let currentValue = parseInt(input.value) || 10;
    let newValue = currentValue + amount;
    
    // Minimum 1, no maximum limit
    newValue = Math.max(1, newValue);
    
    input.value = newValue;
}

// Update instructor fields based on selection
function updateInstructorFields() {
    const instructorType = document.getElementById('instructor-type').value;
    const psychologistSection = document.getElementById('psychologist-section');
    
    if (instructorType === 'perfumer') {
        // Only perfumer (hide psychologist)
        psychologistSection.style.display = 'none';
        document.getElementById('psychologist-count').value = 0;
    } else if (instructorType === 'both' || instructorType === 'perfumer_psychologist') {
        // Show psychologist section
        psychologistSection.style.display = 'block';
        document.getElementById('psychologist-count').value = 1;
    }
}

// Adjust instructor count
function adjustInstructorCount(type, amount) {
    const input = document.getElementById(`${type}-count`);
    let currentValue = parseInt(input.value) || 0;
    let newValue = currentValue + amount;
    
    // Perfumer: minimum 1, maximum 10
    if (type === 'perfumer') {
        newValue = Math.max(1, Math.min(10, newValue));
    }
    // Psychologist: minimum 0, maximum 10
    else if (type === 'psychologist') {
        newValue = Math.max(0, Math.min(10, newValue));
    }
    
    input.value = newValue;
}

// Setup form handlers
function setupFormHandlers() {
    const form = document.getElementById('quote-form');
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitQuoteRequest();
    });
}

// Check quote permission (same as workshops.js)
function checkQuotePermission() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return { hasPermission: false, reason: 'not_logged_in' };
    }
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        return { hasPermission: false, reason: 'no_user_data' };
    }
    
    const user = JSON.parse(userStr);
    
    // 🔑 관리자는 모든 권한 우회 (임시 접속 허용)
    if (user.is_admin === 1 || user.role === 'admin') {
        return { hasPermission: true, isAdmin: true };
    }
    
    // B2B 사용자 체크
    if (user.user_type !== 'B2B') {
        return { hasPermission: false, reason: 'not_b2b' };
    }
    
    // 회사 규모 체크 (20인 이상)
    const validCompanySizes = ['20_50', '50_100', '100_300', '300_plus'];
    if (!user.company_size || !validCompanySizes.includes(user.company_size)) {
        return { hasPermission: false, reason: 'company_size' };
    }
    
    // 담당자 역할 체크 (HR, 조직문화, 복리후생)
    const allowedRoles = ['hr_manager', 'culture_team', 'welfare_manager'];
    if (!user.company_role || !allowedRoles.includes(user.company_role)) {
        return { hasPermission: false, reason: 'not_manager' };
    }
    
    // 모든 조건 충족
    return { hasPermission: true };
}

// Submit quote request
async function submitQuoteRequest() {
    try {
        // Check permission first
        const permissionCheck = checkQuotePermission();
        
        if (!permissionCheck.hasPermission) {
            // Show specific error message based on reason
            let errorMessage = '';
            switch (permissionCheck.reason) {
                case 'not_logged_in':
                    errorMessage = '로그인이 필요합니다.';
                    alert(errorMessage);
                    window.location.href = '/login';
                    return;
                case 'not_b2b':
                    errorMessage = '워크샵 견적 문의는 B2B 기업 고객만 가능합니다.';
                    break;
                case 'company_size':
                    errorMessage = '워크샵은 20인 이상 규모의 기업만 이용 가능합니다.';
                    break;
                case 'not_manager':
                    errorMessage = 'HR팀, 조직문화팀, 복리후생 담당자만 워크샵 견적을 문의할 수 있습니다.';
                    break;
                default:
                    errorMessage = '워크샵 견적 문의 권한이 없습니다.';
            }
            alert(errorMessage);
            return;
        }
        
        // Get token (permission already checked)
        const token = localStorage.getItem('token');
        
        // Get form data
        const companyName = document.getElementById('company-name').value;
        const industry = document.getElementById('industry').value;
        const department = document.getElementById('department').value;
        const contactPosition = document.getElementById('contact-position').value;
        const contactName = document.getElementById('contact-name').value;
        const contactPhone = document.getElementById('contact-phone').value;
        const contactEmail = document.getElementById('contact-email').value;
        const participants = parseInt(document.getElementById('participants').value);
        const preferredDate = document.getElementById('preferred-date').value;
        const specialRequests = document.getElementById('special-requests').value;
        
        // Get instructor requests
        const instructorTypeEl = document.getElementById('instructor-type');
        const instructorType = instructorTypeEl ? instructorTypeEl.value : 'perfumer';
        const requestedInstructors = [];
        
        // Perfumer is always included
        const perfumerCount = parseInt(document.getElementById('perfumer-count').value) || 1;
        requestedInstructors.push({
            type: 'perfumer',
            count: perfumerCount,
            specialization: '조향사'
        });
        
        // Add psychologist if selected (only for workshops)
        if (instructorTypeEl && (instructorType === 'both' || instructorType === 'perfumer_psychologist')) {
            const psychologistCount = parseInt(document.getElementById('psychologist-count').value) || 0;
            if (psychologistCount > 0) {
                const specializationType = instructorType === 'both' ? '심리상담사' : '멘탈케어 전문가';
                requestedInstructors.push({
                    type: 'psychologist',
                    count: psychologistCount,
                    specialization: specializationType
                });
            }
        }
        
        // Get workation option (only for workshops) or gift wrapping (for classes)
        const workationEl = document.getElementById('workation');
        const giftWrappingEl = document.getElementById('gift-wrapping');
        const isWorkation = workationEl ? workationEl.checked : false;
        const isGiftWrapping = giftWrappingEl ? giftWrappingEl.checked : false;
        
        // Prepare quote data
        const quoteData = {
            workshop_id: workshopId,
            company_name: companyName,
            company_industry: industry,
            company_department: department || null,
            company_contact_position: contactPosition,
            company_contact_name: contactName,
            company_contact_phone: contactPhone,
            company_contact_email: contactEmail,
            participant_count: participants,
            preferred_date: preferredDate || null,
            requested_instructors: JSON.stringify(requestedInstructors),
            special_requests: specialRequests || null,
            is_workation: isWorkation ? 1 : 0,
            is_gift_wrapping: isGiftWrapping ? 1 : 0
        };
        
        // Send request
        const response = await fetch('/api/workshop-quotes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(quoteData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '견적 문의 전송 실패');
        }
        
        // Show success modal
        document.getElementById('success-modal').style.display = 'flex';
        
        // Reset form
        document.getElementById('quote-form').reset();
        document.getElementById('participants').value = 10;
        
    } catch (error) {
        console.error('견적 문의 오류:', error);
        alert(`견적 문의 전송에 실패했습니다:\n${error.message}`);
    }
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('success-modal').style.display = 'none';
    // Redirect to appropriate list page
    window.location.href = isClassPage ? '/classes' : '/workshops';
}
