// Visitor Tracking Script
// 방문자 추적 스크립트

(function() {
  // 방문자 ID 생성 또는 가져오기
  function getVisitorId() {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = 'v_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
  }
  
  // 세션 ID 생성 또는 가져오기
  function getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }
  
  // 방문 기록
  async function trackVisit() {
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      
      const data = {
        visitor_id: visitorId,
        page_url: window.location.pathname,
        referrer: document.referrer,
        session_id: sessionId
      };
      
      await fetch('/api/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      console.log('Visit tracked');
    } catch (error) {
      console.error('Failed to track visit:', error);
    }
  }
  
  // 통계 로드
  async function loadStats() {
    try {
      const response = await fetch('/api/visitors/stats');
      const data = await response.json();
      
      // 오늘 방문자
      const todayEl = document.getElementById('today-visitors');
      if (todayEl) {
        todayEl.textContent = data.today.visits || 0;
      }
      
      // 전체 방문자
      const totalEl = document.getElementById('total-visitors');
      if (totalEl) {
        totalEl.textContent = data.total.visits || 0;
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }
  
  // 페이지 로드 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      trackVisit();
      loadStats();
    });
  } else {
    trackVisit();
    loadStats();
  }
})();
