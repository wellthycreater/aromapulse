# 🚀 프로덕션 배포 가이드 (간편 버전)

SNS 채널 추적 및 O2O 전환율 분석 기능을 프로덕션에 배포하는 방법입니다.

---

## ⚡ 빠른 배포 (추천)

### 사전 준비: Cloudflare API 키 설정

1. **Deploy 탭**으로 이동
2. Cloudflare Dashboard에서 API 토큰 생성
3. Deploy 탭에 토큰 저장

### 원클릭 배포

```bash
./deploy.sh
```

이 스크립트가 자동으로:
1. ✅ Cloudflare 인증 확인
2. ✅ 데이터베이스 테이블 생성
3. ✅ 샘플 데이터 삽입 (45건 SNS + 29건 O2O)
4. ✅ 애플리케이션 빌드
5. ✅ Cloudflare Pages에 배포

---

## 🔧 수동 배포 (단계별)

### 1단계: 데이터베이스 배포

```bash
# 테이블 생성 + 샘플 데이터 삽입 (한 번에 실행)
npx wrangler d1 execute aromapulse-production --remote --file=./deploy_production.sql
```

**실행 내용**:
- `users` 테이블에 `referral_source` 컬럼 추가
- `sns_visits` 테이블 생성 (SNS 채널 방문 기록)
- `o2o_conversions` 테이블 생성 (O2O 전환 기록)
- 45건의 SNS 방문 샘플 데이터 삽입
- 29건의 O2O 전환 샘플 데이터 삽입

### 2단계: 애플리케이션 배포

```bash
# 빌드
npm run build

# Cloudflare Pages에 배포
npx wrangler pages deploy dist --project-name aromapulse
```

---

## ✅ 배포 확인

배포 완료 후 다음을 확인하세요:

### 1. 관리자 대시보드 접속
URL: https://www.aromapulse.kr/static/admin-dashboard

### 2. 차트 확인
대시보드 섹션에서 다음 5개 차트가 표시되는지 확인:
- [ ] SNS 채널별 유입 (바 차트)
- [ ] SNS 클릭률 CTR (도넛 차트)
- [ ] 일별 SNS 추이 (라인 차트)
- [ ] 공방별 O2O 전환 (가로 바 차트)
- [ ] SNS별 O2O 전환율 (이중 축 바 차트)

### 3. 데이터 검증 (선택 사항)

```bash
# SNS 방문 데이터 확인
npx wrangler d1 execute aromapulse-production --remote --command="SELECT COUNT(*) as count FROM sns_visits"
# 예상: 45

# O2O 전환 데이터 확인
npx wrangler d1 execute aromapulse-production --remote --command="SELECT COUNT(*) as count FROM o2o_conversions"
# 예상: 29

# 사용자 유입 경로 확인
npx wrangler d1 execute aromapulse-production --remote --command="SELECT referral_source, COUNT(*) as count FROM users WHERE referral_source IS NOT NULL GROUP BY referral_source"
# 예상: blog(8), instagram(10), youtube(6), direct(3), other(2)
```

---

## 📊 배포되는 샘플 데이터

### SNS 방문 통계 (15일간)
| 채널 | 총 방문자 | 고유 방문자 | 클릭 수 | 평균 CTR |
|------|----------|-----------|---------|----------|
| 블로그 | 2,560 | 1,030 | 1,030 | 40.2% |
| 인스타그램 | 5,715 | 2,116 | 2,116 | 37.0% |
| 유튜브 | 1,810 | 700 | 700 | 38.7% |
| **합계** | **10,085** | **3,846** | **3,846** | **38.1%** |

### O2O 전환 통계
| SNS 채널 | 전환 수 | 총 매출 | 평균 매출 |
|---------|---------|---------|----------|
| 블로그 | 8건 | 800,000원 | 100,000원 |
| 인스타그램 | 10건 | 1,050,000원 | 105,000원 |
| 유튜브 | 6건 | 658,000원 | 109,667원 |
| 기타 | 5건 | 497,000원 | 99,400원 |
| **합계** | **29건** | **3,005,000원** | **103,621원** |

### 공방 위치별 전환
- 강남 로컬 공방: 4건
- 홍대 아로마 스튜디오: 6건
- 이태원 향기 공방: 4건
- 성수 센트 스페이스: 4건
- 연남동 향수 아틀리에: 4건
- 삼청동 센트 갤러리: 3건

---

## 🔧 문제 해결

### API 키 오류
```
Error: The given account is not valid [code: 7403]
```
**해결**: Deploy 탭에서 API 키를 다시 설정하세요.

### 테이블이 이미 존재하는 경우
```
Error: table already exists
```
**해결**: `deploy_production.sql`은 안전하게 설계되어 기존 테이블을 보존합니다. 다시 실행해도 안전합니다.

### 차트에 데이터가 표시되지 않는 경우
1. 브라우저 콘솔 확인 (F12)
2. API 엔드포인트 테스트:
   ```bash
   curl https://www.aromapulse.kr/api/admin/sns/stats -H "Authorization: Bearer YOUR_TOKEN"
   curl https://www.aromapulse.kr/api/admin/o2o/stats -H "Authorization: Bearer YOUR_TOKEN"
   ```
3. 데이터베이스 확인 (위의 데이터 검증 명령어 실행)

---

## 📁 배포 파일

- **`deploy_production.sql`**: 테이블 생성 + 샘플 데이터 (올인원)
- **`deploy.sh`**: 자동 배포 스크립트 (추천)
- **`PRODUCTION_DEPLOY.md`**: 이 가이드

---

## 🎯 배포 후 다음 단계

1. ✅ 관리자 대시보드에서 SNS & O2O 차트 확인
2. ✅ 실제 SNS 채널에 UTM 파라미터 추가
3. ✅ 실제 O2O 전환 추적 로직 구현
4. ✅ 정기적인 데이터 분석 및 리포트 생성

---

**배포 날짜**: 2024-01-15  
**배포 URL**: https://www.aromapulse.kr/static/admin-dashboard  
**Git 브랜치**: main
