# AromaPulse - SNS & O2O Analytics 프로덕션 배포 가이드

## 🚀 배포 준비 완료

SNS 채널 추적 및 온라인→오프라인(O2O) 전환율 분석 기능이 완성되었습니다.

---

## 📊 구현된 기능

### 1. SNS 채널 유입 추적
- **블로그**, **인스타그램**, **유튜브** 3개 채널 방문자 추적
- 일별 방문자 수, 고유 방문자 수, 클릭 수 기록
- 채널별 CTR(클릭률) 계산 및 비교

### 2. O2O 전환 분석
- 온라인 유입 → 오프라인 공방 전환 추적
- **공방 위치별** 전환 통계 (강남, 홍대, 이태원, 성수, 연남, 삼청동 등)
- **전환 유형별** 통계 (워크샵 예약, 클래스 예약, 상담, 방문)
- **SNS 채널별** 전환율 및 매출 비교

### 3. 대시보드 시각화
- **SNS 채널별 유입**: 바 차트 (방문자 vs 클릭 수)
- **SNS 클릭률 (CTR)**: 도넛 차트 (채널별 비교)
- **일별 SNS 추이**: 라인 차트 (30일간 트렌드)
- **공방별 O2O 전환**: 가로 바 차트 (전환 수 및 매출)
- **SNS별 O2O 전환율**: 이중 축 바 차트 (전환 수 + 매출)

---

## 🗄️ 데이터베이스 변경사항

### 새로운 테이블
1. **`sns_visits`**: SNS 채널 방문 기록 (일별)
2. **`o2o_conversions`**: 온라인→오프라인 전환 기록

### 사용자 테이블 추가 컬럼
- **`referral_source`**: 사용자 유입 경로 (blog, instagram, youtube, direct 등)

### 샘플 데이터
- **SNS 방문 데이터**: 최근 30일, 3개 채널, 총 10,085 방문
- **O2O 전환 데이터**: 29건의 전환, 6개 공방 위치, 4가지 전환 유형

---

## 📝 프로덕션 배포 단계

### ⚠️ 사전 준비: Cloudflare API 키 설정

프로덕션 배포 전에 **반드시** Cloudflare API 키를 설정해야 합니다:

1. **Deploy 탭**으로 이동
2. Cloudflare 대시보드에서 API 토큰 생성:
   - **Account** > **API Tokens** 메뉴
   - **Create Token** 클릭
   - **Edit Cloudflare Workers** 템플릿 선택
   - Permissions 설정:
     - Account > Cloudflare Pages: Edit
     - Account > D1: Edit
   - **Continue to summary** → **Create Token**
3. 생성된 토큰을 복사하여 Deploy 탭에 저장

---

### 1단계: 프로덕션 데이터베이스 마이그레이션 적용

```bash
# 마이그레이션 적용 (2개의 마이그레이션 파일)
npx wrangler d1 migrations apply aromapulse-production --remote

# 적용되는 마이그레이션:
# - 0024_add_referral_tracking.sql (referral_source 컬럼 추가)
# - 0024_add_sns_tracking.sql (sns_visits, o2o_conversions 테이블 생성)
```

### 2단계: 샘플 데이터 삽입 (프로덕션)

```bash
# SNS 및 O2O 샘플 데이터 삽입
npx wrangler d1 execute aromapulse-production --remote --file=./seed_sns_and_o2o_data.sql

# 삽입되는 데이터:
# - sns_visits: 45건 (블로그 15일 + 인스타 15일 + 유튜브 15일)
# - o2o_conversions: 29건 (블로그 8건 + 인스타 10건 + 유튜브 6건 + 기타 5건)
# - users.referral_source 업데이트: 29명의 기존 사용자
```

### 3단계: 프로덕션 배포

```bash
# 프로젝트 빌드
npm run build

# Cloudflare Pages에 배포
npx wrangler pages deploy dist --project-name aromapulse

# 배포 완료 후 접속 URL:
# https://www.aromapulse.kr/static/admin-dashboard
```

---

## ✅ 배포 확인

배포 후 관리자 대시보드에서 다음 사항을 확인하세요:

### 1. SNS 유입 차트
- [ ] "SNS 채널별 유입" 바 차트에 블로그/인스타/유튜브 데이터 표시
- [ ] "SNS 클릭률 (CTR)" 도넛 차트에 각 채널의 CTR 비율 표시
- [ ] "일별 SNS 추이" 라인 차트에 30일간 트렌드 표시

### 2. O2O 전환 차트
- [ ] "온라인→오프라인 전환" 가로 바 차트에 6개 공방 위치별 전환 수 표시
- [ ] "SNS별 O2O 전환율" 이중 축 바 차트에 전환 수와 매출 표시

### 3. 데이터 검증
```bash
# 프로덕션 DB에서 데이터 확인
npx wrangler d1 execute aromapulse-production --remote --command="SELECT COUNT(*) FROM sns_visits"
# 예상 결과: 45

npx wrangler d1 execute aromapulse-production --remote --command="SELECT COUNT(*) FROM o2o_conversions"
# 예상 결과: 29

npx wrangler d1 execute aromapulse-production --remote --command="SELECT referral_source, COUNT(*) FROM users WHERE referral_source IS NOT NULL GROUP BY referral_source"
# 예상 결과: blog(8), instagram(10), youtube(6), direct(3), other(2)
```

---

## 🔧 문제 해결

### API 키 오류
```
Error: The given account is not valid or is not authorized to access this service [code: 7403]
```
**해결 방법**: Deploy 탭에서 Cloudflare API 키를 다시 설정하세요.

### 마이그레이션 오류
```
Error: FOREIGN KEY constraint failed
```
**해결 방법**: 
1. 로컬에서 마이그레이션 테스트: `npx wrangler d1 migrations apply aromapulse-production --local`
2. 문제 없으면 프로덕션 적용: `--remote` 플래그 사용

### 차트 데이터 없음
**원인**: 샘플 데이터가 삽입되지 않았거나 API 엔드포인트 오류
**확인**:
```bash
# API 테스트 (로컬)
curl http://localhost:3000/api/admin/sns/stats -H "Authorization: Bearer YOUR_TOKEN"
curl http://localhost:3000/api/admin/o2o/stats -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 샘플 데이터 요약

### SNS 방문 통계 (최근 30일)
| 채널 | 총 방문자 | 고유 방문자 | 클릭 수 | CTR |
|------|----------|-----------|---------|-----|
| 블로그 | 2,560 | 1,030 | 1,030 | 40.2% |
| 인스타그램 | 5,715 | 2,116 | 2,116 | 37.0% |
| 유튜브 | 1,810 | 700 | 700 | 38.7% |

### O2O 전환 통계
| SNS 채널 | 전환 수 | 총 매출 | 평균 매출 |
|---------|---------|---------|----------|
| 블로그 | 8건 | 800,000원 | 100,000원 |
| 인스타그램 | 10건 | 1,050,000원 | 105,000원 |
| 유튜브 | 6건 | 658,000원 | 109,667원 |
| 기타 | 5건 | 497,000원 | 99,400원 |

### 공방별 전환 통계
| 공방 위치 | 전환 수 | 총 매출 |
|---------|---------|---------|
| 강남 로컬 공방 | 4건 | 255,000원 |
| 홍대 아로마 스튜디오 | 6건 | 584,000원 |
| 이태원 향기 공방 | 4건 | 285,000원 |
| 성수 센트 스페이스 | 4건 | 440,000원 |
| 연남동 향수 아틀리에 | 4건 | 590,000원 |
| 삼청동 센트 갤러리 | 3건 | 325,000원 |

---

## 📁 변경된 파일

### 데이터베이스
- `migrations/0024_add_referral_tracking.sql` - referral_source 컬럼 추가
- `migrations/0024_add_sns_tracking.sql` - SNS 및 O2O 테이블 생성
- `seed_sns_and_o2o_data.sql` - 샘플 데이터 (45건 SNS + 29건 O2O)

### 백엔드
- `src/routes/admin.ts` - SNS 및 O2O 통계 API 엔드포인트 추가
  - `GET /api/admin/sns/stats` - SNS 채널 통계
  - `GET /api/admin/o2o/stats` - O2O 전환 통계

### 프론트엔드
- `public/static/admin-dashboard.html` - SNS 및 O2O 차트 캔버스 추가
- `public/static/admin-dashboard.js` - 차트 렌더링 함수 추가
  - `loadSNSStats()`, `loadO2OStats()`
  - `renderSNSChannelChart()`, `renderSNSCTRChart()`, `renderDailySNSTrendChart()`
  - `renderO2OLocationChart()`, `renderO2OConversionRateChart()`

---

## 🎯 다음 단계

1. **Cloudflare API 키 설정** (Deploy 탭)
2. **프로덕션 마이그레이션 적용** (위의 명령어 실행)
3. **샘플 데이터 삽입** (프로덕션 DB)
4. **Cloudflare Pages 배포** (`npm run build && npx wrangler pages deploy dist`)
5. **대시보드 확인** (https://www.aromapulse.kr/static/admin-dashboard)

---

## 📞 문의 및 지원

배포 중 문제가 발생하면 다음 정보와 함께 문의하세요:
- 에러 메시지
- wrangler 로그 (`~/.config/.wrangler/logs/`)
- 브라우저 콘솔 에러 (관리자 대시보드)

---

**배포 날짜**: 2024-01-15  
**마지막 커밋**: Add SNS channel tracking and O2O conversion analytics with dashboard charts  
**Git 브랜치**: main
