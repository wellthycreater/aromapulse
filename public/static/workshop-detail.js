// Get workshop ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const workshopId = urlParams.get('id');

let workshopData = null;
let basePrice = 0;
let maxParticipants = 10;

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        const userData = JSON.parse(user);
        document.getElementById('auth-link').textContent = userData.name;
        document.getElementById('auth-link').href = '/dashboard';
    }
}

// Load workshop details
async function loadWorkshopDetails() {
    if (!workshopId) {
        alert('워크샵 ID가 없습니다');
        window.location.href = '/workshops';
        return;
    }

    try {
        const response = await fetch(`/api/workshops/${workshopId}`);
        
        if (!response.ok) {
            throw new Error('워크샵을 찾을 수 없습니다');
        }

        workshopData = await response.json();
        
        // Update page content
        document.getElementById('workshop-category').textContent = workshopData.category || '일반';
        document.getElementById('workshop-title').textContent = workshopData.title;
        document.getElementById('workshop-location').textContent = workshopData.location;
        
        // Format duration (convert minutes to hours)
        const durationText = workshopData.duration ? 
            (workshopData.duration >= 60 ? 
                `${Math.floor(workshopData.duration / 60)}시간${workshopData.duration % 60 > 0 ? ` ${workshopData.duration % 60}분` : ''}` : 
                `${workshopData.duration}분`) : 
            '시간 미정';
        document.getElementById('workshop-duration').textContent = durationText;
        document.getElementById('workshop-description').textContent = workshopData.description;
        document.getElementById('workshop-address').textContent = workshopData.address || '주소 정보 없음';
        
        // Price formatting
        basePrice = workshopData.price;
        const priceFormatted = basePrice.toLocaleString() + '원';
        document.getElementById('workshop-price').textContent = priceFormatted;
        document.getElementById('unit-price').textContent = priceFormatted;
        
        // Max participants
        maxParticipants = workshopData.max_participants || 10;
        document.getElementById('workshop-max-participants').textContent = maxParticipants + '명';
        document.getElementById('participants').max = maxParticipants;
        
        // Update page title
        document.title = `${workshopData.title} - 아로마펄스`;
        
        // Load provider info
        loadProviderInfo(workshopData.provider_id);
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('booking-date').min = today;
        
        // Initial price calculation
        updateTotalPrice();
        
        // Show content, hide loading
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        
    } catch (error) {
        console.error('워크샵 로드 오류:', error);
        alert('워크샵 정보를 불러올 수 없습니다');
        window.location.href = '/workshops';
    }
}

// Load provider information
async function loadProviderInfo(providerId) {
    try {
        const response = await fetch(`/api/workshops/provider/${providerId}`);
        
        if (!response.ok) {
            throw new Error('제공자 정보를 불러올 수 없습니다');
        }

        const provider = await response.json();
        
        const providerHtml = `
            <div class="flex items-start space-x-4">
                <div class="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-2xl text-teal-600"></i>
                </div>
                <div>
                    <h3 class="font-semibold text-lg">${provider.name || '제공자'}</h3>
                    <p class="text-gray-600 text-sm">${provider.email}</p>
                    ${provider.b2b_business_name ? `<p class="text-gray-600 text-sm mt-1"><i class="fas fa-building mr-1"></i>${provider.b2b_business_name}</p>` : ''}
                    ${provider.phone ? `<p class="text-gray-600 text-sm mt-1"><i class="fas fa-phone mr-1"></i>${provider.phone}</p>` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('provider-info').innerHTML = providerHtml;
        
    } catch (error) {
        console.error('제공자 정보 로드 오류:', error);
        document.getElementById('provider-info').innerHTML = '<p class="text-gray-500">제공자 정보를 불러올 수 없습니다</p>';
    }
}

// Increase participants
function increaseParticipants() {
    const input = document.getElementById('participants');
    const current = parseInt(input.value);
    
    if (current < maxParticipants) {
        input.value = current + 1;
        updateTotalPrice();
    } else {
        alert(`최대 ${maxParticipants}명까지 예약 가능합니다`);
    }
}

// Decrease participants
function decreaseParticipants() {
    const input = document.getElementById('participants');
    const current = parseInt(input.value);
    
    if (current > 1) {
        input.value = current - 1;
        updateTotalPrice();
    }
}

// Update total price
function updateTotalPrice() {
    const participants = parseInt(document.getElementById('participants').value);
    const totalPrice = basePrice * participants;
    
    document.getElementById('total-participants').textContent = participants + '명';
    document.getElementById('total-price').textContent = totalPrice.toLocaleString() + '원';
}

// Handle form submission
document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인이 필요합니다');
        window.location.href = '/login';
        return;
    }
    
    // Get form data
    const bookingDate = document.getElementById('booking-date').value;
    const bookingTime = document.getElementById('booking-time').value;
    const participants = parseInt(document.getElementById('participants').value);
    const contactPhone = document.getElementById('contact-phone').value;
    const notes = document.getElementById('booking-notes').value;
    
    // Validate
    if (!bookingDate || !bookingTime) {
        alert('날짜와 시간을 선택해주세요');
        return;
    }
    
    if (!contactPhone) {
        alert('연락처를 입력해주세요');
        return;
    }
    
    // Combine date and time
    const bookingDateTime = `${bookingDate} ${bookingTime}:00`;
    const totalPrice = basePrice * participants;
    
    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                workshop_id: workshopId,
                booking_date: bookingDateTime,
                participants: participants,
                total_price: totalPrice,
                contact_phone: contactPhone,
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '예약 신청에 실패했습니다');
        }
        
        // Show success modal
        document.getElementById('success-modal').style.display = 'flex';
        
        // Reset form
        document.getElementById('booking-form').reset();
        document.getElementById('participants').value = 1;
        updateTotalPrice();
        
    } catch (error) {
        console.error('예약 신청 오류:', error);
        alert(error.message);
    }
});

// Close success modal
function closeSuccessModal() {
    document.getElementById('success-modal').style.display = 'none';
}

// Listen to participants input change
document.getElementById('participants').addEventListener('change', updateTotalPrice);

// Initialize
checkAuth();
loadWorkshopDetails();
