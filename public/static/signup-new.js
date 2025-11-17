// 회원가입 멀티스텝 폼 관리
let currentStep = 1;
let signupData = {
    userType: '',
    subType: ''
};

// 사용자 유형 선택
function selectUserType(type) {
    const cards = document.querySelectorAll('.user-type-card');
    cards.forEach(card => {
        card.classList.remove('selected');
    });
    
    const radios = document.querySelectorAll(`input[name="user_type"]`);
    radios.forEach(radio => {
        if (radio.value.startsWith(type)) {
            radio.closest('.user-type-card').classList.add('selected');
        }
    });
}

// 다음 단계
function nextStep() {
    if (currentStep === 1) {
        // Step 1 검증
        const selectedType = document.querySelector('input[name="user_type"]:checked');
        if (!selectedType) {
            showNotification('사용자 유형을 선택해주세요.', 'error');
            return;
        }
        
        const [userType, subType] = selectedType.value.split('_');
        signupData.userType = userType;
        signupData.subType = subType;
        
    } else if (currentStep === 2) {
        // Step 2 검증
        const form = document.getElementById('basic-info-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // 폼 데이터 저장
        const formData = new FormData(form);
        signupData.symptoms = [];
        formData.forEach((value, key) => {
            if (key === 'symptoms') {
                signupData.symptoms.push(value);
            } else {
                signupData[key] = value;
            }
        });
        
        // Step 3에 맞는 상세 폼 생성
        generateDetailForm();
    }
    
    currentStep++;
    updateStepDisplay();
}

// 이전 단계
function prevStep() {
    currentStep--;
    updateStepDisplay();
}

// 단계 표시 업데이트
function updateStepDisplay() {
    // 모든 step 숨기기
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // 현재 step 표시
    document.getElementById(`step-${currentStep}`).classList.add('active');
    
    // Progress indicators 업데이트
    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`step-indicator-${i}`);
        if (i < currentStep) {
            indicator.classList.remove('bg-gray-200', 'text-gray-400');
            indicator.classList.add('bg-green-500', 'text-white');
            indicator.innerHTML = '<i class="fas fa-check"></i>';
        } else if (i === currentStep) {
            indicator.classList.remove('bg-gray-200', 'text-gray-400', 'bg-green-500');
            indicator.classList.add('bg-purple-600', 'text-white');
            indicator.textContent = i;
        } else {
            indicator.classList.remove('bg-purple-600', 'bg-green-500', 'text-white');
            indicator.classList.add('bg-gray-200', 'text-gray-400');
            indicator.textContent = i;
        }
    }
    
    // Progress lines 업데이트
    if (currentStep >= 2) {
        document.getElementById('progress-line-1').style.width = '100%';
    } else {
        document.getElementById('progress-line-1').style.width = '0%';
    }
    
    if (currentStep >= 3) {
        document.getElementById('progress-line-2').style.width = '100%';
    } else {
        document.getElementById('progress-line-2').style.width = '0%';
    }
    
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Step 3 상세 폼 생성
function generateDetailForm() {
    const container = document.getElementById('detail-form-container');
    let html = '';
    
    if (signupData.userType === 'B2C') {
        if (signupData.subType === 'daily') {
            // 일상 스트레스형
            html = `
                <div class="space-y-5">
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-user-tag text-purple-600 mr-2"></i>일상 스트레스 유형 *
                        </label>
                        <select name="daily_stress_category" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition">
                            <option value="">선택하세요</option>
                            <optgroup label="👨‍🎓 학생">
                                <option value="student_high">고등학생</option>
                                <option value="student_college">대학생</option>
                                <option value="student_graduate">대학원생</option>
                            </optgroup>
                            <optgroup label="💼 구직자">
                                <option value="job_seeker_exam">고시 준비생</option>
                                <option value="job_seeker_new">신규 졸업자</option>
                                <option value="job_seeker_career">경력 전환 희망자</option>
                                <option value="job_seeker_parttime">파트타임 구직자</option>
                                <option value="job_seeker_short">단기 구직자</option>
                                <option value="job_seeker_long">장기 구직자</option>
                            </optgroup>
                            <optgroup label="👶 양육자">
                                <option value="caregiver_working_mom">워킹맘</option>
                                <option value="caregiver_working_dad">워킹대디</option>
                                <option value="caregiver_fulltime">전업 양육자</option>
                                <option value="caregiver_single">한부모</option>
                            </optgroup>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-comment-alt text-purple-600 mr-2"></i>추가로 하고 싶은 말
                        </label>
                        <textarea name="additional_info" rows="4" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="스트레스 상황이나 원하는 서비스에 대해 자유롭게 작성해주세요"></textarea>
                    </div>
                </div>
            `;
        } else if (signupData.subType === 'work') {
            // 직무 스트레스형
            html = `
                <div class="space-y-5">
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-building text-purple-600 mr-2"></i>업종 *
                        </label>
                        <select name="work_industry" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition">
                            <option value="">선택하세요</option>
                            <option value="it_developer">💻 IT 개발자</option>
                            <option value="design_planning">🎨 디자인 기획</option>
                            <option value="education_teacher">📚 교육 강사</option>
                            <option value="medical_welfare">🏥 의료 복지</option>
                            <option value="service_customer">😊 서비스 고객 응대</option>
                            <option value="manufacturing_production">🏭 제조 생산</option>
                            <option value="public_admin">🏛️ 공공 행정</option>
                            <option value="sales_marketing">📈 영업 마케팅</option>
                            <option value="research_tech">🔬 연구 기술</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-briefcase text-purple-600 mr-2"></i>직종 (상세)
                        </label>
                        <input type="text" name="work_role" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="예: 프론트엔드 개발자, UI/UX 디자이너 등">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-users text-purple-600 mr-2"></i>회사 규모
                        </label>
                        <select name="company_size" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition">
                            <option value="">선택하세요</option>
                            <option value="startup">스타트업 (50명 이하)</option>
                            <option value="small">중소기업 (50-200명)</option>
                            <option value="medium">중견기업 (200-1000명)</option>
                            <option value="large">대기업 (1000명 이상)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-comment-alt text-purple-600 mr-2"></i>추가로 하고 싶은 말
                        </label>
                        <textarea name="additional_info" rows="4" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="직무 스트레스나 원하는 서비스에 대해 자유롭게 작성해주세요"></textarea>
                    </div>
                </div>
            `;
        }
    } else if (signupData.userType === 'B2B') {
        if (signupData.subType === 'perfumer') {
            // 조향사
            html = `
                <div class="space-y-5">
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-store text-blue-600 mr-2"></i>공방명/브랜드명 *
                        </label>
                        <input type="text" name="business_name" required 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="예: 향기로운 하루 공방">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-certificate text-blue-600 mr-2"></i>경력 (년)
                        </label>
                        <input type="number" name="experience_years" min="0" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="0">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-globe text-blue-600 mr-2"></i>웹사이트 또는 SNS
                        </label>
                        <input type="url" name="website" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="https://...">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-comment-alt text-blue-600 mr-2"></i>제휴 희망 사항
                        </label>
                        <textarea name="partnership_interests" rows="4" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="제휴 또는 협업을 원하시는 내용을 자유롭게 작성해주세요"></textarea>
                    </div>
                </div>
            `;
        } else if (signupData.subType === 'company') {
            // 기업
            html = `
                <div class="space-y-5">
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-building text-blue-600 mr-2"></i>회사명 *
                        </label>
                        <input type="text" name="business_name" required 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="예: (주)웰씨코리아">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-id-card text-blue-600 mr-2"></i>사업자등록번호
                        </label>
                        <input type="text" name="business_registration" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="123-45-67890">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-users text-blue-600 mr-2"></i>회사 규모
                        </label>
                        <select name="company_size" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition">
                            <option value="">선택하세요</option>
                            <option value="startup">스타트업 (50명 이하)</option>
                            <option value="small">중소기업 (50-200명)</option>
                            <option value="medium">중견기업 (200-1000명)</option>
                            <option value="large">대기업 (1000명 이상)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-comment-alt text-blue-600 mr-2"></i>납품/클래스 문의 사항
                        </label>
                        <textarea name="inquiry_details" rows="4" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="대량 납품, 기업 클래스 등 원하시는 서비스를 자유롭게 작성해주세요"></textarea>
                    </div>
                </div>
            `;
        } else if (signupData.subType === 'shop') {
            // 매장
            html = `
                <div class="space-y-5">
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-store text-blue-600 mr-2"></i>매장명 *
                        </label>
                        <input type="text" name="business_name" required 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="예: 힐링 스파">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-tag text-blue-600 mr-2"></i>매장 유형
                        </label>
                        <select name="shop_type" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition">
                            <option value="">선택하세요</option>
                            <option value="spa">스파/마사지</option>
                            <option value="beauty">미용실/네일샵</option>
                            <option value="wellness">웰니스 센터</option>
                            <option value="retail">리테일 매장</option>
                            <option value="cafe">카페</option>
                            <option value="other">기타</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-map-marker-alt text-blue-600 mr-2"></i>매장 주소
                        </label>
                        <input type="text" name="shop_address" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="서울시 강남구...">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-comment-alt text-blue-600 mr-2"></i>제품 입점/공급 문의 사항
                        </label>
                        <textarea name="inquiry_details" rows="4" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="원하시는 제품이나 입점 문의 사항을 자유롭게 작성해주세요"></textarea>
                    </div>
                </div>
            `;
        } else if (signupData.subType === 'independent') {
            // 독립 직군
            html = `
                <div class="space-y-5">
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-briefcase text-blue-600 mr-2"></i>직업/직군 *
                        </label>
                        <input type="text" name="occupation" required 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="예: 프리랜서 디자이너">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-certificate text-blue-600 mr-2"></i>경력 (년)
                        </label>
                        <input type="number" name="experience_years" min="0" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="0">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-globe text-blue-600 mr-2"></i>포트폴리오 또는 SNS
                        </label>
                        <input type="url" name="website" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="https://...">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2 text-gray-700">
                            <i class="fas fa-comment-alt text-blue-600 mr-2"></i>협업/문의 희망 사항
                        </label>
                        <textarea name="inquiry_details" rows="4" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition"
                            placeholder="협업이나 제품 문의 사항을 자유롭게 작성해주세요"></textarea>
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
}

// 회원가입 제출
async function submitSignup() {
    // Step 3 폼 데이터 수집
    const detailForm = document.getElementById('detail-form-container');
    const inputs = detailForm.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            if (!signupData[input.name]) signupData[input.name] = [];
            if (input.checked) {
                signupData[input.name].push(input.value);
            }
        } else {
            signupData[input.name] = input.value;
        }
    });
    
    // 필수 필드 검증
    const requiredFields = detailForm.querySelectorAll('[required]');
    for (let field of requiredFields) {
        if (!field.value) {
            showNotification('모든 필수 항목을 입력해주세요.', 'error');
            field.focus();
            return;
        }
    }
    
    // 로딩 표시
    const submitBtn = event.target;
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>가입 중...';
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('회원가입이 완료되었습니다! 🎉', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else {
            showNotification(data.error || '회원가입에 실패했습니다.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('회원가입 오류:', error);
        showNotification('회원가입 중 오류가 발생했습니다.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// 알림 표시
function showNotification(message, type = 'info') {
    // 기존 알림 제거
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

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('회원가입 페이지 로드 완료');
});
