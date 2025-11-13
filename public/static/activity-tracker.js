/**
 * 사용자 행동 트래킹 유틸리티
 * 
 * 사용 예시:
 * - trackActivity('view', 'workshop', workshopId)
 * - trackActivity('search', null, null, { keyword: '수면' })
 * - trackActivity('filter', null, null, { category: '입문' })
 */

// 행동 로그 전송
async function trackActivity(activityType, targetType = null, targetId = null, metadata = null) {
    try {
        const token = localStorage.getItem('token');
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // 토큰이 있으면 추가 (없어도 익명으로 로깅 가능)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/activity/log', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                activity_type: activityType,
                target_type: targetType,
                target_id: targetId,
                metadata: metadata
            })
        });
        
        if (!response.ok) {
            console.warn('Activity tracking failed:', await response.text());
        }
        
    } catch (error) {
        // 트래킹 실패해도 사용자 경험에 영향 없도록 조용히 처리
        console.warn('Activity tracking error:', error);
    }
}

// 워크샵 조회 트래킹
function trackWorkshopView(workshopId) {
    trackActivity('view', 'workshop', workshopId);
}

// 검색 트래킹
function trackSearch(keyword, category = null) {
    trackActivity('search', null, null, { 
        keyword: keyword,
        category: category 
    });
}

// 필터 트래킹
function trackFilter(filterType, filterValue) {
    trackActivity('filter', null, null, { 
        filter_type: filterType,
        filter_value: filterValue 
    });
}

// 예약 시도 트래킹
function trackBookingAttempt(workshopId) {
    trackActivity('booking_attempt', 'workshop', workshopId);
}

// 예약 완료 트래킹
function trackBookingComplete(workshopId, bookingId) {
    trackActivity('booking_complete', 'workshop', workshopId, {
        booking_id: bookingId
    });
}

// 리뷰 작성 트래킹
function trackReviewWrite(workshopId, rating) {
    trackActivity('review_write', 'workshop', workshopId, {
        rating: rating
    });
}

// 클릭 이벤트 트래킹
function trackClick(elementType, targetType = null, targetId = null) {
    trackActivity('click', targetType, targetId, {
        element_type: elementType
    });
}

// 페이지 뷰 트래킹 (페이지 로드 시 자동 호출)
function trackPageView(pageName) {
    trackActivity('page_view', null, null, {
        page_name: pageName,
        url: window.location.pathname
    });
}
