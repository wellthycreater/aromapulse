/**
 * OAuth Provider-Based Content Filtering
 * 
 * 카카오, 구글, 네이버 로그인을 통해 접근하는 사용자들에게
 * 서로 다른 제품/클래스를 보여주기 위한 해시 기반 필터링 유틸리티
 * 
 * 원리:
 * - 각 항목의 ID를 3으로 나눈 나머지(modulo)를 사용
 * - 나머지 0 → 카카오, 나머지 1 → 구글, 나머지 2 → 네이버
 * - 자동으로 균등 분배되며, 새 항목 추가 시에도 자동 적용
 */

export type OAuthProvider = 'kakao' | 'google' | 'naver';

/**
 * OAuth 제공자별로 항목 필터링
 * @param items 필터링할 항목 배열 (id 속성 필수)
 * @param provider OAuth 제공자 ('kakao', 'google', 'naver')
 * @returns 해당 제공자에게 보여줄 항목만 필터링된 배열
 */
export function filterByOAuthProvider<T extends { id: number | string }>(
  items: T[],
  provider: OAuthProvider | undefined | null
): T[] {
  // provider가 없으면 모든 항목 반환 (로그인하지 않은 경우)
  if (!provider || !['kakao', 'google', 'naver'].includes(provider)) {
    return items;
  }

  // 제공자별 인덱스 매핑
  const providerIndex: Record<OAuthProvider, number> = {
    'kakao': 0,  // ID % 3 === 0
    'google': 1, // ID % 3 === 1
    'naver': 2   // ID % 3 === 2
  };

  const targetIndex = providerIndex[provider];

  // ID를 3으로 나눈 나머지가 제공자 인덱스와 일치하는 항목만 반환
  return items.filter(item => {
    const id = typeof item.id === 'string' ? parseInt(item.id, 10) : item.id;
    return id % 3 === targetIndex;
  });
}

/**
 * 항목이 특정 OAuth 제공자에게 표시되는지 확인
 * @param itemId 확인할 항목 ID
 * @param provider OAuth 제공자
 * @returns 해당 제공자에게 보여야 하면 true
 */
export function shouldShowToProvider(
  itemId: number | string,
  provider: OAuthProvider | undefined | null
): boolean {
  if (!provider || !['kakao', 'google', 'naver'].includes(provider)) {
    return true;
  }

  const id = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
  const providerIndex: Record<OAuthProvider, number> = {
    'kakao': 0,
    'google': 1,
    'naver': 2
  };

  return id % 3 === providerIndex[provider];
}

/**
 * 각 OAuth 제공자가 볼 항목 개수 계산
 * @param totalItems 전체 항목 개수
 * @returns 제공자별 항목 개수
 */
export function calculateProviderDistribution(totalItems: number): Record<OAuthProvider, number> {
  const baseCount = Math.floor(totalItems / 3);
  const remainder = totalItems % 3;

  return {
    'kakao': baseCount + (remainder > 0 ? 1 : 0),
    'google': baseCount + (remainder > 1 ? 1 : 0),
    'naver': baseCount
  };
}
