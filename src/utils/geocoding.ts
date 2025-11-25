/**
 * Geocoding Utility for Cloudflare Workers
 * 
 * Supports multiple map providers:
 * - Google Maps Geocoding API
 * - Naver Maps Geocoding API
 * - Kakao Maps Geocoding API
 */

import type { Bindings } from '../types';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Geocode address using Google Maps API
 */
async function geocodeWithGoogle(
  address: string,
  apiKey: string
): Promise<Coordinates | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }

    console.error('[Google Geocoding] Failed:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('[Google Geocoding] Error:', error);
    return null;
  }
}

/**
 * Geocode address using Naver Maps API
 */
async function geocodeWithNaver(
  address: string,
  clientId: string,
  clientSecret: string
): Promise<Coordinates | null> {
  try {
    const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(
      address
    )}`;

    const response = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret,
      },
    });

    const data = await response.json();

    if (data.status === 'OK' && data.addresses && data.addresses.length > 0) {
      const location = data.addresses[0];
      return {
        latitude: parseFloat(location.y),
        longitude: parseFloat(location.x),
      };
    }

    console.error('[Naver Geocoding] Failed:', data.status, data.errorMessage);
    return null;
  } catch (error) {
    console.error('[Naver Geocoding] Error:', error);
    return null;
  }
}

/**
 * Geocode address using Kakao Maps API
 */
async function geocodeWithKakao(
  address: string,
  apiKey: string
): Promise<Coordinates | null> {
  try {
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
      address
    )}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
    });

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      const location = data.documents[0];
      return {
        latitude: parseFloat(location.y),
        longitude: parseFloat(location.x),
      };
    }

    console.error('[Kakao Geocoding] Failed: No results');
    return null;
  } catch (error) {
    console.error('[Kakao Geocoding] Error:', error);
    return null;
  }
}

/**
 * Geocode address using the appropriate provider
 * @param address Address to geocode
 * @param provider OAuth provider (google, naver, kakao)
 * @param env Cloudflare environment bindings
 * @returns Coordinates or null if failed
 */
export async function geocodeAddress(
  address: string,
  provider: 'google' | 'naver' | 'kakao',
  env: Bindings
): Promise<Coordinates | null> {
  if (!address || address.trim() === '') {
    return null;
  }

  switch (provider) {
    case 'google':
      if (!env.GOOGLE_MAPS_API_KEY) {
        console.error('[Geocoding] Google Maps API key not configured');
        return null;
      }
      return geocodeWithGoogle(address, env.GOOGLE_MAPS_API_KEY);

    case 'naver':
      if (!env.NAVER_MAPS_CLIENT_ID || !env.NAVER_MAPS_CLIENT_SECRET) {
        console.error('[Geocoding] Naver Maps API credentials not configured');
        return null;
      }
      return geocodeWithNaver(
        address,
        env.NAVER_MAPS_CLIENT_ID,
        env.NAVER_MAPS_CLIENT_SECRET
      );

    case 'kakao':
      const kakaoKey = env.KAKAO_MAPS_API_KEY || env.KAKAO_REST_API_KEY;
      if (!kakaoKey) {
        console.error('[Geocoding] Kakao Maps API key not configured');
        return null;
      }
      return geocodeWithKakao(address, kakaoKey);

    default:
      console.error('[Geocoding] Invalid provider:', provider);
      return null;
  }
}
