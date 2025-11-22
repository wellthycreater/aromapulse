# 원데이 클래스 vs 워크샵 구분 정리

## 📋 서비스 구분

### 🎨 원데이 클래스 (One-Day Class)
**타겟 고객**: 개인 또는 소규모 그룹

#### 강사 구성
- ✅ **조향사만 필수** (변경 불가)
- ❌ 심리상담사/멘탈케어 전문가 선택 불가

#### 추가 옵션
- ✅ **선물 포장 서비스**
  - 체크박스 선택 옵션
  - 추가 비용 발생
  - 만든 향수를 고급 선물 포장으로 완성
- ❌ 향기 테마 워케이션 없음

#### 신청 방식
- 개인 신청 / 기업/단체 신청 선택 가능
- 1명부터 인원 제한 없이 신청 가능
- 희망 날짜 조율 가능

---

### 🏢 워크샵 (Workshop)
**타겟 고객**: 기업/단체 (20인 이상)

#### 강사 구성 (선택 가능)
1. **조향사만 (필수)**
   - 기본 옵션
   - 향기 제조 및 아로마 전문가

2. **조향사 + 심리상담사 (추천)**
   - 조향사 + 심리 상담 전문가
   - 직원 정서 케어 포함

3. **조향사 + 멘탈케어 전문가**
   - 조향사 + 멘탈 헬스 전문가
   - 스트레스 관리 및 힐링

#### 추가 옵션
- ✅ **향기 테마 워케이션**
  - 체크박스 선택 옵션
  - 힐링 여행과 함께하는 특별한 워크샵
  - 팀 빌딩 + 휴식 + 아로마 테라피
- ❌ 선물 포장 서비스 없음

#### 신청 자격
- B2B 기업 고객만 가능
- 20인 이상 규모 기업
- HR팀, 조직문화팀, 복리후생 담당자만 신청 가능

---

## 🔧 기술 구현

### HTML 구분

#### 원데이 클래스 (`class-detail.html`)
```html
<!-- 조향사만 (선택 불가) -->
<div class="bg-white rounded-xl p-4 shadow-sm">
    <label class="block text-sm font-bold text-gray-800 mb-3">
        <i class="fas fa-chalkboard-teacher text-purple-600 mr-2"></i>강사 초빙
    </label>
    <div class="flex items-center p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border-2 border-pink-300">
        <div class="flex-1">
            <div class="font-bold text-gray-900 flex items-center">
                <i class="fas fa-flask text-pink-600 mr-2"></i>
                조향사
                <span class="ml-2 text-xs bg-pink-600 text-white px-2 py-1 rounded-full">필수</span>
            </div>
            <div class="text-xs text-gray-600 mt-1">향기 제조 및 아로마 전문가</div>
        </div>
        <!-- 인원 조절 버튼 -->
    </div>
</div>

<!-- 선물 포장 옵션 -->
<div class="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-4 shadow-sm">
    <label class="flex items-start cursor-pointer">
        <input type="checkbox" id="gift-wrapping" class="w-5 h-5 text-purple-600 rounded mt-1 mr-3">
        <div class="flex-1">
            <div class="font-bold text-gray-900 mb-1">
                <i class="fas fa-gift text-purple-600 mr-2"></i>선물용 포장 서비스
            </div>
            <div class="text-sm text-gray-700">
                만든 향수를 고급 선물 포장으로 완성해드려요 🎁
            </div>
            <div class="text-xs text-purple-600 mt-1 font-semibold">
                추가 비용이 발생할 수 있습니다
            </div>
        </div>
    </label>
</div>
```

#### 워크샵 (`workshop-detail.html`)
```html
<!-- 강사 선택 드롭다운 -->
<select id="instructor-type" class="..." onchange="updateInstructorFields()">
    <option value="perfumer">조향사만 (필수)</option>
    <option value="both">조향사 + 심리상담사 (추천)</option>
    <option value="perfumer_psychologist">조향사 + 멘탈케어 전문가</option>
</select>

<!-- 조향사 섹션 (항상 표시) -->
<div id="perfumer-section" class="...">
    <!-- 조향사 인원 조절 -->
</div>

<!-- 심리상담사 섹션 (조건부 표시) -->
<div id="psychologist-section" class="..." style="display: none;">
    <!-- 심리상담사 인원 조절 -->
</div>

<!-- 워케이션 옵션 -->
<div class="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-4 shadow-sm">
    <label class="flex items-start cursor-pointer">
        <input type="checkbox" id="workation" class="w-5 h-5 text-purple-600 rounded mt-1 mr-3">
        <div class="flex-1">
            <div class="font-bold text-gray-900 mb-1">
                <i class="fas fa-mountain-sun text-purple-600 mr-2"></i>향기 테마 워케이션 포함
            </div>
            <div class="text-sm text-gray-700">
                힐링 여행과 함께하는 특별한 워크샵 ✨
            </div>
        </div>
    </label>
</div>
```

### JavaScript 구분 (`workshop-detail.js`)

```javascript
// 강사 타입 처리 (조건부)
const instructorTypeEl = document.getElementById('instructor-type');
const instructorType = instructorTypeEl ? instructorTypeEl.value : 'perfumer';

// 원데이 클래스: instructorTypeEl이 null → 'perfumer'만 사용
// 워크샵: instructorTypeEl이 존재 → 드롭다운 값 사용

// 심리상담사 추가 (워크샵만)
if (instructorTypeEl && (instructorType === 'both' || instructorType === 'perfumer_psychologist')) {
    const psychologistCount = parseInt(document.getElementById('psychologist-count').value) || 0;
    if (psychologistCount > 0) {
        requestedInstructors.push({...});
    }
}

// 옵션 체크
const workationEl = document.getElementById('workation');
const giftWrappingEl = document.getElementById('gift-wrapping');
const isWorkation = workationEl ? workationEl.checked : false;
const isGiftWrapping = giftWrappingEl ? giftWrappingEl.checked : false;

// 견적 데이터
const quoteData = {
    // ... 기본 정보 ...
    is_workation: isWorkation ? 1 : 0,
    is_gift_wrapping: isGiftWrapping ? 1 : 0
};
```

---

## 📊 데이터베이스 구조

### workshop_quotes 테이블
```sql
CREATE TABLE workshop_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workshop_id INTEGER NOT NULL,
    
    -- 기본 정보
    company_name TEXT,
    company_industry TEXT,
    company_department TEXT,
    company_contact_position TEXT,
    company_contact_name TEXT NOT NULL,
    company_contact_phone TEXT NOT NULL,
    company_contact_email TEXT NOT NULL,
    
    -- 참여 정보
    participant_count INTEGER NOT NULL,
    preferred_date TEXT,
    
    -- 강사 요청 (JSON)
    requested_instructors TEXT,
    
    -- 특별 요청
    special_requests TEXT,
    
    -- 옵션
    is_workation INTEGER DEFAULT 0,      -- 워크샵용
    is_gift_wrapping INTEGER DEFAULT 0,  -- 원데이 클래스용
    
    -- 상태 관리
    status TEXT DEFAULT 'pending',
    quoted_price INTEGER,
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (workshop_id) REFERENCES workshops(id)
);
```

### requested_instructors JSON 구조
```json
[
    {
        "type": "perfumer",
        "count": 2,
        "specialization": "조향사"
    },
    {
        "type": "psychologist",
        "count": 1,
        "specialization": "심리상담사"
    }
]
```

---

## 🎯 사용자 시나리오

### 원데이 클래스 신청
1. 사용자가 원데이 클래스 페이지 접속
2. **조향사만 표시** (변경 불가)
3. 조향사 인원 조절 (1~10명)
4. **선물 포장 서비스** 체크박스 선택
5. 참가 인원, 날짜, 특별 요청 입력
6. 견적 문의 제출
7. `is_gift_wrapping=1`, `is_workation=0` 저장

### 워크샵 신청
1. 사용자가 워크샵 페이지 접속
2. **강사 타입 선택** (조향사만 / +심리상담사 / +멘탈케어)
3. 각 강사 인원 조절
4. **향기 테마 워케이션** 체크박스 선택
5. 기업 정보, 참가 인원, 날짜, 특별 요청 입력
6. 견적 문의 제출 (B2B 권한 체크)
7. `is_workation=1`, `is_gift_wrapping=0` 저장

---

## ✅ 체크리스트

### 원데이 클래스
- [x] 조향사만 고정 (선택 불가)
- [x] 선물 포장 서비스 옵션 추가
- [x] 향기 테마 워케이션 제거
- [x] JavaScript 조건부 처리
- [x] 데이터베이스 컬럼 추가 (`is_gift_wrapping`)

### 워크샵
- [x] 조향사 + 추가 강사 선택 가능
- [x] 향기 테마 워케이션 옵션 유지
- [x] 선물 포장 서비스 없음
- [x] B2B 권한 체크 유지
- [x] 20인 이상 기업 체크

---

## 📄 관련 파일

### 프론트엔드
- `/home/user/webapp/public/static/class-detail.html` - 원데이 클래스 페이지
- `/home/user/webapp/public/static/workshop-detail.html` - 워크샵 페이지
- `/home/user/webapp/public/static/workshop-detail.js` - 공통 JavaScript (조건부 처리)

### 백엔드
- `/home/user/webapp/src/routes/workshops.ts` - 워크샵 API
- `/home/user/webapp/migrations/` - 데이터베이스 마이그레이션

---

## 🎉 최종 결과

### 원데이 클래스
✅ 조향사만 필수 (고정)  
✅ 선물 포장 서비스 옵션  
✅ 개인/단체 모두 신청 가능  
✅ 1명부터 무제한 인원

### 워크샵
✅ 조향사 + 추가 전문가 선택  
✅ 향기 테마 워케이션 옵션  
✅ B2B 기업만 신청 가능  
✅ 20인 이상 규모 제한

**두 서비스가 명확하게 구분되었습니다! 🚀**

---

**작성일**: 2025-11-21  
**Git 커밋**: 7660c94 "Separate class and workshop features properly"  
**상태**: ✅ 완료
