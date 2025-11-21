// JWT 토큰 생성 및 검증 유틸리티
// Cloudflare Workers 환경에서 Web Crypto API 사용

import type { User } from '../types';

// JWT 토큰 생성
export async function generateToken(user: Partial<User>, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    userType: user.user_type,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7일 유효
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));

  const signature = await sign(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// JWT 토큰 검증
export async function verifyToken(token: string, secret: string): Promise<any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // 서명 검증
    const expectedSignature = await sign(`${encodedHeader}.${encodedPayload}`, secret);
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    // Payload 디코딩
    const payload = JSON.parse(base64urlDecode(encodedPayload));

    // 만료 시간 확인
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

// HMAC SHA-256 서명 생성
async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return base64urlEncode(signature);
}

// Base64 URL 인코딩
function base64urlEncode(input: string | ArrayBuffer): string {
  let str: string;
  if (typeof input === 'string') {
    // UTF-8 인코딩을 위해 TextEncoder 사용
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    str = btoa(String.fromCharCode(...bytes));
  } else {
    str = btoa(String.fromCharCode(...new Uint8Array(input)));
  }
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Base64 URL 디코딩
function base64urlDecode(input: string): string {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  while (input.length % 4) {
    input += '=';
  }
  // UTF-8 디코딩을 위해 TextDecoder 사용
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}
