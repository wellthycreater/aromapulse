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

// 블로그 포스트 목록 조회
blogReviews.get('/posts', async (c) => {
  const category = c.req.query('category')
  const limit = parseInt(c.req.query('limit') || '20')
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
    
    return c.json({
      posts: posts.results,
      count: posts.results.length
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
        const sessionResult = await c.env.DB.prepare(`
          INSERT INTO chatbot_sessions (user_type, session_data, created_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).bind(
          userTypePrediction || 'unknown',
          JSON.stringify({
            source: 'blog_comment',
            comment_id: result.meta.last_row_id,
            post_id: post.id,
            author_name: author_name || 'Anonymous',
            initial_message: content,
            sentiment,
            intent,
            keywords
          })
        ).run()
        
        chatbotSessionId = sessionResult.meta.last_row_id
        
        // 챗봇 메시지 생성 (초기 컨텍스트)
        await c.env.DB.prepare(`
          INSERT INTO chatbot_messages (session_id, role, content, created_at)
          VALUES (?, 'system', ?, CURRENT_TIMESTAMP)
        `).bind(
          chatbotSessionId,
          `블로그 댓글에서 시작된 대화입니다. 사용자: ${author_name || 'Anonymous'}, 의도: ${intent}, 감정: ${sentiment}, 키워드: ${keywords.join(', ')}`
        ).run()
        
        // 사용자 메시지 추가
        await c.env.DB.prepare(`
          INSERT INTO chatbot_messages (session_id, role, content, created_at)
          VALUES (?, 'user', ?, CURRENT_TIMESTAMP)
        `).bind(chatbotSessionId, content).run()
        
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

export default blogReviews
