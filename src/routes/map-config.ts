import { Hono } from 'hono';
import type { Bindings } from '../types';

const mapConfig = new Hono<{ Bindings: Bindings }>();

/**
 * Map API Configuration Endpoint
 * OAuth 제공자별 Map API 키를 안전하게 제공
 */
mapConfig.get('/', async (c) => {
  const provider = c.req.query('provider') as 'google' | 'naver' | 'kakao' | undefined;
  
  if (!provider) {
    return c.json({ error: 'Provider parameter is required' }, 400);
  }
  
  try {
    const config: any = {};
    
    switch (provider) {
      case 'google':
        config.apiKey = c.env.GOOGLE_MAPS_API_KEY;
        config.mapUrl = `https://maps.googleapis.com/maps/api/js?key=${c.env.GOOGLE_MAPS_API_KEY}&libraries=places`;
        break;
        
      case 'naver':
        config.clientId = c.env.NAVER_MAPS_CLIENT_ID;
        config.mapUrl = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${c.env.NAVER_MAPS_CLIENT_ID}&submodules=geocoder`;
        break;
        
      case 'kakao':
        config.apiKey = c.env.KAKAO_MAPS_API_KEY || c.env.KAKAO_REST_API_KEY;
        config.mapUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${config.apiKey}&libraries=services,clusterer,drawing`;
        break;
        
      default:
        return c.json({ error: 'Invalid provider' }, 400);
    }
    
    return c.json({
      provider,
      config
    });
    
  } catch (error: any) {
    console.error('Map config error:', error);
    return c.json({ error: '지도 설정을 불러오는데 실패했습니다' }, 500);
  }
});

export default mapConfig;
