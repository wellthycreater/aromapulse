// This file adds login logging to all authentication endpoints
// It will be merged into the main auth.ts file

// Import statements remain the same
import { Hono } from 'hono';
import type { Bindings } from '../types';
import { generateToken } from '../utils/jwt';
import {
  getNaverAuthUrl, getNaverAccessToken, getNaverUserInfo,
  getGoogleAuthUrl, getGoogleAccessToken, getGoogleUserInfo,
  getKakaoAuthUrl, getKakaoAccessToken, getKakaoUserInfo,
  generateState
} from '../utils/oauth';
import { logUserLogin } from '../utils/device-detection';

// Login logging additions:
// 1. After email/password login: await logUserLogin(c.env.DB, user.id as number, user.email as string, 'email', c.req.raw);
// 2. After OAuth login: await logUserLogin(c.env.DB, userId, userInfo.email, 'naver|google|kakao', c.req.raw);
// 3. After admin login: await logUserLogin(c.env.DB, user.id as number, user.email as string, 'email', c.req.raw);

