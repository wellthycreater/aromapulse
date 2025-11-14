import { Hono } from 'hono'
import type { Bindings } from '../types'

const blogReviews = new Hono<{ Bindings: Bindings }>()

// 블로그 포스트 등록 (관리자)
blogReviews.post('/posts', async (c) => {
  const { post_id, title, content, category, url, published_at } = await c.req.json()
  
  if (!post_id || !title || !url) {
    return c.json({ error: '필수 정보가 누락되었습니다' }, 400)
  }
  
  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO blog_posts (post_id, title, content, category, url, published_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(post_id, title, content, category || null, url, published_at || new Date().toISOString()).run()
    
    return c.json({
      message: '블로그 포스트가 등록되었습니다',
      id: result.meta.last_row_id
    })
  } catch (error) {
    console.error('포스트 등록 실패:', error)
    return c.json({ error: '포스트 등록 실패' }, 500)
  }
})

// 블로그 URL에서 댓글 자동 수집 및 분석 (관리자)
blogReviews.post('/crawl-from-url', async (c) => {
  try {
    const { url } = await c.req.json()
    
    if (!url) {
      return c.json({ error: 'URL이 필요합니다' }, 400)
    }
    
    // URL 검증
    if (!url.includes('blog.naver.com')) {
      return c.json({ error: '네이버 블로그 URL만 지원됩니다' }, 400)
    }
    
    // URL에서 포스트 ID 추출
    const postIdMatch = url.match(/\/(\d+)$/)
    if (!postIdMatch) {
      return c.json({ error: '올바른 네이버 블로그 URL이 아닙니다 (예: https://blog.naver.com/aromapulse/223921529276)' }, 400)
    }
    
    const postId = postIdMatch[1]
    
    // 포스트 정보 등록 (이미 존재하면 기존 것 사용)
    let post = await c.env.DB.prepare(`
      SELECT * FROM blog_posts WHERE post_id = ?
    `).bind(postId).first()
    
    if (!post) {
      // 새 포스트 등록
      const postResult = await c.env.DB.prepare(`
        INSERT INTO blog_posts (post_id, title, url, published_at, comment_count)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, 0)
      `).bind(postId, `블로그 게시물 ${postId}`, url).run()
      
      post = { 
        id: postResult.meta.last_row_id, 
        post_id: postId,
        comment_count: 0
      }
    }
    
    // ⚠️ 실제 환경에서는 네이버 블로그 댓글 크롤링 또는 API 호출이 필요
    // 현재는 데모/시뮬레이션 모드로 더미 데이터 생성
    
    // 시뮬레이션: 5개의 더미 댓글 생성
    const dummyComments = [
      {
        author_name: '김민수',
        content: '라벤더 향수 구매하고 싶은데 가격이 얼마인가요? 회사에서 직원 복지용으로 대량 구매 가능한가요?',
        intent: 'B2B문의',
        sentiment: 'neutral',
        userType: 'B2B'
      },
      {
        author_name: '박지영',
        content: '불면증이 심해서 고민인데 라벤더 제품 효과가 있을까요? 구매 링크 있나요?',
        intent: '구매의도',
        sentiment: 'neutral',
        userType: 'B2C'
      },
      {
        author_name: '이수진',
        content: '지난주에 구매했는데 정말 좋아요! 향도 은은하고 수면에 도움이 많이 되는 것 같아요. 추천합니다!',
        intent: '긍정리뷰',
        sentiment: 'positive',
        userType: 'B2C'
      },
      {
        author_name: '최대호',
        content: '사무실용으로 룸스프레이 필요한데 가격 문의 좀 드려요. 대량 구매 할인 있나요?',
        intent: '가격문의',
        sentiment: 'neutral',
        userType: 'B2B'
      },
      {
        author_name: '정서연',
        content: '향기 정말 좋네요! 우울할 때 써보니 기분이 좀 나아지는 것 같아요',
        intent: '긍정리뷰',
        sentiment: 'positive',
        userType: 'B2C'
      }
    ]
    
    let totalComments = 0
    let purchaseIntentCount = 0
    let b2cCount = 0
    let b2bCount = 0
    let chatbotSessionsCreated = 0
    
    for (const dummy of dummyComments) {
      // 키워드 추출
      const keywords = extractKeywords(dummy.content)
      
      // 댓글 저장
      const commentResult = await c.env.DB.prepare(`
        INSERT INTO blog_comments (
          post_id, comment_id, author_name, content,
          sentiment, user_type_prediction, intent, keywords
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        post.id,
        `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        dummy.author_name,
        dummy.content,
        dummy.sentiment,
        dummy.userType,
        dummy.intent,
        JSON.stringify(keywords)
      ).run()
      
      totalComments++
      
      if (dummy.intent === '구매의도' || dummy.intent === '문의' || dummy.intent === 'B2B문의' || dummy.intent === '가격문의') {
        purchaseIntentCount++
      }
      
      if (dummy.userType === 'B2C') b2cCount++
      if (dummy.userType === 'B2B') b2bCount++
      
      // 구매 의도가 있는 댓글에 대해 챗봇 세션 자동 생성
      if (dummy.intent === '구매의도' || dummy.intent === 'B2B문의' || dummy.intent === '가격문의') {
        try {
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
          const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
          
          const sessionResult = await c.env.DB.prepare(`
            INSERT INTO chatbot_sessions (session_id, visitor_id, detected_user_type, started_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(sessionId, visitorId, dummy.userType).run()
          
          const chatbotSessionId = sessionResult.meta.last_row_id
          
          // 시스템 메시지
          await c.env.DB.prepare(`
            INSERT INTO chatbot_messages (session_id, sender, content, created_at)
            VALUES (?, 'system', ?, CURRENT_TIMESTAMP)
          `).bind(
            chatbotSessionId,
            `블로그 댓글에서 시작된 대화입니다. 사용자: ${dummy.author_name}, 의도: ${dummy.intent}, 감정: ${dummy.sentiment}, 키워드: ${keywords.join(', ')}`
          ).run()
          
          // 사용자 메시지
          await c.env.DB.prepare(`
            INSERT INTO chatbot_messages (session_id, sender, content, intent, sentiment, created_at)
            VALUES (?, 'user', ?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(chatbotSessionId, dummy.content, dummy.intent, dummy.sentiment).run()
          
          // AI 응답
          const aiResponse = generateAIResponseFromComment(
            dummy.content, 
            dummy.intent, 
            dummy.sentiment, 
            keywords, 
            dummy.userType
          )
          
          await c.env.DB.prepare(`
            INSERT INTO chatbot_messages (session_id, sender, content, created_at)
            VALUES (?, 'assistant', ?, CURRENT_TIMESTAMP)
          `).bind(chatbotSessionId, aiResponse).run()
          
          chatbotSessionsCreated++
        } catch (chatbotError) {
          console.error('챗봇 세션 생성 실패:', chatbotError)
        }
      }
    }
    
    // 포스트의 댓글 수 업데이트
    await c.env.DB.prepare(`
      UPDATE blog_posts SET comment_count = comment_count + ? WHERE id = ?
    `).bind(totalComments, post.id).run()
    
    return c.json({
      message: '댓글 수집 및 분석 완료',
      post_id: postId,
      total_comments: totalComments,
      purchase_intent_count: purchaseIntentCount,
      b2c_count: b2cCount,
      b2b_count: b2bCount,
      chatbot_sessions_created: chatbotSessionsCreated,
      note: '현재는 시뮬레이션 모드입니다. 실제 네이버 블로그 API 연동은 추가 개발이 필요합니다.'
    })
    
  } catch (error) {
    console.error('댓글 수집 실패:', error)
    return c.json({ error: '댓글 수집 실패: ' + error }, 500)
  }
})

// 블로그 포스트 목록 조회 (통계 포함)
blogReviews.get('/posts', async (c) => {
  const category = c.req.query('category')
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = parseInt(c.req.query('offset') || '0')
  
  try {
    let query = `
      SELECT * FROM blog_posts
      ${category ? 'WHERE category = ?' : ''}
      ORDER BY published_at DESC
      LIMIT ? OFFSET ?
    `
    
    const params = category ? [category, limit, offset] : [limit, offset]
    const posts = await c.env.DB.prepare(query).bind(...params).all()
    
    // 각 포스트의 통계 정보 추가
    const postsWithStats = await Promise.all(
      (posts.results as any[]).map(async (post) => {
        // 댓글 통계
        const commentStats = await c.env.DB.prepare(`
          SELECT 
            COUNT(*) as total_comments,
            SUM(CASE WHEN intent IN ('구매의도', '문의', 'B2B문의', '가격문의') THEN 1 ELSE 0 END) as purchase_intent_count,
            SUM(CASE WHEN user_type_prediction = 'B2C' THEN 1 ELSE 0 END) as b2c_count,
            SUM(CASE WHEN user_type_prediction = 'B2B' THEN 1 ELSE 0 END) as b2b_count
          FROM blog_comments
          WHERE post_id = ?
        `).bind(post.id).first()
        
        // 챗봇 세션 수 (댓글 기반 세션)
        const chatbotSessions = await c.env.DB.prepare(`
          SELECT COUNT(DISTINCT cs.id) as chatbot_session_count
          FROM chatbot_sessions cs
          JOIN chatbot_messages cm ON cs.id = cm.session_id
          JOIN blog_comments bc ON cm.content LIKE '%' || bc.content || '%'
          WHERE bc.post_id = ?
        `).bind(post.id).first()
        
        return {
          ...post,
          comment_count: commentStats?.total_comments || 0,
          purchase_intent_count: commentStats?.purchase_intent_count || 0,
          b2c_count: commentStats?.b2c_count || 0,
          b2b_count: commentStats?.b2b_count || 0,
          chatbot_session_count: chatbotSessions?.chatbot_session_count || 0
        }
      })
    )
    
    return c.json({
      posts: postsWithStats,
      count: postsWithStats.length
    })
  } catch (error) {
    console.error('포스트 조회 실패:', error)
    return c.json({ error: '포스트 조회 실패' }, 500)
  }
})

// 특정 포스트 조회
blogReviews.get('/posts/:post_id', async (c) => {
  const postId = c.req.param('post_id')
  
  try {
    const post = await c.env.DB.prepare(`
      SELECT * FROM blog_posts WHERE post_id = ?
    `).bind(postId).first()
    
    if (!post) {
      return c.json({ error: '포스트를 찾을 수 없습니다' }, 404)
    }
    
    // 댓글도 함께 조회
    const comments = await c.env.DB.prepare(`
      SELECT * FROM blog_comments WHERE post_id = ? ORDER BY created_at DESC
    `).bind(post.id).all()
    
    return c.json({
      post,
      comments: comments.results
    })
  } catch (error) {
    console.error('포스트 조회 실패:', error)
    return c.json({ error: '포스트 조회 실패' }, 500)
  }
})

// 특정 포스트의 댓글 목록 조회
blogReviews.get('/posts/:post_id/comments', async (c) => {
  const postId = c.req.param('post_id')
  
  try {
    // post_id로 blog_posts 검색
    const post = await c.env.DB.prepare(`
      SELECT id FROM blog_posts WHERE post_id = ?
    `).bind(postId).first()
    
    if (!post) {
      return c.json({ error: '포스트를 찾을 수 없습니다' }, 404)
    }
    
    // 댓글 목록 조회
    const comments = await c.env.DB.prepare(`
      SELECT * FROM blog_comments 
      WHERE post_id = ? 
      ORDER BY created_at DESC
    `).bind(post.id).all()
    
    return c.json({
      post_id: postId,
      comments: comments.results,
      count: comments.results.length
    })
  } catch (error) {
    console.error('댓글 조회 실패:', error)
    return c.json({ error: '댓글 조회 실패' }, 500)
  }
})

// 댓글 등록 (자동 수집 또는 수동 등록)
blogReviews.post('/comments', async (c) => {
  const {
    post_id,
    comment_id,
    author_name,
    author_id,
    content,
    parent_comment_id
  } = await c.req.json()
  
  if (!post_id || !content) {
    return c.json({ error: '포스트 ID와 내용이 필요합니다' }, 400)
  }
  
  try {
    // 포스트 확인
    const post = await c.env.DB.prepare(`
      SELECT id FROM blog_posts WHERE post_id = ?
    `).bind(post_id).first()
    
    if (!post) {
      return c.json({ error: '포스트를 찾을 수 없습니다' }, 404)
    }
    
    // AI 분석 수행
    const sentiment = analyzeSentiment(content)
    const userTypePrediction = predictUserType(content)
    const intent = extractIntent(content)
    const keywords = extractKeywords(content)
    
    // 댓글 저장
    const result = await c.env.DB.prepare(`
      INSERT INTO blog_comments (
        post_id, comment_id, author_name, author_id, content,
        parent_comment_id, sentiment, user_type_prediction, intent, keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      post.id,
      comment_id || null,
      author_name || 'Anonymous',
      author_id || null,
      content,
      parent_comment_id || null,
      sentiment,
      userTypePrediction,
      intent,
      JSON.stringify(keywords)
    ).run()
    
    // 포스트의 댓글 수 업데이트
    await c.env.DB.prepare(`
      UPDATE blog_posts SET comment_count = comment_count + 1 WHERE id = ?
    `).bind(post.id).run()
    
    // 구매 의도나 문의가 감지되면 챗봇 세션 자동 생성
    let chatbotSessionId = null
    if (intent === '구매의도' || intent === '문의' || intent === 'B2B문의' || intent === '가격문의') {
      try {
        // 챗봇 세션 생성
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        
        const sessionResult = await c.env.DB.prepare(`
          INSERT INTO chatbot_sessions (session_id, visitor_id, detected_user_type, started_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          sessionId,
          visitorId,
          userTypePrediction || 'unknown'
        ).run()
        
        chatbotSessionId = sessionResult.meta.last_row_id
        
        // 챗봇 메시지 생성 (초기 컨텍스트)
        await c.env.DB.prepare(`
          INSERT INTO chatbot_messages (session_id, sender, content, created_at)
          VALUES (?, 'system', ?, CURRENT_TIMESTAMP)
        `).bind(
          chatbotSessionId,
          `블로그 댓글에서 시작된 대화입니다. 사용자: ${author_name || 'Anonymous'}, 의도: ${intent}, 감정: ${sentiment}, 키워드: ${keywords.join(', ')}`
        ).run()
        
        // 사용자 메시지 추가
        await c.env.DB.prepare(`
          INSERT INTO chatbot_messages (session_id, sender, content, intent, sentiment, created_at)
          VALUES (?, 'user', ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(chatbotSessionId, content, intent, sentiment).run()
        
        // AI 응답 생성
        const aiResponse = generateAIResponseFromComment(content, intent, sentiment, keywords, userTypePrediction)
        
        await c.env.DB.prepare(`
          INSERT INTO chatbot_messages (session_id, sender, content, created_at)
          VALUES (?, 'assistant', ?, CURRENT_TIMESTAMP)
        `).bind(chatbotSessionId, aiResponse).run()
        
      } catch (chatbotError) {
        console.error('챗봇 세션 생성 실패:', chatbotError)
        // 챗봇 연동 실패해도 댓글 등록은 성공으로 처리
      }
    }
    
    return c.json({
      message: '댓글이 등록되었습니다',
      id: result.meta.last_row_id,
      analysis: {
        sentiment,
        user_type_prediction: userTypePrediction,
        intent,
        keywords
      },
      chatbot_session_id: chatbotSessionId,
      chatbot_url: chatbotSessionId ? `/chatbot?session=${chatbotSessionId}` : null
    })
  } catch (error) {
    console.error('댓글 등록 실패:', error)
    return c.json({ error: '댓글 등록 실패' }, 500)
  }
})

// 댓글 분석 함수들
function analyzeSentiment(text: string): string {
  const positive = ['좋아', '감사', '만족', '행복', '최고', '훌륭', '멋진', '완벽', '추천']
  const negative = ['싫어', '불만', '화나', '실망', '나쁨', '최악', '별로', '아쉬움']
  
  const lowerText = text.toLowerCase()
  const positiveCount = positive.filter(w => lowerText.includes(w)).length
  const negativeCount = negative.filter(w => lowerText.includes(w)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

function predictUserType(text: string): string | null {
  const b2bSignals = [
    '회사', '기업', '법인', '단체', '직원', '팀', '부서',
    '대량', '납품', '도매', '업체', '공급',
    '복리후생', '직원복지', '워라밸', '팀빌딩',
    '공방', '조향사', '향수', '제작',
    '매장', '샵', '가게', '판매'
  ]
  
  const b2cSignals = [
    '개인', '혼자', '나', '저', '내가', '집', '방', '침실',
    '거실', '개인용', '선물', '친구', '가족'
  ]
  
  const lowerText = text.toLowerCase()
  const b2bCount = b2bSignals.filter(s => lowerText.includes(s)).length
  const b2cCount = b2cSignals.filter(s => lowerText.includes(s)).length
  
  if (b2bCount > b2cCount && b2bCount > 0) return 'B2B'
  if (b2cCount > b2bCount && b2cCount > 0) return 'B2C'
  return null
}

function extractIntent(text: string): string {
  const lowerText = text.toLowerCase()
  
  if (lowerText.match(/구매|주문|살|사고|결제/)) return '구매의도'
  if (lowerText.match(/문의|궁금|알고싶|질문/)) return '문의'
  if (lowerText.match(/체험|워크샵|클래스|교육/)) return '체험희망'
  if (lowerText.match(/가격|얼마|비용/)) return '가격문의'
  if (lowerText.match(/납품|대량|단체|기업/)) return 'B2B문의'
  if (lowerText.match(/효과|도움|좋|만족/)) return '긍정리뷰'
  if (lowerText.match(/별로|실망|아쉬|불만/)) return '부정리뷰'
  
  return '일반댓글'
}

function extractKeywords(text: string): string[] {
  const keywords: string[] = []
  const lowerText = text.toLowerCase()
  
  // 증상 키워드
  if (lowerText.includes('불면') || lowerText.includes('잠')) keywords.push('불면증')
  if (lowerText.includes('우울')) keywords.push('우울증')
  if (lowerText.includes('불안')) keywords.push('불안증')
  if (lowerText.includes('스트레스')) keywords.push('스트레스')
  if (lowerText.includes('피곤') || lowerText.includes('지침')) keywords.push('피로')
  
  // 제품 키워드
  if (lowerText.includes('스프레이')) keywords.push('룸스프레이')
  if (lowerText.includes('디퓨저')) keywords.push('디퓨저')
  if (lowerText.includes('캔들') || lowerText.includes('양초')) keywords.push('캔들')
  if (lowerText.includes('향수')) keywords.push('향수')
  
  // 향 키워드
  if (lowerText.includes('라벤더')) keywords.push('라벤더')
  if (lowerText.includes('페퍼민트')) keywords.push('페퍼민트')
  if (lowerText.includes('유칼립투스')) keywords.push('유칼립투스')
  if (lowerText.includes('로즈마리')) keywords.push('로즈마리')
  
  // 용도 키워드
  if (lowerText.includes('회사') || lowerText.includes('사무실')) keywords.push('업무용')
  if (lowerText.includes('집') || lowerText.includes('방')) keywords.push('가정용')
  if (lowerText.includes('선물')) keywords.push('선물용')
  
  return keywords
}

// 댓글 분석 통계
blogReviews.get('/stats/comments', async (c) => {
  try {
    // 감정 분석 통계
    const sentimentStats = await c.env.DB.prepare(`
      SELECT sentiment, COUNT(*) as count
      FROM blog_comments
      WHERE sentiment IS NOT NULL
      GROUP BY sentiment
    `).all()
    
    // 사용자 타입 예측 통계
    const userTypeStats = await c.env.DB.prepare(`
      SELECT user_type_prediction, COUNT(*) as count
      FROM blog_comments
      WHERE user_type_prediction IS NOT NULL
      GROUP BY user_type_prediction
    `).all()
    
    // 의도 분석 통계
    const intentStats = await c.env.DB.prepare(`
      SELECT intent, COUNT(*) as count
      FROM blog_comments
      WHERE intent IS NOT NULL
      GROUP BY intent
      ORDER BY count DESC
      LIMIT 10
    `).all()
    
    // 최근 댓글
    const recentComments = await c.env.DB.prepare(`
      SELECT bc.*, bp.title as post_title
      FROM blog_comments bc
      JOIN blog_posts bp ON bc.post_id = bp.id
      ORDER BY bc.created_at DESC
      LIMIT 10
    `).all()
    
    return c.json({
      sentiment_stats: sentimentStats.results,
      user_type_stats: userTypeStats.results,
      intent_stats: intentStats.results,
      recent_comments: recentComments.results
    })
  } catch (error) {
    console.error('통계 조회 실패:', error)
    return c.json({ error: '통계 조회 실패' }, 500)
  }
})

// 키워드 분석
blogReviews.get('/stats/keywords', async (c) => {
  try {
    const comments = await c.env.DB.prepare(`
      SELECT keywords FROM blog_comments WHERE keywords IS NOT NULL
    `).all()
    
    const keywordCount: { [key: string]: number } = {}
    
    comments.results.forEach((comment: any) => {
      try {
        const keywords = JSON.parse(comment.keywords)
        keywords.forEach((keyword: string) => {
          keywordCount[keyword] = (keywordCount[keyword] || 0) + 1
        })
      } catch (e) {
        // JSON 파싱 실패 시 무시
      }
    })
    
    const sortedKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }))
    
    return c.json({
      keywords: sortedKeywords,
      total_comments: comments.results.length
    })
  } catch (error) {
    console.error('키워드 분석 실패:', error)
    return c.json({ error: '키워드 분석 실패' }, 500)
  }
})

// B2B/B2C 잠재 고객 발굴
blogReviews.get('/leads', async (c) => {
  const userType = c.req.query('user_type') // 'B2B' or 'B2C'
  const intent = c.req.query('intent')
  
  try {
    let query = `
      SELECT bc.*, bp.title as post_title, bp.url as post_url
      FROM blog_comments bc
      JOIN blog_posts bp ON bc.post_id = bp.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (userType) {
      query += ' AND bc.user_type_prediction = ?'
      params.push(userType)
    }
    
    if (intent) {
      query += ' AND bc.intent = ?'
      params.push(intent)
    }
    
    query += ' ORDER BY bc.created_at DESC LIMIT 50'
    
    const leads = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      leads: leads.results,
      count: leads.results.length
    })
  } catch (error) {
    console.error('리드 조회 실패:', error)
    return c.json({ error: '리드 조회 실패' }, 500)
  }
})

// AI 응답 생성 함수
function generateAIResponseFromComment(
  content: string,
  intent: string,
  sentiment: string,
  keywords: string[],
  userType: string | null
): string {
  let response = `안녕하세요! 블로그 댓글 감사합니다. 😊\n\n`
  
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

export default blogReviews
