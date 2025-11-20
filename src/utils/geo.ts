// Geo-location utilities for workshop search and distance calculation

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
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

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Korean region to approximate coordinates mapping
 * Used for initial search when user only provides region name
 */
export const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '서울': { lat: 37.5665, lng: 126.9780 },
  '부산': { lat: 35.1796, lng: 129.0756 },
  '대구': { lat: 35.8714, lng: 128.6014 },
  '인천': { lat: 37.4563, lng: 126.7052 },
  '광주': { lat: 35.1595, lng: 126.8526 },
  '대전': { lat: 36.3504, lng: 127.3845 },
  '울산': { lat: 35.5384, lng: 129.3114 },
  '세종': { lat: 36.4800, lng: 127.2890 },
  '경기': { lat: 37.4138, lng: 127.5183 },
  '강원': { lat: 37.8228, lng: 128.1555 },
  '충북': { lat: 36.8, lng: 127.7 },
  '충남': { lat: 36.5184, lng: 126.8000 },
  '전북': { lat: 35.7175, lng: 127.1530 },
  '전남': { lat: 34.8679, lng: 126.9910 },
  '경북': { lat: 36.4919, lng: 128.8889 },
  '경남': { lat: 35.4606, lng: 128.2132 },
  '제주': { lat: 33.4890, lng: 126.4983 },
};

/**
 * Get coordinates for a region name
 */
export function getRegionCoordinates(region: string): { lat: number; lng: number } | null {
  return REGION_COORDINATES[region] || null;
}

/**
 * Parse address and extract region
 */
export function extractRegion(address: string): string | null {
  for (const region of Object.keys(REGION_COORDINATES)) {
    if (address.includes(region)) {
      return region;
    }
  }
  return null;
}

/**
 * Search workshops within radius
 * @param workshops - Array of workshops with coordinates
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param radiusKm - Search radius in kilometers
 * @returns Workshops within radius with distance information
 */
export function searchWorkshopsNearby<T extends { latitude?: number; longitude?: number }>(
  workshops: T[],
  userLat: number,
  userLng: number,
  radiusKm: number = 50
): Array<T & { distance: number }> {
  return workshops
    .filter((workshop) => workshop.latitude != null && workshop.longitude != null)
    .map((workshop) => {
      const distance = calculateDistance(
        userLat,
        userLng,
        workshop.latitude!,
        workshop.longitude!
      );
      return {
        ...workshop,
        distance,
      };
    })
    .filter((workshop) => workshop.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Validate coordinates
 */
export function isValidCoordinate(lat?: number, lng?: number): boolean {
  if (lat == null || lng == null) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
