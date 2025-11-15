// 회원가입 폼 제출
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('password-confirm').value;
  
  // 유효성 검증
  if (!name || !email || !password) {
    alert('모든 필드를 입력해주세요.');
    return;
  }
  
  if (password.length < 8) {
    alert('비밀번호는 최소 8자 이상이어야 합니다.');
    return;
  }
  
  if (password !== passwordConfirm) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/admin-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '회원가입 실패');
    }
    
    alert(`✅ 회원가입이 완료되었습니다!\n\n이메일: ${email}\n\n이제 로그인해주세요.`);
    
    // 로그인 페이지로 이동
    window.location.href = '/static/admin-login.html';
    
  } catch (error) {
    console.error('회원가입 오류:', error);
    alert('❌ 회원가입 실패\n\n' + error.message);
  }
});
