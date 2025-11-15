// 로그인 폼 제출
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    alert('이메일과 비밀번호를 입력해주세요.');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '로그인 실패');
    }
    
    // 토큰 저장 (adminToken으로 통일)
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('auth_token', data.token); // 하위 호환성
    
    alert(`✅ 로그인 성공!\n\n환영합니다, ${data.user.name}님!`);
    
    // 관리자 페이지로 이동
    window.location.href = '/static/admin-products.html';
    
  } catch (error) {
    console.error('로그인 오류:', error);
    alert('❌ 로그인 실패\n\n' + error.message);
  }
});
