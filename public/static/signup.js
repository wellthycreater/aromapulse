// 회원가입 멀티스텝 폼 관리
let currentStep = 1;
let signupData = {
    userType: '',
    subType: ''
};

// 사용자 유형 선택
function selectUserType(type) {
    const radios = document.querySelectorAll(`input[name="user_type"]`);
    radios.forEach(radio => {
        const card = radio.closest('.border-2');
        if (radio.value.startsWith(type)) {
            card.classList.add('card-selected');
            if (type === 'B2C') {
                card.classList.add('border-purple-500');
                card.classList.remove('border-gray-200');
            } else {
                card.classList.add('border-pink-500');
                card.classList.remove('border-gray-200');
            }
        } else {
            card.classList.remove('card-selected', 'border-purple-500', 'border-pink-500');
            card.classList.add('border-gray-200');
        }
    });
}

// 다음 단계
function nextStep() {
    if (currentStep === 1) {
        // Step 1 검증
        const selectedType = document.querySelector('input[name="user_type"]:checked');
        if (!selectedType) {
            alert('사용자 유형을 선택해주세요.');
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
        formData.forEach((value, key) => {
            if (key === 'symptoms') {
                if (!signupData.symptoms) signupData.symptoms = [];
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
    
    // Progress bar 업데이트
    const progress = (currentStep / 3) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    
    // Step label 강조
    document.querySelectorAll('.step-label').forEach(label => {
        const step = parseInt(label.dataset.step);
        if (step === currentStep) {
            label.classList.remove('text-gray-600');
            label.classList.add('text-purple-600', 'font-extrabold');
        } else if (step < currentStep) {
            label.classList.remove('text-gray-600', 'font-extrabold');
            label.classList.add('text-purple-400');
        } else {
            label.classList.remove('text-purple-600', 'text-purple-400', 'font-extrabold');
            label.classList.add('text-gray-600');
        }
    });
}

// Step 3 상세 폼 생성
function generateDetailForm() {
    const container = document.getElementById('detail-form-container');
    let html = '';
    
    if (signupData.userType === 'B2C') {
        if (signupData.subType === 'daily') {
            // 일상 스트레스 - 학생/구직자/양육자
            html = `
                <div class="space-y-5">
                    <div>
                        <label class="block text-sm font-bold mb-3 text-gray-700">
                            <i class="fas fa-heart mr-2 text-purple-500"></i>일상 스트레스 유형 *
                        </label>
                        <select name="daily_stress_category" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 transition">
                            <option value="">선택하세요</option>
                            <optgroup label="학생">
                                <option value="student_middle">중학생</option>
                                <option value="student_high">고등학생</option>
                                <option value="student_college">대학생</option>
                                <option value="student_graduate">대학원생</option>
                            </optgroup>
                            <optgroup label="구직자/취준생">
                                <option value="job_seeker_new">신규 졸업자</option>
                                <option value="job_seeker_career">경력 전환자</option>
                                <option value="job_seeker_long">장기 구직자</option>
                                <option value="job_seeker_exam">고시 준비자</option>
                            </optgroup>
                            <optgroup label="양육자">
                                <option value="caregiver_working_mom">워킹맘</option>
                                <option value="caregiver_working_dad">워킹대디</option>
                                <option value="caregiver_fulltime">전업 양육자</option>
                                <option value="caregiver_single">한부모</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
            `;
        } else if (signupData.subType === 'work') {
            // 직무 스트레스
            html = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold mb-2">직무 스트레스 업종 *</label>
                        <select name="work_industry" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                            <option value="">선택하세요</option>
                            <optgroup label="직장인 직무 스트레스">
                                <option value="it_developer">💻 IT·개발자 (장시간 코딩, 야근, 기술 변화 압박)</option>
                                <option value="design_planning">🎨 디자인·기획 (창의성 압박, 클라이언트 요구, 데드라인)</option>
                                <option value="education_teacher">👩‍🏫 교육·강사 (감정노동, 학생 관리, 평가 부담)</option>
                                <option value="medical_welfare">⚕️ 의료·복지 (생명 책임, 긴 근무시간, 감정노동)</option>
                                <option value="service_customer">🤝 서비스·고객응대 (고객 컴플레인, 반복 업무, 감정노동)</option>
                                <option value="manufacturing_production">🏭 제조·생산 (육체노동, 안전 압박, 야간근무)</option>
                                <option value="public_admin">🏛️ 공공·행정 (민원 대응, 규정 준수, 평가 압박)</option>
                                <option value="sales_marketing">📊 영업·마케팅 (실적 압박, 고객 관리, 경쟁 심화)</option>
                                <option value="research_tech">🔬 연구·기술 (논문 압박, 연구비 확보, 성과 증명)</option>
                            </optgroup>
                            <optgroup label="독립 직군">
                                <option value="independent_self_employed">🏪 자영업자 (매출 불안, 장시간 운영, 인력 관리)</option>
                                <option value="independent_freelancer">💼 프리랜서 (불규칙 수입, 고객 확보, 자기관리)</option>
                                <option value="independent_startup">🚀 창업자/스타트업 (자금 압박, 사업 불확실성, 경쟁)</option>
                                <option value="independent_creator">📹 크리에이터/인플루언서 (콘텐츠 제작 압박, 조회수, 수익 불안)</option>
                            </optgroup>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold mb-2">직종 (상세)</label>
                        <input type="text" name="work_position" placeholder="예: 백엔드 개발자, UX 디자이너" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                    </div>
                </div>
            `;
        }
    } else if (signupData.userType === 'B2B') {
        if (signupData.subType === 'perfumer') {
            // 조향사
            html = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold mb-2">공방/브랜드 이름</label>
                        <input type="text" name="b2b_shop_name" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold mb-2">협업 관심 분야 (복수선택)</label>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="제품개발" class="mr-2">
                                <span>제품 공동 개발</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="워크숍" class="mr-2">
                                <span>워크숍/클래스</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="유통" class="mr-2">
                                <span>제품 유통</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        } else if (signupData.subType === 'company') {
            // 기업
            html = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold mb-2">기업명 *</label>
                        <input type="text" name="b2b_company_name" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold mb-2">기업 규모 *</label>
                        <select name="b2b_company_size" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                            <option value="">선택하세요</option>
                            <option value="startup">스타트업 (50명 미만)</option>
                            <option value="small">중소기업 (50-300명)</option>
                            <option value="medium">중견기업 (300-1000명)</option>
                            <option value="large">대기업 (1000명 이상)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold mb-2">부서</label>
                        <input type="text" name="b2b_department" placeholder="예: 인사팀, 복리후생팀" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold mb-2">직책</label>
                        <input type="text" name="b2b_position" placeholder="예: 팀장, 담당자" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold mb-2">문의 유형 (복수선택)</label>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="대량납품" class="mr-2">
                                <span>대량 납품</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="기업클래스" class="mr-2">
                                <span>기업 단체 클래스</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="복리후생" class="mr-2">
                                <span>복리후생 프로그램</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="워크샵" class="mr-2">
                                <span>워크샵</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        } else if (signupData.subType === 'shop') {
            // 매장
            html = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold mb-2">매장명 *</label>
                        <input type="text" name="b2b_shop_name" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold mb-2">매장 유형</label>
                        <select name="b2b_shop_type" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                            <option value="">선택하세요</option>
                            <option value="향수숍">향수/향기 전문점</option>
                            <option value="라이프스타일">라이프스타일 편집샵</option>
                            <option value="카페">카페/음료점</option>
                            <option value="요가">요가/명상 센터</option>
                            <option value="기타">기타</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold mb-2">문의 유형 (복수선택)</label>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="제품입고" class="mr-2">
                                <span>제품 입고 문의</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="도매" class="mr-2">
                                <span>도매 거래</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="협업" class="mr-2">
                                <span>협업 제안</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        } else if (signupData.subType === 'independent') {
            // 독립 직군
            html = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold mb-2">독립 직군 유형 *</label>
                        <select name="b2b_independent_type" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                            <option value="">선택하세요</option>
                            <option value="self_employed">자영업자</option>
                            <option value="startup_founder">창업자/스타트업</option>
                            <option value="freelancer">프리랜서</option>
                            <option value="creator_influencer">크리에이터/인플루언서</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold mb-2">사업/활동 분야</label>
                        <input type="text" name="b2b_shop_type" placeholder="예: 콘텐츠 크리에이터, 웰니스 코치" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold mb-2">관심 분야 (복수선택)</label>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="제품협업" class="mr-2">
                                <span>제품 협업</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="홍보" class="mr-2">
                                <span>홍보/마케팅</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="b2b_inquiry" value="워크숍" class="mr-2">
                                <span>워크숍/클래스</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
}

// 회원가입 제출
async function submitSignup() {
    // Step 3 데이터 수집
    const detailContainer = document.getElementById('detail-form-container');
    const inputs = detailContainer.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox' && input.checked) {
            if (!signupData.b2b_inquiry_type) signupData.b2b_inquiry_type = [];
            signupData.b2b_inquiry_type.push(input.value);
        } else if (input.type !== 'checkbox') {
            signupData[input.name] = input.value;
        }
    });
    
    // b2b_inquiry_type을 JSON 문자열로 변환
    if (signupData.b2b_inquiry_type) {
        signupData.b2b_inquiry_type = JSON.stringify(signupData.b2b_inquiry_type);
    }
    
    // symptoms를 JSON 문자열로 변환
    if (signupData.symptoms) {
        signupData.symptoms = JSON.stringify(signupData.symptoms);
    }
    
    // 사용자 유형 설정 (새 스키마에 맞게 수정)
    signupData.user_type = signupData.userType;
    
    if (signupData.userType === 'B2C') {
        signupData.b2c_category = signupData.subType; // 'daily' or 'work'
        // daily_stress_category 또는 work_industry가 b2c_subcategory가 됨
        if (signupData.subType === 'daily') {
            signupData.b2c_subcategory = signupData.daily_stress_category;
        } else if (signupData.subType === 'work') {
            signupData.b2c_subcategory = signupData.work_industry;
        }
        signupData.b2b_category = null;
    } else if (signupData.userType === 'B2B') {
        signupData.b2b_category = signupData.subType; // 'perfumer', 'company', 'shop', 'independent'
        signupData.b2c_category = null;
        signupData.b2c_subcategory = null;
    }
    
    console.log('회원가입 데이터:', signupData);
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('회원가입이 완료되었습니다!');
            // 토큰 저장
            if (result.token) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
            }
            // 대시보드로 이동
            window.location.href = '/dashboard';
        } else {
            alert(result.error || '회원가입에 실패했습니다.');
        }
    } catch (error) {
        console.error('회원가입 오류:', error);
        alert('회원가입 중 오류가 발생했습니다.');
    }
}

// 페이지 로드 시 URL 파라미터 확인
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const sub = params.get('sub');
    
    if (type && sub) {
        const radio = document.querySelector(`input[name="user_type"][value="${type}_${sub}"]`);
        if (radio) {
            radio.checked = true;
            selectUserType(type);
        }
    }
});
