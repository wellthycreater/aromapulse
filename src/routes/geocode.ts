import { Hono } from 'hono';
import type { Bindings } from '../types';

const geocode = new Hono<{ Bindings: Bindings }>();

// Naver Geocoding API
geocode.get('/naver', async (c) => {
  try {
    const address = c.req.query('address');
    
    if (!address) {
      return c.json({ error: '주소가 필요합니다' }, 400);
    }
    
    console.log('[Naver Geocoding] Address:', address);
    
    const clientId = c.env.NAVER_MAPS_CLIENT_ID;
    const clientSecret = c.env.NAVER_MAPS_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return c.json({ error: 'Naver Maps API 키가 설정되지 않았습니다' }, 500);
    }
    
    // Naver Geocoding API 호출
    const response = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Naver Geocoding API 호출 실패');
    }
    
    const data = await response.json() as any;
    
    console.log('[Naver Geocoding] Response:', data);
    
    if (data.addresses && data.addresses.length > 0) {
      const result = data.addresses[0];
      
      return c.json({
        latitude: parseFloat(result.y),
        longitude: parseFloat(result.x),
        address: result.roadAddress || result.jibunAddress,
        provider: 'naver'
      });
    } else {
      return c.json({ error: '주소를 찾을 수 없습니다' }, 404);
    }
    
  } catch (error: any) {
    console.error('[Naver Geocoding] Error:', error);
    return c.json({ error: error.message || 'Naver Geocoding 실패' }, 500);
  }
});

// Kakao Geocoding API
geocode.get('/kakao', async (c) => {
  try {
    const address = c.req.query('address');
    
    if (!address) {
      return c.json({ error: '주소가 필요합니다' }, 400);
    }
    
    console.log('[Kakao Geocoding] Address:', address);
    
    const apiKey = c.env.KAKAO_MAPS_API_KEY;
    
    if (!apiKey) {
      return c.json({ error: 'Kakao Maps API 키가 설정되지 않았습니다' }, 500);
    }
    
    // Kakao Local API 호출
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'Authorization': `KakaoAK ${apiKey}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Kakao Geocoding API 호출 실패');
    }
    
    const data = await response.json() as any;
    
    console.log('[Kakao Geocoding] Response:', data);
    
    if (data.documents && data.documents.length > 0) {
      const result = data.documents[0];
      
      return c.json({
        latitude: parseFloat(result.y),
        longitude: parseFloat(result.x),
        address: result.road_address ? result.road_address.address_name : result.address_name,
        provider: 'kakao'
      });
    } else {
      return c.json({ error: '주소를 찾을 수 없습니다' }, 404);
    }
    
  } catch (error: any) {
    console.error('[Kakao Geocoding] Error:', error);
    return c.json({ error: error.message || 'Kakao Geocoding 실패' }, 500);
  }
});

// Google Geocoding API
geocode.get('/google', async (c) => {
  try {
    const address = c.req.query('address');
    
    if (!address) {
      return c.json({ error: '주소가 필요합니다' }, 400);
    }
    
    console.log('[Google Geocoding] Address:', address);
    
    const apiKey = c.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return c.json({ error: 'Google Maps API 키가 설정되지 않았습니다' }, 500);
    }
    
    // Google Geocoding API 호출
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=ko`
    );
    
    if (!response.ok) {
      throw new Error('Google Geocoding API 호출 실패');
    }
    
    const data = await response.json() as any;
    
    console.log('[Google Geocoding] Response:', data);
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      
      return c.json({
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        address: result.formatted_address,
        provider: 'google'
      });
    } else {
      return c.json({ error: '주소를 찾을 수 없습니다' }, 404);
    }
    
  } catch (error: any) {
    console.error('[Google Geocoding] Error:', error);
    return c.json({ error: error.message || 'Google Geocoding 실패' }, 500);
  }
});

export default geocode;
