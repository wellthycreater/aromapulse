// 현재 사용자 정보
let currentUser = null;

// 페이지 로드 시 사용자 정보 불러오기
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
        return;
    }
    
    currentUser = JSON.parse(userStr);
    await loadUserProfile();
});

// 사용자 프로필 로드
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const user = response.data.user;
        currentUser = user;
        
        // 사용자 유형 배지 설정
        const badge = document.getElementById('user-type-badge');
        if (user.user_type === 'B2C') {
            badge.textContent = 'B2C 개인고객';
            badge.classList.add('bg-purple-100', 'text-purple-700');
            document.getElementById('b2c-section').style.display = 'block';
        } else if (user.user_type === 'B2B') {
            badge.textContent = 'B2B 비즈니스';
            badge.classList.add('bg-blue-100', 'text-blue-700');
            document.getElementById('b2b-section').style.display = 'block';
        }
        
        // 기본 정보 채우기
        document.getElementById('name').value = user.name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('region').value = user.region || '';
        document.getElementById('age_group').value = user.age_group || '';
        
        // 성별 설정
        if (user.gender) {
            if (user.gender === '남성') {
                document.getElementById('gender-male').checked = true;
            } else if (user.gender === '여성') {
                document.getElementById('gender-female').checked = true;
            } else {
                document.getElementById('gender-other').checked = true;
            }
        }
        
        // B2C 정보 채우기
        if (user.user_type === 'B2C') {
            document.getElementById('b2c_category').value = user.b2c_category || '';
            
            // 카테고리 변경 이벤트 트리거
            handleB2CCategoryChange();
            
            // 세부 카테고리 설정
            if (user.b2c_category === 'daily_stress') {
                document.getElementById('b2c_subcategory_daily').value = user.b2c_subcategory || '';
            } else if (user.b2c_category === 'work_stress') {
                document.getElementById('b2c_subcategory_work').value = user.b2c_subcategory || '';
            }
        }
        
        // B2B 정보 채우기
        if (user.user_type === 'B2B') {
            document.getElementById('b2b_category').value = user.b2b_category || '';
            
            // 카테고리 변경 이벤트 트리거
            handleB2BCategoryChange();
            
            // 공통 B2B 정보
            document.getElementById('b2b_business_number').value = user.b2b_business_number || '';
            document.getElementById('b2b_address').value = user.b2b_address || '';
            
            // 각 카테고리별 정보 채우기
            if (user.b2b_category === 'perfumer') {
                document.getElementById('perfumer_business_name').value = user.b2b_business_name || '';
                // 체크박스는 b2b_inquiry_type에서 파싱 필요
                if (user.b2b_inquiry_type) {
                    try {
                        const inquiries = JSON.parse(user.b2b_inquiry_type);
                        document.querySelectorAll('input[name="perfumer_inquiry"]').forEach(cb => {
                            if (inquiries.includes(cb.value)) {
                                cb.checked = true;
                            }
                        });
                    } catch (e) {}
                }
            } else if (user.b2b_category === 'company') {
                document.getElementById('company_business_name').value = user.b2b_business_name || '';
                document.getElementById('b2b_company_size').value = user.b2b_company_size || '';
                document.getElementById('b2b_department').value = user.b2b_department || '';
                document.getElementById('b2b_position').value = user.b2b_position || '';
                if (user.b2b_inquiry_type) {
                    try {
                        const inquiries = JSON.parse(user.b2b_inquiry_type);
                        document.querySelectorAll('input[name="company_inquiry"]').forEach(cb => {
                            if (inquiries.includes(cb.value)) {
                                cb.checked = true;
                            }
                        });
                    } catch (e) {}
                }
            } else if (user.b2b_category === 'shop') {
                document.getElementById('shop_business_name').value = user.b2b_business_name || '';
                document.getElementById('b2b_business_type').value = user.b2b_business_type || '';
                if (user.b2b_inquiry_type) {
                    try {
                        const inquiries = JSON.parse(user.b2b_inquiry_type);
                        document.querySelectorAll('input[name="shop_inquiry"]').forEach(cb => {
                            if (inquiries.includes(cb.value)) {
                                cb.checked = true;
                            }
                        });
                    } catch (e) {}
                }
            } else if (user.b2b_category === 'independent') {
                document.getElementById('b2b_independent_type').value = user.b2b_independent_type || '';
                document.getElementById('independent_business_name').value = user.b2b_business_name || '';
                document.getElementById('independent_business_type').value = user.b2b_business_type || '';
                if (user.b2b_inquiry_type) {
                    try {
                        const inquiries = JSON.parse(user.b2b_inquiry_type);
                        document.querySelectorAll('input[name="independent_inquiry"]').forEach(cb => {
                            if (inquiries.includes(cb.value)) {
                                cb.checked = true;
                            }
                        });
                    } catch (e) {}
                }
            }
        }
        
    } catch (error) {
        console.error('프로필 로드 실패:', error);
        alert('프로필을 불러오는데 실패했습니다.');
    }
}

// B2C 카테고리 변경 핸들러
document.getElementById('b2c_category')?.addEventListener('change', handleB2CCategoryChange);

function handleB2CCategoryChange() {
    const category = document.getElementById('b2c_category').value;
    
    document.getElementById('daily-stress-fields').style.display = 'none';
    document.getElementById('work-stress-fields').style.display = 'none';
    
    if (category === 'daily_stress') {
        document.getElementById('daily-stress-fields').style.display = 'block';
    } else if (category === 'work_stress') {
        document.getElementById('work-stress-fields').style.display = 'block';
    }
}

// B2B 카테고리 변경 핸들러
document.getElementById('b2b_category')?.addEventListener('change', handleB2BCategoryChange);

function handleB2BCategoryChange() {
    const category = document.getElementById('b2b_category').value;
    
    // 모든 카테고리별 필드 숨기기
    document.getElementById('perfumer-fields').style.display = 'none';
    document.getElementById('company-fields').style.display = 'none';
    document.getElementById('shop-fields').style.display = 'none';
    document.getElementById('independent-fields').style.display = 'none';
    
    // 선택된 카테고리 필드 표시
    if (category === 'perfumer') {
        document.getElementById('perfumer-fields').style.display = 'block';
    } else if (category === 'company') {
        document.getElementById('company-fields').style.display = 'block';
    } else if (category === 'shop') {
        document.getElementById('shop-fields').style.display = 'block';
    } else if (category === 'independent') {
        document.getElementById('independent-fields').style.display = 'block';
    }
}

// 프로필 저장
async function saveProfile() {
    try {
        const token = localStorage.getItem('token');
        
        // 기본 정보 수집
        const profileData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            region: document.getElementById('region').value,
            age_group: document.getElementById('age_group').value,
            gender: document.querySelector('input[name="gender"]:checked')?.value || null
        };
        
        // B2C 정보 수집
        if (currentUser.user_type === 'B2C') {
            profileData.b2c_category = document.getElementById('b2c_category').value;
            
            if (profileData.b2c_category === 'daily_stress') {
                profileData.b2c_subcategory = document.getElementById('b2c_subcategory_daily').value;
            } else if (profileData.b2c_category === 'work_stress') {
                profileData.b2c_subcategory = document.getElementById('b2c_subcategory_work').value;
            }
        }
        
        // B2B 정보 수집
        if (currentUser.user_type === 'B2B') {
            profileData.b2b_category = document.getElementById('b2b_category').value;
            profileData.b2b_business_number = document.getElementById('b2b_business_number').value;
            profileData.b2b_address = document.getElementById('b2b_address').value;
            
            // 카테고리별 정보 수집
            if (profileData.b2b_category === 'perfumer') {
                profileData.b2b_business_name = document.getElementById('perfumer_business_name').value;
                
                const inquiries = [];
                document.querySelectorAll('input[name="perfumer_inquiry"]:checked').forEach(cb => {
                    inquiries.push(cb.value);
                });
                profileData.b2b_inquiry_type = JSON.stringify(inquiries);
                
            } else if (profileData.b2b_category === 'company') {
                profileData.b2b_business_name = document.getElementById('company_business_name').value;
                profileData.b2b_company_size = document.getElementById('b2b_company_size').value;
                profileData.b2b_department = document.getElementById('b2b_department').value;
                profileData.b2b_position = document.getElementById('b2b_position').value;
                
                const inquiries = [];
                document.querySelectorAll('input[name="company_inquiry"]:checked').forEach(cb => {
                    inquiries.push(cb.value);
                });
                profileData.b2b_inquiry_type = JSON.stringify(inquiries);
                
            } else if (profileData.b2b_category === 'shop') {
                profileData.b2b_business_name = document.getElementById('shop_business_name').value;
                profileData.b2b_business_type = document.getElementById('b2b_business_type').value;
                
                const inquiries = [];
                document.querySelectorAll('input[name="shop_inquiry"]:checked').forEach(cb => {
                    inquiries.push(cb.value);
                });
                profileData.b2b_inquiry_type = JSON.stringify(inquiries);
                
            } else if (profileData.b2b_category === 'independent') {
                profileData.b2b_independent_type = document.getElementById('b2b_independent_type').value;
                profileData.b2b_business_name = document.getElementById('independent_business_name').value;
                profileData.b2b_business_type = document.getElementById('independent_business_type').value;
                
                const inquiries = [];
                document.querySelectorAll('input[name="independent_inquiry"]:checked').forEach(cb => {
                    inquiries.push(cb.value);
                });
                profileData.b2b_inquiry_type = JSON.stringify(inquiries);
            }
        }
        
        // API 호출
        const response = await axios.put('/api/user/profile', profileData, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // localStorage의 user 정보 업데이트
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        alert('프로필이 성공적으로 저장되었습니다!');
        window.location.href = '/dashboard';
        
    } catch (error) {
        console.error('프로필 저장 실패:', error);
        alert(error.response?.data?.error || '프로필 저장에 실패했습니다.');
    }
}

// 비밀번호 변경
async function changePassword() {
    const currentPassword = document.getElementById('current_password').value;
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('new_password_confirm').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('모든 비밀번호 필드를 입력해주세요.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('새 비밀번호가 일치하지 않습니다.');
        return;
    }
    
    if (newPassword.length < 8) {
        alert('새 비밀번호는 8자 이상이어야 합니다.');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        await axios.put('/api/user/change-password', {
            current_password: currentPassword,
            new_password: newPassword
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        alert('비밀번호가 성공적으로 변경되었습니다!');
        
        // 비밀번호 필드 초기화
        document.getElementById('current_password').value = '';
        document.getElementById('new_password').value = '';
        document.getElementById('new_password_confirm').value = '';
        
    } catch (error) {
        console.error('비밀번호 변경 실패:', error);
        alert(error.response?.data?.error || '비밀번호 변경에 실패했습니다.');
    }
}
