// 전역 변수
let chatbotSessionData = null;
let detectedUserType = 'B2C'; // 기본값

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // URL에서 세션 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
        await loadChatbotSession(sessionId);
    } else {
        // 세션 ID가 없으면 추가 필드 표시
        showAdditionalFields();
    }
});

// 챗봇 세션 데이터 로드
async function loadChatbotSession(sessionId) {
    try {
        const response = await fetch(`/api/chatbot/session/${sessionId}/messages`);
        
        if (response.ok) {
            const data = await response.json();
            chatbotSessionData = data;
            
            // 세션 ID 저장
            document.getElementById('chatbot_session_id').value = sessionId;
            
            // 데이터 분석 및 자동 채우기
            await analyzeChatbotData(data);
            
            // 상담 요약 표시
            displayConsultationSummary(data);
        } else {
            console.error('Failed to load chatbot session');
            showAdditionalFields();
        }
    } catch (error) {
        console.error('Error loading chatbot session:', error);
        showAdditionalFields();
    }
}

// 챗봇 데이터 분석
async function analyzeChatbotData(data) {
    const messages = data.messages || [];
    let detectedInfo = {
        userType: 'B2C',
        needs: [],
        symptoms: [],
        products: [],
        region: null,
        name: null,
        phone: null
    };
    
    // 메시지 분석
    messages.forEach(msg => {
        if (msg.role === 'user') {
            const content = msg.content.toLowerCase();
            
            // B2B 신호 감지
            if (content.match(/회사|기업|법인|단체|대량|납품|도매|직원|팀|사업/)) {
                detectedInfo.userType = 'B2B';
            }
            
            // 증상 감지
            if (content.match(/불면|잠|수면/)) detectedInfo.symptoms.push('insomnia');
            if (content.match(/우울|슬픔|무기력/)) detectedInfo.symptoms.push('depression');
            if (content.match(/불안|초조|걱정/)) detectedInfo.symptoms.push('anxiety');
            if (content.match(/스트레스|피곤/)) detectedInfo.symptoms.push('stress');
            
            // 제품 관심 감지
            if (content.match(/스프레이/)) detectedInfo.products.push('room_spray');
            if (content.match(/디퓨저/)) detectedInfo.products.push('diffuser');
            if (content.match(/캔들|양초/)) detectedInfo.products.push('candle');
            
            // 지역 감지
            const regionMatch = content.match(/(서울|경기|인천|부산|대구|대전|광주|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주)/);
            if (regionMatch) {
                detectedInfo.region = regionMatch[1];
            }
            
            // 이름 감지 (간단한 패턴)
            const nameMatch = content.match(/제 이름은 ([가-힣]{2,4})/);
            if (nameMatch) {
                detectedInfo.name = nameMatch[1];
            }
            
            // 전화번호 감지
            const phoneMatch = content.match(/010[-\s]?\d{4}[-\s]?\d{4}/);
            if (phoneMatch) {
                detectedInfo.phone = phoneMatch[0];
            }
        }
    });
    
    // UI 업데이트
    updateFormWithDetectedInfo(detectedInfo);
}

// 감지된 정보로 폼 업데이트
function updateFormWithDetectedInfo(info) {
    const preFilledInfo = [];
    
    // 사용자 유형 설정
    detectedUserType = info.userType;
    document.getElementById('user_type').value = info.userType;
    
    // Greeting 업데이트
    const greeting = document.getElementById('user-type-greeting');
    if (info.userType === 'B2B') {
        greeting.textContent = '비즈니스 맞춤형 서비스';
    } else {
        greeting.textContent = '개인 맞춤형 서비스';
    }
    
    // 이름 자동 입력
    if (info.name) {
        document.getElementById('name').value = info.name;
        preFilledInfo.push(`✓ 이름: ${info.name}`);
    }
    
    // 전화번호 자동 입력
    if (info.phone) {
        document.getElementById('phone').value = info.phone;
        preFilledInfo.push(`✓ 전화번호: ${info.phone}`);
    }
    
    // 지역 자동 입력
    if (info.region) {
        document.getElementById('region').value = info.region;
        preFilledInfo.push(`✓ 지역: ${info.region}`);
    }
    
    // 감지된 니즈 저장
    const detectedNeeds = {
        symptoms: info.symptoms,
        products: info.products,
        userType: info.userType
    };
    document.getElementById('detected_needs').value = JSON.stringify(detectedNeeds);
    
    // 자동 입력 정보 표시
    if (preFilledInfo.length > 0) {
        const preFilledList = document.getElementById('pre-filled-list');
        preFilledList.innerHTML = preFilledInfo.map(item => `<p>${item}</p>`).join('');
        document.getElementById('pre-filled-info').classList.remove('hidden');
    }
    
    // 추가 필드 표시 여부 결정
    if (!info.region) {
        showAdditionalFields();
    }
}

// 상담 요약 표시
function displayConsultationSummary(data) {
    const session = data.session || {};
    const messages = data.messages || [];
    
    const summaryContent = document.getElementById('summary-content');
    let html = '';
    
    // 사용자 유형
    const userTypeBadge = detectedUserType === 'B2B' 
        ? '<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">비즈니스 고객</span>'
        : '<span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">개인 고객</span>';
    
    html += `
        <div class="flex items-center space-x-2 text-sm">
            <span class="text-gray-600 font-semibold">고객 유형:</span>
            ${userTypeBadge}
        </div>
    `;
    
    // 대화 메시지 수
    const userMessages = messages.filter(m => m.role === 'user').length;
    html += `
        <div class="flex items-center space-x-2 text-sm">
            <span class="text-gray-600 font-semibold">상담 메시지:</span>
            <span class="text-gray-800">${userMessages}개의 메시지</span>
        </div>
    `;
    
    // 감지된 증상
    const detectedNeeds = document.getElementById('detected_needs').value;
    if (detectedNeeds) {
        try {
            const needs = JSON.parse(detectedNeeds);
            if (needs.symptoms && needs.symptoms.length > 0) {
                const symptomMap = {
                    'insomnia': '😴 불면증',
                    'depression': '😔 우울감',
                    'anxiety': '😰 불안감',
                    'stress': '😤 스트레스'
                };
                const symptomText = needs.symptoms.map(s => symptomMap[s] || s).join(', ');
                html += `
                    <div class="flex items-center space-x-2 text-sm">
                        <span class="text-gray-600 font-semibold">관심 증상:</span>
                        <span class="text-gray-800">${symptomText}</span>
                    </div>
                `;
            }
        } catch (e) {}
    }
    
    summaryContent.innerHTML = html;
    document.getElementById('consultation-summary').classList.remove('hidden');
}

// 추가 필드 표시
function showAdditionalFields() {
    document.getElementById('additional-fields').classList.remove('hidden');
    document.getElementById('region').required = true;
    document.getElementById('age_group').required = true;
}

// 소셜 가입
function socialSignup(provider) {
    const sessionId = document.getElementById('chatbot_session_id').value;
    const url = `/api/auth/${provider}${sessionId ? `?session_id=${sessionId}` : ''}`;
    window.location.href = url;
}

// 폼 제출
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        phone: formData.get('phone'),
        user_type: formData.get('user_type'),
        region: formData.get('region') || null,
        age_group: formData.get('age_group') || null,
        gender: formData.get('gender') || null,
        chatbot_session_id: formData.get('chatbot_session_id'),
        detected_needs: formData.get('detected_needs')
    };
    
    // 로딩 표시
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>가입 중...';
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('회원가입이 완료되었습니다! 🎉', 'success');
            
            // 로그인 처리
            if (result.token) {
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
            }
            
            setTimeout(() => {
                // 사용자 유형에 따라 리다이렉트
                if (detectedUserType === 'B2B') {
                    window.location.href = '/dashboard?welcome=true&type=b2b';
                } else {
                    window.location.href = '/dashboard?welcome=true&type=b2c';
                }
            }, 1500);
        } else {
            showNotification(result.error || '회원가입에 실패했습니다.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('회원가입 중 오류가 발생했습니다.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// 알림 표시
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } text-white font-semibold`;
    notification.style.transform = 'translateY(-100px)';
    notification.style.opacity = '0';
    
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                'fa-info-circle'
            } text-2xl"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        notification.style.transform = 'translateY(-100px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
