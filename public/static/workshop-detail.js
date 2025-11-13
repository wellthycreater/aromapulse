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

// ========== Review Functions ==========

let currentRating = 0;
let editingReviewId = null;

// Toggle review form
function toggleReviewForm() {
    const form = document.getElementById('review-form');
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
    
    if (!isHidden) {
        // Reset form when hiding
        document.getElementById('review-submit-form').reset();
        setRating(0);
        editingReviewId = null;
    }
}

// Set star rating
function setRating(rating) {
    currentRating = rating;
    document.getElementById('rating-input').value = rating;
    
    // Update star colors
    const starBtns = document.querySelectorAll('.star-btn');
    starBtns.forEach((btn, index) => {
        if (index < rating) {
            btn.classList.remove('text-gray-300');
            btn.classList.add('text-yellow-500');
        } else {
            btn.classList.remove('text-yellow-500');
            btn.classList.add('text-gray-300');
        }
    });
}

// Load reviews for this workshop
async function loadReviews() {
    try {
        document.getElementById('reviews-loading').style.display = 'block';
        document.getElementById('reviews-empty').style.display = 'none';
        
        const response = await fetch(`/api/reviews-api/workshop/${workshopId}`);
        
        if (!response.ok) {
            throw new Error('리뷰를 불러올 수 없습니다');
        }

        const reviews = await response.json();
        
        document.getElementById('reviews-loading').style.display = 'none';
        
        if (reviews.length === 0) {
            document.getElementById('reviews-empty').style.display = 'block';
            document.getElementById('reviews-list').innerHTML = '';
            document.getElementById('review-count').textContent = '(0)';
            document.getElementById('rating-number').textContent = '0.0';
            renderAverageStars(0);
            return;
        }
        
        // Calculate average rating
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        document.getElementById('review-count').textContent = `(${reviews.length})`;
        document.getElementById('rating-number').textContent = avgRating.toFixed(1);
        renderAverageStars(avgRating);
        
        // Render reviews
        renderReviews(reviews);
        
    } catch (error) {
        console.error('리뷰 로드 오류:', error);
        document.getElementById('reviews-loading').style.display = 'none';
        document.getElementById('reviews-empty').style.display = 'block';
    }
}

// Render average stars
function renderAverageStars(rating) {
    const container = document.getElementById('average-stars');
    container.innerHTML = '';
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = 'fas fa-star text-xl';
        
        if (i <= Math.floor(rating)) {
            star.classList.add('text-yellow-500');
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            star.className = 'fas fa-star-half-alt text-xl text-yellow-500';
        } else {
            star.classList.add('text-gray-300');
        }
        
        container.appendChild(star);
    }
}

// Render reviews list
function renderReviews(reviews) {
    const container = document.getElementById('reviews-list');
    const token = localStorage.getItem('token');
    let currentUserId = null;
    
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = payload.userId;
        } catch (e) {
            console.error('Token parse error:', e);
        }
    }
    
    container.innerHTML = reviews.map(review => {
        const isMyReview = currentUserId && review.user_id === currentUserId;
        const date = new Date(review.created_at).toLocaleDateString('ko-KR');
        
        return `
            <div class="border-b pb-4">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                            <span class="font-semibold text-gray-800">${review.user_name || '익명'}</span>
                            <div class="flex">
                                ${generateStars(review.rating)}
                            </div>
                        </div>
                        <p class="text-sm text-gray-500">${date}</p>
                    </div>
                    ${isMyReview ? `
                        <div class="flex space-x-2">
                            <button 
                                onclick="editReview(${review.id}, ${review.rating}, '${escapeHtml(review.comment)}')"
                                class="text-sm text-teal-600 hover:text-teal-700"
                            >
                                <i class="fas fa-edit"></i> 수정
                            </button>
                            <button 
                                onclick="deleteReview(${review.id})"
                                class="text-sm text-red-600 hover:text-red-700"
                            >
                                <i class="fas fa-trash"></i> 삭제
                            </button>
                        </div>
                    ` : ''}
                </div>
                <p class="text-gray-700">${escapeHtml(review.comment)}</p>
            </div>
        `;
    }).join('');
}

// Generate star HTML
function generateStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            html += '<i class="fas fa-star text-yellow-500 text-sm"></i>';
        } else {
            html += '<i class="fas fa-star text-gray-300 text-sm"></i>';
        }
    }
    return html;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Submit review
document.getElementById('review-submit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인이 필요합니다');
        window.location.href = '/login';
        return;
    }
    
    const rating = parseInt(document.getElementById('rating-input').value);
    const comment = document.getElementById('comment-input').value;
    
    if (rating === 0) {
        alert('별점을 선택해주세요');
        return;
    }
    
    try {
        const method = editingReviewId ? 'PUT' : 'POST';
        const url = editingReviewId ? 
            `/api/reviews-api/${editingReviewId}` : 
            '/api/reviews-api';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                workshop_id: workshopId,
                rating: rating,
                comment: comment
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '리뷰 등록에 실패했습니다');
        }
        
        // Reset form and reload reviews
        toggleReviewForm();
        await loadReviews();
        
        alert(editingReviewId ? '리뷰가 수정되었습니다' : '리뷰가 등록되었습니다');
        
    } catch (error) {
        console.error('리뷰 등록 오류:', error);
        alert(error.message);
    }
});

// Edit review
function editReview(id, rating, comment) {
    editingReviewId = id;
    
    // Show form
    document.getElementById('review-form').style.display = 'block';
    
    // Set values
    setRating(rating);
    document.getElementById('comment-input').value = comment;
    
    // Scroll to form
    document.getElementById('review-form').scrollIntoView({ behavior: 'smooth' });
}

// Delete review
async function deleteReview(id) {
    if (!confirm('정말 이 리뷰를 삭제하시겠습니까?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인이 필요합니다');
        return;
    }
    
    try {
        const response = await fetch(`/api/reviews-api/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '리뷰 삭제에 실패했습니다');
        }
        
        await loadReviews();
        alert('리뷰가 삭제되었습니다');
        
    } catch (error) {
        console.error('리뷰 삭제 오류:', error);
        alert(error.message);
    }
}

// Check if user can write review (only show for logged in B2C users)
function checkReviewPermission() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        const userData = JSON.parse(user);
        // Only B2C users can write reviews
        if (userData.user_type === 'B2C') {
            document.getElementById('write-review-section').style.display = 'block';
        }
    }
}

// Initialize
checkAuth();
checkReviewPermission();
loadWorkshopDetails();
loadReviews();
