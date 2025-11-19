import re

# 원본 파일 복원
with open('src/routes/auth.ts.backup', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 일반 로그인에 로그 기록 추가 (첫 번째 로그인 함수)
pattern1 = r"(// 마지막 로그인 시간 업데이트\s+await c\.env\.DB\.prepare\(\s+'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = \?'\s+\)\.bind\(user\.id\)\.run\(\);)\s+(// JWT 토큰 생성)"
replacement1 = r"\1\n    \n    // 로그인 기록 저장\n    await logUserLogin(c.env.DB, user.id as number, user.email as string, 'email', c.req.raw);\n    \n    \2"
content = re.sub(pattern1, replacement1, content, count=1)

# 2. 네이버 OAuth - 기존 사용자
pattern2 = r"(// 기존 사용자 로그인\s+userId = existingUser\.id as number;\s+user = existingUser;\s+// 마지막 로그인 시간 업데이트\s+await c\.env\.DB\.prepare\(\s+'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = \?'\s+\)\.bind\(userId\)\.run\(\);)\s+(} else {)"
replacement2 = r"\1\n      \n      // 로그인 기록 저장\n      await logUserLogin(c.env.DB, userId, userInfo.email, 'naver', c.req.raw);\n      \n    \2"
content = re.sub(pattern2, replacement2, content, count=1)

# 3. 네이버 OAuth - 이메일 연동 사용자
pattern3 = r"(user = await c\.env\.DB\.prepare\(\s+'SELECT \* FROM users WHERE id = \?'\s+\)\.bind\(userId\)\.first\(\);)\s+(} else {\s+// 신규 사용자 생성)"
replacement3_naver = r"\1\n        \n        // 로그인 기록 저장\n        await logUserLogin(c.env.DB, userId, userInfo.email, 'naver', c.req.raw);\n        \n      \2"

# 네이버 섹션에서만 적용 (첫 번째 발견)
naver_start = content.find("// 네이버 로그인 콜백")
naver_end = content.find("// 구글 로그인 시작", naver_start)
naver_section = content[naver_start:naver_end]
naver_section = re.sub(pattern3, replacement3_naver, naver_section, count=1)
content = content[:naver_start] + naver_section + content[naver_end:]

# 4. 네이버 OAuth - 신규 사용자
pattern4 = r"(userId = result\.meta\.last_row_id as number;\s+user = await c\.env\.DB\.prepare\(\s+'SELECT \* FROM users WHERE id = \?'\s+\)\.bind\(userId\)\.first\(\);)\s+(}\s+}\s+// JWT 토큰 생성)"
# 네이버 섹션에서만
naver_section = content[naver_start:naver_end]
replacement4_naver = r"\1\n        \n        // 로그인 기록 저장 (신규 가입도 기록)\n        await logUserLogin(c.env.DB, userId, userInfo.email, 'naver', c.req.raw);\n      \2"
naver_section = re.sub(pattern4, replacement4_naver, naver_section, count=1)
content = content[:naver_start] + naver_section + content[naver_end:]

# 구글 OAuth도 동일하게 처리
google_start = content.find("// 구글 로그인 콜백")
google_end = content.find("// 카카오 로그인 시작", google_start)
google_section = content[google_start:google_end]

# 구글 기존 사용자
google_section = re.sub(pattern2.replace('naver', 'google'), replacement2.replace('naver', 'google'), google_section, count=1)
# 구글 이메일 연동
google_section = re.sub(pattern3, replacement3_naver.replace('naver', 'google'), google_section, count=1)
# 구글 신규 사용자
google_section = re.sub(pattern4, replacement4_naver.replace('naver', 'google'), google_section, count=1)
content = content[:google_start] + google_section + content[google_end:]

# 카카오 OAuth도 동일하게 처리
kakao_start = content.find("// 카카오 로그인 콜백")
kakao_end = content.find("// 로그아웃", kakao_start)
kakao_section = content[kakao_start:kakao_end]

# 카카오 기존 사용자
kakao_section = re.sub(pattern2.replace('naver', 'kakao'), replacement2.replace('naver', 'kakao'), kakao_section, count=1)
# 카카오 이메일 연동
kakao_section = re.sub(pattern3, replacement3_naver.replace('naver', 'kakao').replace('userInfo.email', "userInfo.email || '카카오 사용자'"), kakao_section, count=1)
# 카카오 신규 사용자
kakao_section = re.sub(pattern4, replacement4_naver.replace('naver', 'kakao').replace('userInfo.email', "userInfo.email || '카카오 사용자'"), kakao_section, count=1)
content = content[:kakao_start] + kakao_section + content[kakao_end:]

# 5. 관리자 로그인
pattern_admin = r"(// 관리자 사용자 조회.*?\.bind\(user\.id\)\.run\(\);)\s+(// JWT 토큰 생성)"
replacement_admin = r"\1\n    \n    // 로그인 기록 저장\n    await logUserLogin(c.env.DB, user.id as number, user.email as string, 'email', c.req.raw);\n    \n    \2"
content = re.sub(pattern_admin, replacement_admin, content, flags=re.DOTALL)

# 저장
with open('src/routes/auth.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Login logging added to all authentication endpoints successfully!")
