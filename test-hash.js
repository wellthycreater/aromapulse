// 비밀번호 해싱 테스트
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// admin1234의 SHA-256 해시 생성
hashPassword('admin1234').then(hash => {
  console.log('Password: admin1234');
  console.log('Hash:', hash);
});
