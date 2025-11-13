// 챗봇 위젯 JavaScript
// 블로그 임베드용

const CHATBOT_API_URL = 'https://www.aromapulse.kr/api/chatbot';

let sessionId = null;
let visitorId = null;
let isOpen = false;

// DOM 요소
const chatbotBtn = document.getElementById('chatbot-btn');
const chatbotWindow = document.getElementById('chatbot-window');
const chatbotClose = document.getElementById('chatbot-close');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('chatbot-messages');
const chatBadge = document.getElementById('chat-badge');

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 로컬 스토리지에서 세션 정보 가져오기
  sessionId = localStorage.getItem('chatbot_session_id');
  visitorId = localStorage.getItem('visitor_id');
  
  // 이벤트 리스너
  chatbotBtn.addEventListener('click', toggleChatbot);
  chatbotClose.addEventListener('click', toggleChatbot);
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  // 5초 후 배지 표시 (사용자 유도)
  setTimeout(() => {
    if (!isOpen) {
      chatBadge.style.display = 'flex';
    }
  }, 5000);
});

// 챗봇 토글
function toggleChatbot() {
  isOpen = !isOpen;
  
  if (isOpen) {
    chatbotWindow.classList.add('show');
    chatbotBtn.classList.add('active');
    chatBadge.style.display = 'none';
    messageInput.focus();
    
    // 세션이 없으면 시작
    if (!sessionId) {
      startSession();
    }
  } else {
    chatbotWindow.classList.remove('show');
    chatbotBtn.classList.remove('active');
  }
}

// 세션 시작
async function startSession() {
  try {
    const response = await fetch(`${CHATBOT_API_URL}/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: null,
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
    addBotMessage('죄송합니다. 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
}

// 메시지 전송
async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;
  
  // 사용자 메시지 표시
  addUserMessage(message);
  messageInput.value = '';
  sendBtn.disabled = true;
  
  // 타이핑 인디케이터
  showTyping();
  
  try {
    const response = await fetch(`${CHATBOT_API_URL}/message`, {
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
    
    hideTyping();
    
    // 봇 응답 표시
    addBotMessage(data.message);
    
    // 사용자 타입 감지 시 배지 표시
    if (data.analysis.detected_user_type !== 'unknown') {
      showUserTypeBadge(data.analysis.detected_user_type, data.analysis.confidence);
    }
    
  } catch (error) {
    hideTyping();
    console.error('메시지 전송 오류:', error);
    addBotMessage('죄송합니다. 일시적인 오류가 발생했습니다.');
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

// 빠른 답변 전송
function sendQuickReply(message) {
  messageInput.value = message;
  sendMessage();
}

// 사용자 메시지 추가
function addUserMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user';
  messageDiv.innerHTML = `
    <div class="message-avatar">👤</div>
    <div class="message-content">
      <div class="message-bubble">${escapeHtml(text)}</div>
      <div class="message-time">${getCurrentTime()}</div>
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  scrollToBottom();
}

// 봇 메시지 추가
function addBotMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot';
  messageDiv.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="message-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
      <div class="message-time">${getCurrentTime()}</div>
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  scrollToBottom();
}

// 타이핑 인디케이터 표시
function showTyping() {
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typing-indicator';
  typingDiv.className = 'message bot';
  typingDiv.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="message-bubble">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(typingDiv);
  scrollToBottom();
}

// 타이핑 인디케이터 숨김
function hideTyping() {
  const typingDiv = document.getElementById('typing-indicator');
  if (typingDiv) {
    typingDiv.remove();
  }
}

// 사용자 타입 배지 표시
function showUserTypeBadge(userType, confidence) {
  const existingBadge = document.querySelector('.user-type-badge');
  if (existingBadge) {
    existingBadge.remove();
  }
  
  const badgeDiv = document.createElement('div');
  badgeDiv.className = `user-type-badge ${userType === 'B2B' ? 'b2b' : ''}`;
  
  const icon = userType === 'B2B' ? '🏢' : '👤';
  const text = userType === 'B2B' ? 'B2B (기업 고객)' : 'B2C (개인 고객)';
  const confidenceText = (confidence * 100).toFixed(0) + '%';
  
  badgeDiv.innerHTML = `
    ${icon} ${text} 감지됨 (신뢰도: ${confidenceText})
  `;
  
  messagesContainer.appendChild(badgeDiv);
  scrollToBottom();
  
  // 회원가입 추천 메시지
  setTimeout(() => {
    const signupUrl = userType === 'B2B' 
      ? 'https://www.aromapulse.kr/signup?type=B2B'
      : 'https://www.aromapulse.kr/signup?type=B2C';
    
    addBotMessage(`회원가입하시면 더 많은 혜택을 받으실 수 있어요! 지금 가입하시겠어요?\n\n👉 ${signupUrl}`);
  }, 2000);
}

// 스크롤 하단으로
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 현재 시간 가져오기
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
