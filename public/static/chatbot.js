// 챗봇 JavaScript

let sessionId = null;
let visitorId = null;
let detectedUserType = 'unknown';
let confidenceScore = 0;

// 페이지 로드 시 세션 시작
document.addEventListener('DOMContentLoaded', async () => {
  // 세션 ID가 localStorage에 있는지 확인
  sessionId = localStorage.getItem('chatbot_session_id');
  visitorId = localStorage.getItem('visitor_id');
  
  if (!sessionId) {
    await startNewSession();
  }
  
  // 이벤트 리스너 등록
  document.getElementById('send-btn').addEventListener('click', sendMessage);
  document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // 빠른 답변 버튼
  document.querySelectorAll('.quick-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const message = btn.getAttribute('data-message');
      document.getElementById('message-input').value = message;
      sendMessage();
    });
  });
  
  // 회원가입 버튼
  document.getElementById('signup-btn').addEventListener('click', () => {
    if (detectedUserType === 'B2B') {
      window.location.href = 'https://www.aromapulse.kr/signup?type=B2B';
    } else {
      window.location.href = 'https://www.aromapulse.kr/signup?type=B2C';
    }
  });
});

// 새 세션 시작
async function startNewSession() {
  try {
    const response = await fetch('/api/chatbot/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: null, // 로그인한 경우 user_id 전달
        visitor_id: visitorId
      })
    });
    
    if (!response.ok) {
      throw new Error('세션 시작 실패');
    }
    
    const data = await response.json();
    sessionId = data.session_id;
    visitorId = data.visitor_id;
    
    localStorage.setItem('chatbot_session_id', sessionId);
    localStorage.setItem('visitor_id', visitorId);
    
  } catch (error) {
    console.error('세션 시작 오류:', error);
    alert('챗봇 연결에 실패했습니다. 페이지를 새로고침해주세요.');
  }
}

// 메시지 전송
async function sendMessage() {
  const input = document.getElementById('message-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // 사용자 메시지 표시
  addMessage('user', message);
  input.value = '';
  
  // 타이핑 인디케이터 표시
  showTypingIndicator();
  
  try {
    const response = await fetch('/api/chatbot/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: message
      })
    });
    
    if (!response.ok) {
      throw new Error('메시지 전송 실패');
    }
    
    const data = await response.json();
    
    // 타이핑 인디케이터 제거
    removeTypingIndicator();
    
    // 봇 응답 표시
    addMessage('bot', data.message);
    
    // 분석 결과 업데이트
    updateAnalysis(data.analysis);
    
    // 사용자 타입 배지 업데이트
    if (data.analysis.detected_user_type !== 'unknown') {
      updateUserTypeBadge(data.analysis.detected_user_type, data.analysis.confidence);
    }
    
    // 관심사 프로필 업데이트 (백그라운드)
    updateInterestProfile();
    
    // 행동 예측 (5번째 메시지부터)
    const messageCount = document.querySelectorAll('.message-user').length;
    if (messageCount >= 3) {
      predictBehavior();
    }
    
  } catch (error) {
    removeTypingIndicator();
    console.error('메시지 전송 오류:', error);
    addMessage('bot', '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.');
  }
}

// 메시지 추가 (UI)
function addMessage(sender, content) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'flex items-start space-x-3' + (sender === 'user' ? ' justify-end' : '');
  
  const now = new Date();
  const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
  
  if (sender === 'user') {
    messageDiv.innerHTML = `
      <div class="flex-1 flex flex-col items-end">
        <div class="message-user text-white rounded-lg p-4 inline-block max-w-md">
          <p class="whitespace-pre-wrap">${escapeHtml(content)}</p>
        </div>
        <p class="text-xs text-gray-500 mt-1">${timeStr}</p>
      </div>
      <div class="flex-shrink-0">
        <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center">
          <i class="fas fa-user text-white"></i>
        </div>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="flex-shrink-0">
        <div class="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center">
          <i class="fas fa-robot text-white"></i>
        </div>
      </div>
      <div class="flex-1">
        <div class="message-bot text-white rounded-lg p-4 inline-block max-w-md">
          <p class="whitespace-pre-wrap">${escapeHtml(content)}</p>
        </div>
        <p class="text-xs text-gray-500 mt-1">${timeStr}</p>
      </div>
    `;
  }
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 타이핑 인디케이터 표시
function showTypingIndicator() {
  const messagesContainer = document.getElementById('chat-messages');
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typing-indicator';
  typingDiv.className = 'flex items-start space-x-3';
  typingDiv.innerHTML = `
    <div class="flex-shrink-0">
      <div class="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center">
        <i class="fas fa-robot text-white"></i>
      </div>
    </div>
    <div class="flex-1">
      <div class="bg-gray-200 rounded-lg p-4 inline-block">
        <div class="typing-indicator flex space-x-1">
          <span class="w-2 h-2 bg-gray-500 rounded-full"></span>
          <span class="w-2 h-2 bg-gray-500 rounded-full"></span>
          <span class="w-2 h-2 bg-gray-500 rounded-full"></span>
        </div>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 타이핑 인디케이터 제거
function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// 분석 결과 업데이트
function updateAnalysis(analysis) {
  document.getElementById('analysis-panel').style.display = 'block';
  
  const intentMap = {
    'greeting': '인사',
    'price_inquiry': '가격 문의',
    'symptom_insomnia': '불면증',
    'symptom_depression': '우울증',
    'symptom_anxiety': '불안증',
    'symptom_stress': '스트레스',
    'purchase_intent': '구매 의도',
    'b2b_inquiry': 'B2B 문의',
    'workshop_inquiry': '워크샵',
    'general_inquiry': '일반 문의',
    'unknown': '알 수 없음'
  };
  
  const sentimentMap = {
    'positive': '긍정 😊',
    'negative': '부정 😔',
    'neutral': '중립 😐'
  };
  
  document.getElementById('analysis-intent').textContent = intentMap[analysis.intent] || analysis.intent;
  document.getElementById('analysis-sentiment').textContent = sentimentMap[analysis.sentiment] || analysis.sentiment;
  document.getElementById('analysis-usertype').textContent = analysis.detected_user_type === 'unknown' ? '분석 중' : analysis.detected_user_type;
  document.getElementById('analysis-confidence').textContent = analysis.confidence 
    ? (analysis.confidence * 100).toFixed(0) + '%'
    : '-';
}

// 사용자 타입 배지 업데이트
function updateUserTypeBadge(userType, confidence) {
  detectedUserType = userType;
  confidenceScore = confidence;
  
  const badge = document.getElementById('user-type-badge');
  const icon = document.getElementById('type-icon');
  const text = document.getElementById('type-text');
  const confidenceText = document.getElementById('confidence-text');
  const signupText = document.getElementById('signup-text');
  
  badge.style.display = 'block';
  
  if (userType === 'B2B') {
    icon.innerHTML = '🏢';
    text.textContent = 'B2B (기업 고객)';
    text.className = 'text-lg font-bold text-blue-600';
    signupText.textContent = 'B2B 회원가입하기';
  } else if (userType === 'B2C') {
    icon.innerHTML = '👤';
    text.textContent = 'B2C (개인 고객)';
    text.className = 'text-lg font-bold text-purple-600';
    signupText.textContent = 'B2C 회원가입하기';
  }
  
  confidenceText.textContent = (confidence * 100).toFixed(0) + '%';
}

// 관심사 프로필 업데이트 (백그라운드)
async function updateInterestProfile() {
  try {
    await fetch('/api/chatbot/update-interest-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId
      })
    });
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
  }
}

// 행동 예측
async function predictBehavior() {
  try {
    const response = await fetch('/api/chatbot/predict-behavior', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId
      })
    });
    
    if (!response.ok) return;
    
    const data = await response.json();
    
    // 예측 결과를 기반으로 추천 메시지 표시
    if (data.predicted_action === 'purchase' || data.predicted_action === 'b2b_inquiry') {
      setTimeout(() => {
        addMessage('bot', `💡 AI 추천:\n${data.next_step}\n\n지금 바로 시작하시겠어요?`);
      }, 2000);
    }
    
  } catch (error) {
    console.error('행동 예측 오류:', error);
  }
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
