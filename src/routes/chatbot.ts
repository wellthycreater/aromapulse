import { Hono } from 'hono'
import type { Bindings } from '../types'

const chatbot = new Hono<{ Bindings: Bindings }>()

// 세션 ID 생성 함수
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// 방문자 ID 생성 함수
function generateVisitorId(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// 의도 분석 함수 (간단한 키워드 기반)
function analyzeIntent(message: string): string {
  const msg = message.toLowerCase()
  
  if (msg.match(/안녕|하이|헬로|처음/)) return 'greeting'
  if (msg.match(/가격|얼마|비용|결제/)) return 'price_inquiry'
  if (msg.match(/불면|잠|수면/)) return 'symptom_insomnia'
  if (msg.match(/우울|슬픔|무기력/)) return 'symptom_depression'
  if (msg.match(/불안|초조|걱정/)) return 'symptom_anxiety'
  if (msg.match(/스트레스|피곤|지침/)) return 'symptom_stress'
  if (msg.match(/구매|주문|살|사고/)) return 'purchase_intent'
  if (msg.match(/회사|기업|단체|납품|대량/)) return 'b2b_inquiry'
  if (msg.match(/워크샵|체험|클래스|교육/)) return 'workshop_inquiry'
  if (msg.match(/상담|문의|도움|궁금/)) return 'general_inquiry'
  
  return 'unknown'
}

// 감정 분석 함수
function analyzeSentiment(message: string): string {
  const msg = message.toLowerCase()
  
  const positiveWords = ['좋아', '감사', '만족', '행복', '기쁨', '훌륭', '최고', '멋진']
  const negativeWords = ['싫어', '불만', '화나', '힘들', '고통', '짜증', '실망', '나쁨']
  
  const positiveCount = positiveWords.filter(w => msg.includes(w)).length
  const negativeCount = negativeWords.filter(w => msg.includes(w)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

// B2B/B2C 신호 감지
function detectUserTypeSignal(message: string): string | null {
  const msg = message.toLowerCase()
  
  if (msg.match(/회사|기업|법인|단체|직원|팀|부서/)) return 'company_mention'
  if (msg.match(/대량|납품|도매|업체|공급/)) return 'bulk_order'
  if (msg.match(/복리후생|직원복지|워라밸|팀빌딩/)) return 'corporate_benefit'
  if (msg.match(/공방|조향사|향수|제작|만들기/)) return 'perfumer_interest'
  if (msg.match(/매장|샵|가게|판매/)) return 'shop_owner'
  if (msg.match(/개인|혼자|나|저/)) return 'personal_use'
  if (msg.match(/집|방|침실|거실/)) return 'home_use'
  
  return null
}

// 엔티티 추출 (간단한 키워드 기반)
function extractEntities(message: string): any {
  const entities: any = {
    symptoms: [],
    products: [],
    price_range: null,
    quantity: null
  }
  
  const msg = message.toLowerCase()
  
  // 증상
  if (msg.includes('불면') || msg.includes('잠')) entities.symptoms.push('insomnia')
  if (msg.includes('우울')) entities.symptoms.push('depression')
  if (msg.includes('불안')) entities.symptoms.push('anxiety')
  if (msg.includes('스트레스')) entities.symptoms.push('stress')
  
  // 제품
  if (msg.includes('스프레이')) entities.products.push('room_spray')
  if (msg.includes('디퓨저')) entities.products.push('diffuser')
  if (msg.includes('캔들') || msg.includes('양초')) entities.products.push('candle')
  if (msg.includes('향수')) entities.products.push('perfume')
  
  // 가격대
  if (msg.match(/저렴|싼|저가|만원 이하/)) entities.price_range = 'low'
  if (msg.match(/중간|보통|적당/)) entities.price_range = 'medium'
  if (msg.match(/고급|프리미엄|비싼/)) entities.price_range = 'high'
  
  // 수량
  const quantityMatch = msg.match(/(\d+)개|(\d+)병|(\d+)개입/)
  if (quantityMatch) {
    entities.quantity = parseInt(quantityMatch[1] || quantityMatch[2] || quantityMatch[3])
  }
  
  return entities
}

// 챗봇 응답 생성 (의도 기반) - 자연스러운 회원가입 유도 포함
function generateBotResponse(intent: string, entities: any, userTypeSignal: string | null, messageCount: number = 0): string {
  switch (intent) {
    case 'greeting':
      return '안녕하세요! 아로마펄스입니다 🌿\n어떤 도움이 필요하신가요?\n\n💜 스트레스/증상 케어\n🏢 기업/단체 문의\n🛍️ 제품 구매\n🎨 워크샵 체험'
    
    case 'symptom_insomnia':
      return '불면증으로 힘드시군요 😔\n\n라벤더, 캐모마일 향이 수면에 도움이 됩니다.\n추천 제품을 보시겠어요?\n\n💡 회원가입하시면 맞춤형 제품 추천과 첫 구매 10% 할인 혜택을 받으실 수 있어요!'
    
    case 'symptom_depression':
      return '우울감을 느끼고 계시는군요 💙\n\n베르가못, 자몽 향이 기분 전환에 좋습니다.\n맞춤 상담을 도와드릴까요?\n\n✨ 회원님의 증상에 맞는 개인 맞춤 솔루션을 제공해드리고 있어요. 회원가입 후 더 자세한 상담을 받아보세요!'
    
    case 'symptom_anxiety':
      return '불안하신 마음이 느껴지네요 🤍\n\n일랑일랑, 클라리세이지 향이 안정에 도움이 됩니다.\n어떤 제품이 필요하신가요?\n\n🎁 지금 가입하시면 무료 샘플 키트를 드려요!'
    
    case 'symptom_stress':
      return '스트레스 관리가 필요하시군요 💚\n\n페퍼민트, 유칼립투스 향이 스트레스 완화에 좋습니다.\n\n개인용인가요, 사무실용인가요?\n\n💫 회원으로 가입하시면 스트레스 케어 가이드와 함께 정기 배송 할인도 받으실 수 있어요!'
    
    case 'price_inquiry':
      return '가격 문의 감사합니다!\n\n💰 기본 제품: 15,000원~30,000원\n💎 프리미엄: 50,000원~100,000원\n🏢 기업 단체: 별도 견적\n\n어떤 제품이 궁금하신가요?\n\n🎯 회원가입 시 첫 구매 10% 할인 + 적립금 5% 혜택이 제공됩니다!'
    
    case 'purchase_intent':
      return '구매에 관심 가져주셔서 감사합니다! 😊\n\n회원가입하시면:\n✅ 첫 구매 10% 할인\n✅ 적립금 5% 지급\n✅ 무료 배송\n✅ 맞춤형 제품 추천\n✅ 정기 배송 추가 할인\n\n💜 지금 바로 가입하고 혜택을 받아보세요!\n👉 https://www.aromapulse.kr/signup'
    
    case 'b2b_inquiry':
      return '기업/단체 문의 감사합니다! 🏢\n\n아로마펄스는 다음 서비스를 제공합니다:\n\n📦 대량 납품 (20% 이상 할인)\n🎓 기업 워크샵 (맞춤 프로그램)\n💼 복리후생 패키지\n🤝 브랜드 맞춤 제작\n👥 전담 매니저 배정\n\n🎁 B2B 회원 전용 혜택:\n• 견적서 즉시 발급\n• 샘플 무료 제공\n• 월간 정산 지원\n\n💼 지금 B2B 회원으로 가입하시고 전문 상담을 받아보세요!\n👉 https://www.aromapulse.kr/signup?type=B2B'
    
    case 'workshop_inquiry':
      return '워크샵에 관심 가져주셔서 감사합니다! 🎨\n\n현재 진행 중인 워크샵:\n✨ 나만의 향수 만들기 (49,000원)\n🕯️ 아로마 캔들 클래스 (39,000원)\n💆 스트레스 케어 체험 (29,000원)\n\n어떤 워크샵이 궁금하신가요?\n\n🌟 회원 전용 혜택:\n• 워크샵 10% 할인\n• 우선 예약권\n• 재료비 무료 업그레이드\n\n💫 지금 가입하고 워크샵 할인을 받으세요!\n👉 https://www.aromapulse.kr/signup?type=B2C'
    
    case 'general_inquiry':
      return '무엇이 궁금하신가요? 🙋‍♀️\n\n저희가 도와드릴 수 있는 내용:\n• 증상별 제품 추천\n• 기업/단체 납품\n• 워크샵 예약\n• 가격/배송 문의\n\n편하게 물어보세요!\n\n💡 회원가입하시면 1:1 전문 상담과 맞춤 추천을 받으실 수 있어요!'
    
    default:
      if (userTypeSignal === 'company_mention' || userTypeSignal === 'bulk_order') {
        return '기업 고객이신가요? 🏢\n\nB2B 전용 혜택:\n✅ 대량 구매 20% 이상 할인\n✅ 맞춤 제작 가능\n✅ 전담 매니저 배정\n✅ 견적서 즉시 발급\n✅ 샘플 무료 제공\n\n💼 지금 B2B 회원으로 가입하시고 전문 상담을 받아보세요!\n👉 https://www.aromapulse.kr/signup?type=B2B'
      }
      
      // 대화가 3회 이상 진행되면 자연스럽게 회원가입 유도
      if (messageCount >= 3) {
        return '말씀하신 내용을 잘 이해하지 못했어요 🤔\n\n다시 한번 말씀해 주시거나, 아래 주제 중 하나를 선택해주세요:\n\n1️⃣ 증상별 제품 찾기\n2️⃣ 기업 문의\n3️⃣ 워크샵 예약\n4️⃣ 상담원 연결\n\n💡 TIP: 회원가입하시면 AI가 더 정확하게 맞춤 상담을 제공해드립니다!\n👉 https://www.aromapulse.kr/signup'
      }
      
      return '말씀하신 내용을 잘 이해하지 못했어요 🤔\n\n다시 한번 말씀해 주시거나, 아래 주제 중 하나를 선택해주세요:\n\n1️⃣ 증상별 제품 찾기\n2️⃣ 기업 문의\n3️⃣ 워크샵 예약\n4️⃣ 상담원 연결'
  }
}

// 새 챗봇 세션 시작
chatbot.post('/session/start', async (c) => {
  const { user_id, visitor_id } = await c.req.json()
  
  const sessionId = generateSessionId()
  const finalVisitorId = visitor_id || generateVisitorId()
  
  try {
    await c.env.DB.prepare(`
      INSERT INTO chatbot_sessions (session_id, user_id, visitor_id, detected_user_type)
      VALUES (?, ?, ?, ?)
    `).bind(sessionId, user_id || null, finalVisitorId, 'unknown').run()
    
    return c.json({
      session_id: sessionId,
      visitor_id: finalVisitorId,
      welcome_message: '안녕하세요! 아로마펄스 AI 상담봇입니다 🌿\n무엇을 도와드릴까요?'
    })
  } catch (error) {
    console.error('세션 생성 실패:', error)
    return c.json({ error: '세션 생성 실패' }, 500)
  }
})

// 메시지 전송 및 응답
chatbot.post('/message', async (c) => {
  const { session_id, message } = await c.req.json()
  
  if (!session_id || !message) {
    return c.json({ error: '세션 ID와 메시지가 필요합니다' }, 400)
  }
  
  try {
    // 세션 조회
    const session = await c.env.DB.prepare(`
      SELECT * FROM chatbot_sessions WHERE session_id = ?
    `).bind(session_id).first()
    
    if (!session) {
      return c.json({ error: '세션을 찾을 수 없습니다' }, 404)
    }
    
    // AI 분석
    const intent = analyzeIntent(message)
    const sentiment = analyzeSentiment(message)
    const userTypeSignal = detectUserTypeSignal(message)
    const entities = extractEntities(message)
    
    // 사용자 메시지 저장
    await c.env.DB.prepare(`
      INSERT INTO chatbot_messages (session_id, sender, content, intent, entities, sentiment, user_type_signal)
      VALUES (?, 'user', ?, ?, ?, ?, ?)
    `).bind(
      session.id,
      message,
      intent,
      JSON.stringify(entities),
      sentiment,
      userTypeSignal
    ).run()
    
    // B2B/B2C 타입 업데이트
    let detectedType = session.detected_user_type
    let confidence = 0.5
    
    if (userTypeSignal) {
      if (['company_mention', 'bulk_order', 'corporate_benefit', 'perfumer_interest', 'shop_owner'].includes(userTypeSignal)) {
        detectedType = 'B2B'
        confidence = 0.8
      } else if (['personal_use', 'home_use'].includes(userTypeSignal)) {
        detectedType = 'B2C'
        confidence = 0.8
      }
      
      await c.env.DB.prepare(`
        UPDATE chatbot_sessions
        SET detected_user_type = ?, confidence_score = ?, message_count = message_count + 1
        WHERE id = ?
      `).bind(detectedType, confidence, session.id).run()
    } else {
      await c.env.DB.prepare(`
        UPDATE chatbot_sessions SET message_count = message_count + 1 WHERE id = ?
      `).bind(session.id).run()
    }
    
    // 봇 응답 생성 (메시지 횟수 전달)
    const botResponse = generateBotResponse(intent, entities, userTypeSignal, session.message_count + 1)
    
    // 봇 응답 저장
    await c.env.DB.prepare(`
      INSERT INTO chatbot_messages (session_id, sender, content, intent)
      VALUES (?, 'bot', ?, ?)
    `).bind(session.id, botResponse, intent).run()
    
    return c.json({
      message: botResponse,
      analysis: {
        intent,
        sentiment,
        user_type_signal: userTypeSignal,
        detected_user_type: detectedType,
        confidence,
        entities
      }
    })
  } catch (error) {
    console.error('메시지 처리 실패:', error)
    return c.json({ error: '메시지 처리 실패' }, 500)
  }
})

// 세션 대화 내역 조회
chatbot.get('/session/:session_id/messages', async (c) => {
  const sessionId = c.req.param('session_id')
  
  try {
    const session = await c.env.DB.prepare(`
      SELECT * FROM chatbot_sessions WHERE session_id = ?
    `).bind(sessionId).first()
    
    if (!session) {
      return c.json({ error: '세션을 찾을 수 없습니다' }, 404)
    }
    
    const messages = await c.env.DB.prepare(`
      SELECT * FROM chatbot_messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `).bind(session.id).all()
    
    return c.json({
      session: {
        session_id: session.session_id,
        detected_user_type: session.detected_user_type,
        confidence_score: session.confidence_score,
        message_count: session.message_count
      },
      messages: messages.results
    })
  } catch (error) {
    console.error('대화 내역 조회 실패:', error)
    return c.json({ error: '대화 내역 조회 실패' }, 500)
  }
})

// 행동 예측 생성
chatbot.post('/predict-behavior', async (c) => {
  const { session_id } = await c.req.json()
  
  try {
    const session = await c.env.DB.prepare(`
      SELECT * FROM chatbot_sessions WHERE session_id = ?
    `).bind(session_id).first()
    
    if (!session) {
      return c.json({ error: '세션을 찾을 수 없습니다' }, 404)
    }
    
    // 메시지 분석
    const messages = await c.env.DB.prepare(`
      SELECT * FROM chatbot_messages WHERE session_id = ? ORDER BY created_at ASC
    `).bind(session.id).all()
    
    // 간단한 예측 로직
    let predictedAction = 'browse'
    let confidence = 0.5
    let recommendedProducts = []
    let reasons = []
    
    const userMessages = messages.results.filter((m: any) => m.sender === 'user')
    const intents = userMessages.map((m: any) => m.intent)
    const entities = userMessages
      .map((m: any) => m.entities ? JSON.parse(m.entities) : null)
      .filter((e: any) => e !== null)
    
    // 구매 의도 감지
    if (intents.includes('purchase_intent') || intents.includes('price_inquiry')) {
      predictedAction = 'purchase'
      confidence = 0.8
      reasons.push('구매 관련 문의 감지')
    }
    
    // 워크샵 관심
    if (intents.includes('workshop_inquiry')) {
      predictedAction = 'workshop_booking'
      confidence = 0.75
      reasons.push('워크샵 체험 관심')
    }
    
    // B2B 문의
    if (intents.includes('b2b_inquiry') || session.detected_user_type === 'B2B') {
      predictedAction = 'b2b_inquiry'
      confidence = 0.85
      reasons.push('기업 고객 패턴')
    }
    
    // 증상 기반 제품 추천
    const allSymptoms = entities.flatMap((e: any) => e.symptoms || [])
    if (allSymptoms.length > 0) {
      recommendedProducts = [...new Set(allSymptoms)] // 중복 제거
      reasons.push(`${allSymptoms.join(', ')} 증상 감지`)
    }
    
    // 예측 저장
    await c.env.DB.prepare(`
      INSERT INTO user_behavior_predictions (
        user_id, session_id, visitor_id, predicted_action, confidence_score,
        recommended_products, prediction_reason, based_on_features
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.user_id,
      session.id,
      session.visitor_id,
      predictedAction,
      confidence,
      JSON.stringify(recommendedProducts),
      reasons.join(', '),
      JSON.stringify({ intents, symptom_count: allSymptoms.length, message_count: session.message_count })
    ).run()
    
    return c.json({
      predicted_action: predictedAction,
      confidence,
      recommended_products: recommendedProducts,
      reasons,
      next_step: getNextStepRecommendation(predictedAction, session.detected_user_type)
    })
  } catch (error) {
    console.error('행동 예측 실패:', error)
    return c.json({ error: '행동 예측 실패' }, 500)
  }
})

// 다음 단계 추천
function getNextStepRecommendation(predictedAction: string, userType: string): string {
  if (predictedAction === 'purchase') {
    return userType === 'B2B' 
      ? 'B2B 회원가입 → 대량 구매 견적 요청'
      : 'B2C 회원가입 → 첫 구매 10% 할인'
  }
  
  if (predictedAction === 'workshop_booking') {
    return '워크샵 목록 보기 → 예약하기'
  }
  
  if (predictedAction === 'b2b_inquiry') {
    return 'B2B 회원가입 → 전담 매니저 상담'
  }
  
  return '제품 둘러보기 → 관심 제품 찜하기'
}

// 관심사 프로필 업데이트
chatbot.post('/update-interest-profile', async (c) => {
  const { session_id } = await c.req.json()
  
  try {
    const session = await c.env.DB.prepare(`
      SELECT * FROM chatbot_sessions WHERE session_id = ?
    `).bind(session_id).first()
    
    if (!session) {
      return c.json({ error: '세션을 찾을 수 없습니다' }, 404)
    }
    
    // 메시지에서 증상 점수 계산
    const messages = await c.env.DB.prepare(`
      SELECT entities FROM chatbot_messages WHERE session_id = ? AND sender = 'user'
    `).bind(session.id).all()
    
    const scores: any = {
      insomnia: 0,
      depression: 0,
      anxiety: 0,
      stress: 0,
      fatigue: 0
    }
    
    messages.results.forEach((msg: any) => {
      if (msg.entities) {
        const entities = JSON.parse(msg.entities)
        if (entities.symptoms) {
          entities.symptoms.forEach((symptom: string) => {
            if (scores[symptom] !== undefined) {
              scores[symptom] += 1
            }
          })
        }
      }
    })
    
    // 정규화 (0~1 범위)
    const maxScore = Math.max(...Object.values(scores))
    if (maxScore > 0) {
      Object.keys(scores).forEach(key => {
        scores[key] = scores[key] / maxScore
      })
    }
    
    // 프로필 업데이트 또는 생성
    // user_id나 visitor_id 중 하나라도 존재하면 업데이트
    if (session.user_id) {
      // 로그인한 사용자
      await c.env.DB.prepare(`
        INSERT INTO user_interest_profiles (
          user_id, visitor_id, insomnia_score, depression_score, anxiety_score,
          stress_score, fatigue_score, last_interaction_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          insomnia_score = excluded.insomnia_score,
          depression_score = excluded.depression_score,
          anxiety_score = excluded.anxiety_score,
          stress_score = excluded.stress_score,
          fatigue_score = excluded.fatigue_score,
          last_interaction_at = CURRENT_TIMESTAMP
      `).bind(
        session.user_id,
        session.visitor_id,
        scores.insomnia,
        scores.depression,
        scores.anxiety,
        scores.stress,
        scores.fatigue
      ).run()
    } else {
      // 비로그인 사용자 (visitor_id 기반)
      await c.env.DB.prepare(`
        INSERT INTO user_interest_profiles (
          user_id, visitor_id, insomnia_score, depression_score, anxiety_score,
          stress_score, fatigue_score, last_interaction_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(visitor_id) DO UPDATE SET
          insomnia_score = excluded.insomnia_score,
          depression_score = excluded.depression_score,
          anxiety_score = excluded.anxiety_score,
          stress_score = excluded.stress_score,
          fatigue_score = excluded.fatigue_score,
          last_interaction_at = CURRENT_TIMESTAMP
      `).bind(
        null,
        session.visitor_id,
        scores.insomnia,
        scores.depression,
        scores.anxiety,
        scores.stress,
        scores.fatigue
      ).run()
    }
    
    return c.json({
      message: '관심사 프로필이 업데이트되었습니다',
      profile: scores
    })
  } catch (error) {
    console.error('프로필 업데이트 실패:', error)
    return c.json({ error: '프로필 업데이트 실패' }, 500)
  }
})

// 회원가입 전환 추적 (클릭 시점)
chatbot.post('/track-conversion', async (c) => {
  const { session_id, user_type } = await c.req.json()
  
  try {
    const session = await c.env.DB.prepare(`
      SELECT * FROM chatbot_sessions WHERE session_id = ?
    `).bind(session_id).first()
    
    if (!session) {
      return c.json({ error: '세션을 찾을 수 없습니다' }, 404)
    }
    
    // 전환 의도 기록 (클릭 추적)
    await c.env.DB.prepare(`
      UPDATE chatbot_sessions
      SET is_converted = 1
      WHERE id = ?
    `).bind(session.id).run()
    
    return c.json({
      success: true,
      message: '회원가입 전환이 기록되었습니다',
      redirect_url: user_type === 'B2B' 
        ? 'https://www.aromapulse.kr/signup?type=B2B'
        : 'https://www.aromapulse.kr/signup?type=B2C'
    })
  } catch (error) {
    console.error('전환 추적 실패:', error)
    return c.json({ error: '전환 추적 실패' }, 500)
  }
})

// 회원가입 전환 추적 (실제 가입 완료 시)
chatbot.post('/track-signup-conversion', async (c) => {
  const { session_id, visitor_id, signup_type } = await c.req.json()
  
  try {
    // 세션 조회
    let session = null
    if (session_id) {
      session = await c.env.DB.prepare(`
        SELECT * FROM chatbot_sessions WHERE session_id = ?
      `).bind(session_id).first()
    } else if (visitor_id) {
      // visitor_id로도 조회 가능
      session = await c.env.DB.prepare(`
        SELECT * FROM chatbot_sessions WHERE visitor_id = ? ORDER BY created_at DESC LIMIT 1
      `).bind(visitor_id).first()
    }
    
    if (!session) {
      return c.json({ error: '세션을 찾을 수 없습니다' }, 404)
    }
    
    // 전환 플래그 업데이트
    await c.env.DB.prepare(`
      UPDATE chatbot_sessions
      SET is_converted = 1, converted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(session.id).run()
    
    return c.json({
      success: true,
      message: '회원가입 전환이 기록되었습니다',
      session_id: session.session_id,
      detected_user_type: session.detected_user_type,
      signup_type: signup_type
    })
  } catch (error) {
    console.error('전환 추적 실패:', error)
    return c.json({ error: '전환 추적 실패' }, 500)
  }
})

// 회원가입 전환율 통계 조회
chatbot.get('/conversion-stats', async (c) => {
  try {
    // 전체 세션 수
    const totalSessions = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM chatbot_sessions
    `).first()
    
    // 전환된 세션 수
    const convertedSessions = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM chatbot_sessions WHERE is_converted = 1
    `).first()
    
    // B2B/B2C 별 전환율
    const b2bStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(is_converted) as converted
      FROM chatbot_sessions
      WHERE detected_user_type = 'B2B'
    `).first()
    
    const b2cStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(is_converted) as converted
      FROM chatbot_sessions
      WHERE detected_user_type = 'B2C'
    `).first()
    
    const totalCount = (totalSessions as any).count || 0
    const convertedCount = (convertedSessions as any).count || 0
    const conversionRate = totalCount > 0 ? (convertedCount / totalCount * 100).toFixed(2) : '0.00'
    
    const b2bTotal = (b2bStats as any)?.total || 0
    const b2bConverted = (b2bStats as any)?.converted || 0
    const b2bRate = b2bTotal > 0 ? (b2bConverted / b2bTotal * 100).toFixed(2) : '0.00'
    
    const b2cTotal = (b2cStats as any)?.total || 0
    const b2cConverted = (b2cStats as any)?.converted || 0
    const b2cRate = b2cTotal > 0 ? (b2cConverted / b2cTotal * 100).toFixed(2) : '0.00'
    
    return c.json({
      overall: {
        total_sessions: totalCount,
        converted_sessions: convertedCount,
        conversion_rate: conversionRate + '%'
      },
      b2b: {
        total_sessions: b2bTotal,
        converted_sessions: b2bConverted,
        conversion_rate: b2bRate + '%'
      },
      b2c: {
        total_sessions: b2cTotal,
        converted_sessions: b2cConverted,
        conversion_rate: b2cRate + '%'
      }
    })
  } catch (error) {
    console.error('통계 조회 실패:', error)
    return c.json({ error: '통계 조회 실패' }, 500)
  }
})

// 블로그 댓글에서 챗봇 세션 시작
chatbot.post('/session/from-comment', async (c) => {
  try {
    const { comment_id } = await c.req.json()
    
    if (!comment_id) {
      return c.json({ error: '댓글 ID가 필요합니다' }, 400)
    }
    
    // 댓글 정보 조회
    const comment = await c.env.DB.prepare(`
      SELECT bc.*, bp.title as post_title, bp.url as post_url
      FROM blog_comments bc
      JOIN blog_posts bp ON bc.post_id = bp.id
      WHERE bc.id = ?
    `).bind(comment_id).first()
    
    if (!comment) {
      return c.json({ error: '댓글을 찾을 수 없습니다' }, 404)
    }
    
    // 이미 챗봇 세션이 존재하는지 확인
    const existingSession = await c.env.DB.prepare(`
      SELECT id, session_id FROM chatbot_sessions
      WHERE session_data LIKE ?
    `).bind(`%"comment_id":${comment_id}%`).first()
    
    if (existingSession) {
      return c.json({
        message: '기존 세션을 사용합니다',
        session_id: existingSession.session_id,
        chatbot_url: `/chatbot?session=${existingSession.session_id}`
      })
    }
    
    // 새 챗봇 세션 생성
    const sessionId = generateSessionId()
    const visitorId = generateVisitorId()
    
    const sessionResult = await c.env.DB.prepare(`
      INSERT INTO chatbot_sessions (
        session_id, visitor_id, detected_user_type, session_data, created_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      sessionId,
      visitorId,
      comment.user_type_prediction || 'unknown',
      JSON.stringify({
        source: 'blog_comment',
        comment_id: comment.id,
        post_id: comment.post_id,
        post_title: comment.post_title,
        post_url: comment.post_url,
        author_name: comment.author_name,
        initial_message: comment.content,
        sentiment: comment.sentiment,
        intent: comment.intent,
        keywords: JSON.parse(comment.keywords || '[]')
      })
    ).run()
    
    // 시스템 메시지 생성 (컨텍스트 제공)
    await c.env.DB.prepare(`
      INSERT INTO chatbot_messages (session_id, sender, content, created_at)
      VALUES (?, 'system', ?, CURRENT_TIMESTAMP)
    `).bind(
      sessionResult.meta.last_row_id,
      `블로그 댓글에서 시작된 대화입니다.\n포스트: ${comment.post_title}\n작성자: ${comment.author_name}\n의도: ${comment.intent}\n감정: ${comment.sentiment}\n키워드: ${JSON.parse(comment.keywords || '[]').join(', ')}`
    ).run()
    
    // 사용자 댓글을 첫 메시지로 추가
    await c.env.DB.prepare(`
      INSERT INTO chatbot_messages (session_id, sender, content, intent, sentiment, created_at)
      VALUES (?, 'user', ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      sessionResult.meta.last_row_id,
      comment.content,
      comment.intent,
      comment.sentiment
    ).run()
    
    // AI 응답 생성
    const aiResponse = generateResponseFromComment(comment)
    
    await c.env.DB.prepare(`
      INSERT INTO chatbot_messages (session_id, sender, content, created_at)
      VALUES (?, 'assistant', ?, CURRENT_TIMESTAMP)
    `).bind(
      sessionResult.meta.last_row_id,
      aiResponse
    ).run()
    
    return c.json({
      message: '챗봇 세션이 생성되었습니다',
      session_id: sessionId,
      chatbot_url: `/chatbot?session=${sessionId}`,
      initial_response: aiResponse
    })
    
  } catch (error) {
    console.error('댓글 연동 세션 생성 실패:', error)
    return c.json({ error: '세션 생성 실패' }, 500)
  }
})

// 댓글 기반 AI 응답 생성
function generateResponseFromComment(comment: any): string {
  const intent = comment.intent
  const sentiment = comment.sentiment
  const keywords = JSON.parse(comment.keywords || '[]')
  const userType = comment.user_type_prediction
  
  // 인사말
  let response = `안녕하세요, ${comment.author_name}님! 블로그 댓글 감사합니다. 😊\n\n`
  
  // 의도별 응답
  if (intent === '구매의도') {
    response += `구매에 관심 가져주셔서 감사합니다!\n`
    if (keywords.length > 0) {
      response += `${keywords.join(', ')} 관련 제품을 추천해드릴 수 있습니다.\n\n`
    }
    if (userType === 'B2B') {
      response += `🏢 기업 고객님께는 다음과 같은 혜택을 제공합니다:\n• 대량 구매 20% 할인\n• 전담 매니저 배정\n• 샘플 무료 제공\n\n`
    } else {
      response += `🎁 첫 구매 고객님께 특별 혜택을 드립니다:\n• 첫 구매 10% 할인\n• 적립금 5%\n• 무료 배송\n\n`
    }
    response += `제품 상담이나 주문을 원하시면 말씀해주세요!`
  }
  else if (intent === '문의' || intent === '가격문의') {
    response += `궁금하신 점이 있으신가요? 무엇이든 물어보세요!\n\n`
    if (keywords.length > 0) {
      response += `${keywords.join(', ')} 관련 정보를 도와드리겠습니다.`
    }
  }
  else if (intent === 'B2B문의') {
    response += `🏢 비즈니스 문의 감사합니다!\n\n`
    response += `다음과 같은 서비스를 제공하고 있습니다:\n`
    response += `• 워크샵 & 클래스 제휴\n`
    response += `• 대량 납품 (에스테틱, 미용실, 웰니스 가게 등)\n`
    response += `• 기능성/효능성 제품 공급\n`
    response += `• 파트너사 협업\n\n`
    response += `어떤 서비스가 필요하신가요?`
  }
  else if (intent === '긍정리뷰') {
    response += `긍정적인 의견 정말 감사합니다! ${sentiment === 'positive' ? '😊' : ''}\n\n`
    response += `더 궁금하신 점이나 추가로 필요한 제품이 있으시면 알려주세요!`
  }
  else {
    response += `댓글 남겨주셔서 감사합니다!\n\n`
    if (keywords.length > 0) {
      response += `${keywords.join(', ')} 관련해서 도움을 드릴 수 있습니다.\n\n`
    }
    response += `궁금하신 점이 있으시면 편하게 물어보세요! 😊`
  }
  
  return response
}

export default chatbot
