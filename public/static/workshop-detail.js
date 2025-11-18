// Workshop Detail Page JavaScript

let workshopId = null;
let workshopData = null;

// Initialize page
window.addEventListener('DOMContentLoaded', async () => {
    // Get workshop ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    workshopId = urlParams.get('id');
    
    if (!workshopId) {
        alert('워크샵 ID가 없습니다.');
        window.location.href = '/workshops';
        return;
    }
    
    // Check authentication
    checkAuth();
    
    // Load workshop data
    await loadWorkshop();
    
    // Setup form handlers
    setupFormHandlers();
});

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

// Load workshop data
async function loadWorkshop() {
    try {
        const response = await fetch(`/api/workshops/${workshopId}`);
        
        if (!response.ok) {
            throw new Error('워크샵을 찾을 수 없습니다');
        }
        
        workshopData = await response.json();
        renderWorkshop(workshopData);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        
    } catch (error) {
        console.error('워크샵 로드 오류:', error);
        alert('워크샵 정보를 불러오는데 실패했습니다.');
        window.location.href = '/workshops';
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
    
    // Keep within bounds
    newValue = Math.max(10, Math.min(1000, newValue));
    
    input.value = newValue;
}

// Setup form handlers
function setupFormHandlers() {
    const form = document.getElementById('quote-form');
    
    // Handle checkbox changes for instructor counts
    document.getElementById('perfumer').addEventListener('change', function(e) {
        const countInput = document.getElementById('perfumer-count');
        if (e.target.checked) {
            countInput.classList.remove('instructor-count');
            countInput.disabled = false;
        } else {
            countInput.classList.add('instructor-count');
            countInput.disabled = true;
        }
    });
    
    document.getElementById('psychologist').addEventListener('change', function(e) {
        const countInput = document.getElementById('psychologist-count');
        if (e.target.checked) {
            countInput.classList.remove('instructor-count');
            countInput.disabled = false;
        } else {
            countInput.classList.add('instructor-count');
            countInput.disabled = true;
        }
    });
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitQuoteRequest();
    });
}

// Submit quote request
async function submitQuoteRequest() {
    try {
        // Get token
        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            window.location.href = '/login';
            return;
        }
        
        // Get form data
        const companyName = document.getElementById('company-name').value;
        const department = document.getElementById('department').value;
        const contactName = document.getElementById('contact-name').value;
        const contactPhone = document.getElementById('contact-phone').value;
        const contactEmail = document.getElementById('contact-email').value;
        const participants = parseInt(document.getElementById('participants').value);
        const preferredDate = document.getElementById('preferred-date').value;
        const specialRequests = document.getElementById('special-requests').value;
        
        // Get instructor requests
        const requestedInstructors = [];
        if (document.getElementById('perfumer').checked) {
            requestedInstructors.push({
                type: 'perfumer',
                count: parseInt(document.getElementById('perfumer-count').value) || 1,
                specialization: '조향사'
            });
        }
        if (document.getElementById('psychologist').checked) {
            requestedInstructors.push({
                type: 'psychologist',
                count: parseInt(document.getElementById('psychologist-count').value) || 1,
                specialization: '심리상담사'
            });
        }
        
        // Get workation option
        const isWorkation = document.getElementById('workation').checked;
        
        // Prepare quote data
        const quoteData = {
            workshop_id: workshopId,
            company_name: companyName,
            company_department: department || null,
            company_contact_name: contactName,
            company_contact_phone: contactPhone,
            company_contact_email: contactEmail,
            participant_count: participants,
            preferred_date: preferredDate || null,
            requested_instructors: JSON.stringify(requestedInstructors),
            special_requests: specialRequests || null,
            is_workation: isWorkation ? 1 : 0
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
    window.location.href = '/workshops';
}
