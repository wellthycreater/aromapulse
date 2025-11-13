// 회원가입 폼 상태 관리
let currentStep = 1;
const maxSteps = 4;
const formData = {
    userType: '',
    subType: '',
    detailType: ''
};

// Step 이동
function updateProgress() {
    document.getElementById('current-step').textContent = currentStep;
    document.getElementById('progress-bar').style.width = `${(currentStep / maxSteps) * 100}%`;
    
    // Step 제목 업데이트
    const titles = {
        1: '회원 유형 선택',
        2: '세부 유형 선택',
        3: '상세 정보 입력',
        4: '기본 정보 입력'
    };
    document.getElementById('step-title').textContent = titles[currentStep];
    
    // 모든 Step 숨기기
    for (let i = 1; i <= maxSteps; i++) {
        document.getElementById(`step-${i}`).classList.remove('step-active');
        document.getElementById(`step-${i}`).classList.add('step-hidden');
    }
    
    // 현재 Step 표시
    document.getElementById(`step-${currentStep}`).classList.remove('step-hidden');
    document.getElementById(`step-${currentStep}`).classList.add('step-active');
}

function nextStep() {
    if (currentStep < maxSteps) {
        currentStep++;
        updateProgress();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateProgress();
    }
}

// Step 1: 회원 유형 선택
function selectUserType(type) {
    formData.userType = type;
    
    // Step 2의 내용 표시
    document.getElementById('step-2-b2c').classList.add('step-hidden');
    document.getElementById('step-2-b2b').classList.add('step-hidden');
    
    if (type === 'B2C') {
        document.getElementById('step-2-b2c').classList.remove('step-hidden');
    } else {
        document.getElementById('step-2-b2b').classList.remove('step-hidden');
    }
    
    nextStep();
}

// Step 2: B2C 스트레스 유형 선택
function selectStressType(type) {
    formData.subType = type;
    
    // Step 3 내용 생성
    if (type === 'work') {
        renderWorkStressForm();
    } else {
        renderDailyStressForm();
    }
    
    nextStep();
}

// Step 2: B2B 비즈니스 유형 선택
function selectBusinessType(type) {
    formData.subType = type;
    
    // Step 3 내용 생성
    if (type === 'perfumer') {
        renderPerfumerForm();
    } else if (type === 'company') {
        renderCompanyForm();
    } else if (type === 'shop') {
        renderShopForm();
    } else if (type === 'independent') {
        renderIndependentForm();
    }
    
    nextStep();
}

// B2C 직무 스트레스 폼
function renderWorkStressForm() {
    const content = document.getElementById('step-3-content');
    content.innerHTML = `
        <div>
            <label class="block text-sm font-medium mb-2">업종 *</label>
            <select name="work_industry" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">선택하세요</option>
                <option value="it_developer">IT 개발자</option>
                <option value="design_planning">디자인 기획</option>
                <option value="education_teacher">교육 강사</option>
                <option value="medical_welfare">의료 복지</option>
                <option value="service_customer">서비스 고객 응대</option>
                <option value="manufacturing_production">제조 생산</option>
                <option value="public_admin">공공 행정</option>
                <option value="sales_marketing">영업 마케팅</option>
                <option value="research_tech">연구 기술</option>
            </select>
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">직종 (상세)</label>
            <input type="text" name="work_position" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="예: 프론트엔드 개발자">
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">연령대 *</label>
            <select name="age_group" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">선택하세요</option>
                <option value="10s">10대</option>
                <option value="20s">20대</option>
                <option value="30s">30대</option>
                <option value="40s">40대</option>
                <option value="50s">50대</option>
                <option value="60s_plus">60대 이상</option>
            </select>
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">성별 *</label>
            <select name="gender" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
            </select>
        </div>
    `;
}

// B2C 일상 스트레스 폼
function renderDailyStressForm() {
    const content = document.getElementById('step-3-content');
    content.innerHTML = `
        <div>
            <label class="block text-sm font-medium mb-2">카테고리 *</label>
            <select name="daily_stress_category" required class="w-full px-4 py-2 border border-gray-300 rounded-lg" onchange="updateDailyForm(this.value)">
                <option value="">선택하세요</option>
                <optgroup label="학생">
                    <option value="student_high">고등학생</option>
                    <option value="student_college">대학생</option>
                    <option value="student_graduate">대학원생</option>
                </optgroup>
                <optgroup label="구직자">
                    <option value="job_seeker_exam">고시 준비생</option>
                    <option value="job_seeker_new">신규 졸업자</option>
                    <option value="job_seeker_career">경력 전환 희망자</option>
                    <option value="job_seeker_parttime">파트타임 구직자</option>
                    <option value="job_seeker_short">단기 구직자</option>
                    <option value="job_seeker_long">장기 구직자</option>
                </optgroup>
                <optgroup label="양육자">
                    <option value="caregiver_working_mom">워킹맘</option>
                    <option value="caregiver_working_dad">워킹대디</option>
                    <option value="caregiver_fulltime">전업 양육자</option>
                    <option value="caregiver_single">한부모</option>
                </optgroup>
            </select>
        </div>
        <div id="daily-extra-fields"></div>
        <div>
            <label class="block text-sm font-medium mb-2">연령대 *</label>
            <select name="age_group" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">선택하세요</option>
                <option value="10s">10대</option>
                <option value="20s">20대</option>
                <option value="30s">30대</option>
                <option value="40s">40대</option>
                <option value="50s">50대</option>
                <option value="60s_plus">60대 이상</option>
            </select>
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">성별 *</label>
            <select name="gender" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
            </select>
        </div>
    `;
}

// B2B 조향사 폼
function renderPerfumerForm() {
    const content = document.getElementById('step-3-content');
    content.innerHTML = `
        <div>
            <label class="block text-sm font-medium mb-2">브랜드/공방명</label>
            <input type="text" name="b2b_shop_name" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">제휴 문의 내용</label>
            <textarea name="b2b_inquiry_note" rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="제휴하고 싶은 내용을 입력해주세요"></textarea>
        </div>
    `;
}

// B2B 기업 폼
function renderCompanyForm() {
    const content = document.getElementById('step-3-content');
    content.innerHTML = `
        <div>
            <label class="block text-sm font-medium mb-2">회사명 *</label>
            <input type="text" name="b2b_company_name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">기업 규모 *</label>
            <select name="b2b_company_size" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">선택하세요</option>
                <option value="startup">스타트업 (1-50인)</option>
                <option value="small">중소기업 (51-300인)</option>
                <option value="medium">중견기업 (301-1000인)</option>
                <option value="large">대기업 (1000인 이상)</option>
            </select>
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">부서</label>
            <input type="text" name="b2b_department" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="예: 인사팀, 복리후생팀">
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">직책</label>
            <input type="text" name="b2b_position" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="예: 팀장, 담당자">
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">문의 유형 (복수 선택)</label>
            <div class="space-y-2">
                <label class="flex items-center">
                    <input type="checkbox" name="b2b_inquiry_type" value="cooperation" class="mr-2">
                    <span>협업</span>
                </label>
                <label class="flex items-center">
                    <input type="checkbox" name="b2b_inquiry_type" value="bulk_order" class="mr-2">
                    <span>대량 납품</span>
                </label>
                <label class="flex items-center">
                    <input type="checkbox" name="b2b_inquiry_type" value="corporate_class" class="mr-2">
                    <span>기업 단체 클래스</span>
                </label>
                <label class="flex items-center">
                    <input type="checkbox" name="b2b_inquiry_type" value="workshop" class="mr-2">
                    <span>워크샵</span>
                </label>
                <label class="flex items-center">
                    <input type="checkbox" name="b2b_inquiry_type" value="welfare" class="mr-2">
                    <span>복리후생</span>
                </label>
            </div>
        </div>
    `;
}

// B2B 매장 폼
function renderShopForm() {
    const content = document.getElementById('step-3-content');
    content.innerHTML = `
        <div>
            <label class="block text-sm font-medium mb-2">매장명 *</label>
            <input type="text" name="b2b_shop_name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">매장 유형</label>
            <input type="text" name="b2b_shop_type" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="예: 아로마샵, 뷰티샵, 라이프스타일샵">
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">문의 내용</label>
            <textarea name="b2b_inquiry_note" rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="제품 문의 내용을 입력해주세요"></textarea>
        </div>
    `;
}

// B2B 독립 직군 폼
function renderIndependentForm() {
    const content = document.getElementById('step-3-content');
    content.innerHTML = `
        <div>
            <label class="block text-sm font-medium mb-2">독립 직군 유형 *</label>
            <select name="b2b_independent_type" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">선택하세요</option>
                <option value="self_employed">자영업자</option>
                <option value="startup_founder">창업자, 스타트업</option>
                <option value="freelancer">프리랜서</option>
                <option value="creator_influencer">크리에이터, 인플루언서</option>
            </select>
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">사업 분야</label>
            <input type="text" name="b2b_business_field" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="예: 온라인 마케팅, 콘텐츠 제작">
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">문의 내용</label>
            <textarea name="b2b_inquiry_note" rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="문의 내용을 입력해주세요"></textarea>
        </div>
    `;
}

// 폼 제출
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const formDataObj = new FormData(form);
    
    // 비밀번호 확인
    const password = formDataObj.get('password');
    const passwordConfirm = formDataObj.get('password_confirm');
    
    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    // JSON 데이터 구성
    const data = {
        email: formDataObj.get('email'),
        password: password,
        name: formDataObj.get('name'),
        phone: formDataObj.get('phone'),
        region: formDataObj.get('region'),
        user_type: formData.userType,
        b2c_stress_type: formData.userType === 'B2C' ? formData.subType : null,
        b2b_business_type: formData.userType === 'B2B' ? formData.subType : null,
        symptoms: Array.from(formDataObj.getAll('symptoms')),
    };
    
    // B2C 직무 스트레스
    if (formData.userType === 'B2C' && formData.subType === 'work') {
        data.work_industry = formDataObj.get('work_industry');
        data.work_position = formDataObj.get('work_position');
        data.age_group = formDataObj.get('age_group');
        data.gender = formDataObj.get('gender');
    }
    
    // B2C 일상 스트레스
    if (formData.userType === 'B2C' && formData.subType === 'daily') {
        data.daily_stress_category = formDataObj.get('daily_stress_category');
        data.age_group = formDataObj.get('age_group');
        data.gender = formDataObj.get('gender');
    }
    
    // B2B
    if (formData.userType === 'B2B') {
        if (formData.subType === 'company') {
            data.b2b_company_name = formDataObj.get('b2b_company_name');
            data.b2b_company_size = formDataObj.get('b2b_company_size');
            data.b2b_department = formDataObj.get('b2b_department');
            data.b2b_position = formDataObj.get('b2b_position');
            data.b2b_inquiry_type = Array.from(formDataObj.getAll('b2b_inquiry_type'));
        } else if (formData.subType === 'shop') {
            data.b2b_shop_name = formDataObj.get('b2b_shop_name');
            data.b2b_shop_type = formDataObj.get('b2b_shop_type');
        } else if (formData.subType === 'independent') {
            data.b2b_independent_type = formDataObj.get('b2b_independent_type');
        } else if (formData.subType === 'perfumer') {
            data.b2b_shop_name = formDataObj.get('b2b_shop_name');
        }
    }
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('회원가입이 완료되었습니다!');
            window.location.href = '/login';
        } else {
            alert(result.error || '회원가입에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('서버 오류가 발생했습니다.');
    }
});
