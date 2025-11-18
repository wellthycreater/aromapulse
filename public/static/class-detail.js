// Class Detail Page JavaScript

let classId = null;
let classData = null;

// Initialize page
window.addEventListener('DOMContentLoaded', async () => {
    // Get class ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    classId = urlParams.get('id');
    
    if (!classId) {
        alert('클래스 ID가 없습니다.');
        window.location.href = '/classes';
        return;
    }
    
    // Check authentication
    checkAuth();
    
    // Load class data
    await loadClass();
    
    // Setup form handlers
    setupFormHandlers();
});

// Toggle booking type (personal/company)
function toggleBookingType() {
    const bookingType = document.querySelector('input[name="booking-type"]:checked').value;
    const companySection = document.getElementById('company-info-section');
    const contactLabel = document.getElementById('contact-label');
    const contactPosition = document.getElementById('contact-position');
    
    if (bookingType === 'company') {
        // Show company fields
        companySection.style.display = 'block';
        contactLabel.textContent = '담당자 정보';
        contactPosition.style.display = 'block';
        
        // Make company fields required
        document.getElementById('company-name').setAttribute('required', 'required');
        document.getElementById('industry').setAttribute('required', 'required');
        document.getElementById('contact-position').setAttribute('required', 'required');
    } else {
        // Hide company fields
        companySection.style.display = 'none';
        contactLabel.textContent = '신청자 정보';
        contactPosition.style.display = 'none';
        
        // Make company fields optional
        document.getElementById('company-name').removeAttribute('required');
        document.getElementById('industry').removeAttribute('required');
        document.getElementById('contact-position').removeAttribute('required');
    }
}

// Check authentication and update UI
function checkAuth() {
    const token = localStorage.getItem('token');
    const authButton = document.getElementById('auth-button');
    
    if (token) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            authButton.textContent = `${user.name}님`;
            authButton.onclick = () => window.location.href = '/dashboard';
        }
    } else {
        authButton.textContent = '로그인';
        authButton.onclick = () => window.location.href = '/login';
    }
}

// Handle auth button click
function handleAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/dashboard';
    } else {
        window.location.href = '/login';
    }
}

// Load class data
async function loadClass() {
    try {
        const response = await fetch(`/api/workshops/${classId}`);
        
        if (!response.ok) {
            throw new Error('클래스를 찾을 수 없습니다');
        }
        
        classData = await response.json();
        renderClass(classData);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        
    } catch (error) {
        console.error('클래스 로드 오류:', error);
        alert('클래스 정보를 불러오는데 실패했습니다.');
        window.location.href = '/classes';
    }
}

// Render class data
function renderClass(workshop) {
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
    let currentValue = parseInt(input.value) || 1;
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
// Submit class booking request
async function submitQuoteRequest() {
    try {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            window.location.href = '/login';
            return;
        }
        
        // Get booking type
        const bookingType = document.querySelector('input[name="booking-type"]:checked').value;
        
        // Get form data based on booking type
        let companyName = null;
        let industry = null;
        let department = null;
        let contactPosition = null;
        
        if (bookingType === 'company') {
            companyName = document.getElementById('company-name').value;
            industry = document.getElementById('industry').value;
            department = document.getElementById('department').value;
            contactPosition = document.getElementById('contact-position').value;
        }
        
        const contactName = document.getElementById('contact-name').value;
        const contactPhone = document.getElementById('contact-phone').value;
        const contactEmail = document.getElementById('contact-email').value;
        const participants = parseInt(document.getElementById('participants').value);
        const preferredDate = document.getElementById('preferred-date').value;
        const specialRequests = document.getElementById('special-requests').value;
        
        // Prepare booking data
        const bookingData = {
            workshop_id: classId,
            company_name: companyName || null,
            company_industry: industry || null,
            company_department: department || null,
            company_contact_position: contactPosition || null,
            company_contact_name: contactName,
            company_contact_phone: contactPhone,
            company_contact_email: contactEmail,
            participant_count: participants,
            preferred_date: preferredDate || null,
            requested_instructors: null,
            special_requests: specialRequests || null,
            is_workation: 0
        };
        
        // Send request
        const response = await fetch('/api/workshop-quotes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookingData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '클래스 신청 전송 실패');
        }
        
        // Show success modal
        document.getElementById('success-modal').style.display = 'flex';
        
        // Reset form
        document.getElementById('quote-form').reset();
        document.getElementById('participants').value = 1;
        toggleBookingType(); // Reset form visibility
        
    } catch (error) {
        console.error('클래스 신청 오류:', error);
        alert(`클래스 신청에 실패했습니다:\n${error.message}`);
    }
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('success-modal').style.display = 'none';
    window.location.href = '/classes';
}
