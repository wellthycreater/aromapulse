// OAuth 인증 헬퍼 함수들

import type { Bindings } from '../types';

// 네이버 OAuth - 인증 URL 생성
export function getNaverAuthUrl(clientId: string, callbackUrl: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: callbackUrl,
    state: state
  });
  
  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
}

// 네이버 OAuth - 액세스 토큰 요청
export async function getNaverAccessToken(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch('https://nid.naver.com/oauth2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get Naver access token');
  }

  return await response.json();
}

// 네이버 OAuth - 사용자 정보 조회
export async function getNaverUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  profile_image?: string;
}> {
  const response = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get Naver user info');
  }

  const data = await response.json();
  return {
    id: data.response.id,
    email: data.response.email,
    name: data.response.name,
    profile_image: data.response.profile_image
  };
}

// 구글 OAuth - 인증 URL 생성
export function getGoogleAuthUrl(clientId: string, callbackUrl: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state: state
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// 구글 OAuth - 액세스 토큰 요청
export async function getGoogleAccessToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number; id_token: string }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get Google access token');
  }

  return await response.json();
}

// 구글 OAuth - 사용자 정보 조회
export async function getGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
}> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get Google user info');
  }

  return await response.json();
}

// 카카오 OAuth - 인증 URL 생성
export function getKakaoAuthUrl(clientId: string, callbackUrl: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code'
  });
  
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

// 카카오 OAuth - 액세스 토큰 요청
export async function getKakaoAccessToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const response = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get Kakao access token');
  }

  return await response.json();
}

// 카카오 OAuth - 사용자 정보 조회
export async function getKakaoUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  profile_image?: string;
}> {
  const response = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get Kakao user info');
  }

  const data = await response.json();
  return {
    id: data.id.toString(),
    email: data.kakao_account.email,
    name: data.kakao_account.profile.nickname,
    profile_image: data.kakao_account.profile.profile_image_url
  };
}

// State 생성 (CSRF 방지)
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
