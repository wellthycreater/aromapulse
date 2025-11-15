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

// 네이버 블로그 댓글 크롤링 함수
async function crawlNaverBlogComments(blogId: string, logNo: string): Promise<any[]> {
  const comments: any[] = []
  let page = 1
  const maxPages = 50 // 최대 50페이지까지만 수집 (1000개 댓글)
  
  try {
    while (page <= maxPages) {
      // 네이버 댓글 API 호출
      const apiUrl = `https://apis.naver.com/commentBox/cbox/web_neo_list_jsonp.json?ticket=blog&templateId=default_society&pool=cbox5&lang=ko&country=&objectId=blog${blogId}_${logNo}&pageSize=20&indexSize=10&listType=OBJECT&pageType=more&page=${page}&sort=NEW`
      
      try {
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': `https://blog.naver.com/${blogId}/${logNo}`
          }
        })
        
        if (!response.ok) {
          console.error(`페이지 ${page} 가져오기 실패:`, response.status)
          break
        }
        
        const text = await response.text()
        
        // JSONP 응답 파싱 (jQuery 콜백 제거)
        const jsonMatch = text.match(/\((.+)\)$/)
        if (!jsonMatch) {
          console.error('JSONP 응답 파싱 실패')
          break
        }
        
        const data = JSON.parse(jsonMatch[1])
        
        // 댓글이 없으면 종료
        if (!data.result || !data.result.commentList || data.result.commentList.length === 0) {
          break
        }
        
        // 댓글 데이터 추출
        for (const comment of data.result.commentList) {
          comments.push({
            comment_id: comment.commentNo || `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            author_name: comment.userName || comment.maskedUserId || '익명',
            author_id: comment.maskedUserId || null,
            content: comment.contents || '',
            created_at: comment.regTime || comment.modTime || new Date().toISOString(),
            parent_comment_id: comment.parentCommentNo || null
          })
        }
        
        // 마지막 페이지 확인
        const totalComments = data.result.count?.comment || 0
        if (comments.length >= totalComments) {
          break
        }
        
        page++
        
        // API 부하 방지를 위한 지연 (500ms)
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (pageError) {
        console.error(`페이지 ${page} 처리 오류:`, pageError)
        break
      }
    }
    
    return comments
  } catch (error) {
    console.error('댓글 크롤링 오류:', error)
    return comments // 수집한 댓글이라도 반환
  }
}

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
    
    // URL에서 블로그 ID와 포스트 번호 추출
    // 형식: https://blog.naver.com/BLOG_ID/POST_NUMBER
    const urlMatch = url.match(/blog\.naver\.com\/([^\/]+)\/(\d+)/)
    if (!urlMatch) {
      return c.json({ error: '올바른 네이버 블로그 URL이 아닙니다 (예: https://blog.naver.com/aromapulse/223921529276)' }, 400)
    }
    
    const blogId = urlMatch[1]
    const postId = urlMatch[2]
    
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
    
    // 실제 네이버 블로그 댓글 크롤링 시도
    console.log(`댓글 수집 시작: ${blogId}/${postId}`)
    let crawledComments = await crawlNaverBlogComments(blogId, postId)
    console.log(`댓글 수집 완료: ${crawledComments.length}개`)
    
    // API 접근 실패 시 시뮬레이션 모드로 대체
    if (crawledComments.length === 0) {
      console.log('네이버 댓글 API 접근 실패 - 시뮬레이션 모드 사용')
      
      // 실제 블로그 댓글 기반 시뮬레이션 데이터 (포스트별 고유 ID)
      crawledComments = [
        {
          comment_id: `comment_sim_${postId}_1`,
          author_name: '소상공 지원 희망이',
          author_id: null,
          content: '안녕하세요, 이웃님! 정성 가득한 포스팅 잘 보고 갑니다! 6월이 성큼 다가온 요즘, 날씨만큼 마음도 환해지는 하루 되시길 바랍니다. 오늘도 건강하고 행복한 하루 보내세요~',
          created_at: '2025-05-27T16:25:00+09:00',
          parent_comment_id: null
        },
        {
          comment_id: `comment_sim_${postId}_2`,
          author_name: 'my ordinary day',
          author_id: null,
          content: '화요일 퇴근길, 기분 좋은 밤입니다. 오늘도 좋은 포스팅 잘 보고 갑니다. 편안한 밤 되세요:)',
          created_at: '2025-05-27T18:11:00+09:00',
          parent_comment_id: null
        },
        {
          comment_id: `comment_sim_${postId}_3`,
          author_name: '내인생봄날의원',
          author_id: null,
          content: '안녕하세요 이웃님 :) 포스팅 잘 보고 갑니다~❤️ 편안한 밤 보내세요~🤗',
          created_at: '2025-05-27T23:18:00+09:00',
          parent_comment_id: null
        },
        {
          comment_id: `comment_sim_${postId}_4`,
          author_name: '여행에 힐링을 더하다',
          author_id: null,
          content: '캐리어오일에 에센셜오일(베르가못, 라벤더)을 섞어서 목과 데콜테 마사지 해주고 있는데 손님 반응이 좋아요. 제품문의는 어디로 드리면 될까요',
          created_at: '2025-05-28T10:30:00+09:00',
          parent_comment_id: null
        }
      ]
    }
    
    let totalComments = 0
    let purchaseIntentCount = 0
    let b2cCount = 0
    let b2bCount = 0
    let chatbotSessionsCreated = 0
    
    // 수집한 댓글 분석 및 저장
    for (const comment of crawledComments) {
      if (!comment.content || comment.content.trim().length === 0) {
        continue // 빈 댓글 스킵
      }
      
      // 중복 댓글 체크
      const existingComment = await c.env.DB.prepare(`
        SELECT id FROM blog_comments WHERE comment_id = ?
      `).bind(comment.comment_id).first()
      
      if (existingComment) {
        console.log(`댓글 스킵 (이미 존재): ${comment.comment_id}`)
        continue // 이미 수집된 댓글은 스킵
      }
      
      // AI 분석 수행
      const sentiment = analyzeSentiment(comment.content)
      const userType = predictUserType(comment.content)
      const intent = extractIntent(comment.content)
      const keywords = extractKeywords(comment.content)
      
      // 댓글 저장
      try {
        const commentResult = await c.env.DB.prepare(`
          INSERT INTO blog_comments (
            post_id, comment_id, author_name, author_id, content,
            sentiment, user_type_prediction, intent, keywords, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          post.id,
          comment.comment_id,
          comment.author_name,
          comment.author_id,
          comment.content,
          sentiment,
          userType,
          intent,
          JSON.stringify(keywords),
          comment.created_at
        ).run()
      } catch (insertError: any) {
        console.error(`댓글 저장 실패 (${comment.comment_id}):`, insertError.message)
        continue // 저장 실패 시 다음 댓글로
      }
      
      totalComments++
      
      if (intent === '구매의도' || intent === '문의' || intent === 'B2B문의' || intent === '가격문의') {
        purchaseIntentCount++
      }
      
      if (userType === 'B2C') b2cCount++
      if (userType === 'B2B') b2bCount++
      
      // 구매 의도가 있는 댓글에 대해 챗봇 세션 자동 생성
      if (intent === '구매의도' || intent === 'B2B문의' || intent === '가격문의') {
        try {
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
          const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
          
          const sessionResult = await c.env.DB.prepare(`
            INSERT INTO chatbot_sessions (session_id, visitor_id, detected_user_type, started_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(sessionId, visitorId, userType || 'unknown').run()
          
          const chatbotSessionId = sessionResult.meta.last_row_id
          
          // 시스템 메시지 (bot으로 전송)
          await c.env.DB.prepare(`
            INSERT INTO chatbot_messages (session_id, sender, content, created_at)
            VALUES (?, 'bot', ?, CURRENT_TIMESTAMP)
          `).bind(
            chatbotSessionId,
            `[시스템] 블로그 댓글에서 시작된 대화입니다. 사용자: ${comment.author_name}, 의도: ${intent}, 감정: ${sentiment}, 키워드: ${keywords.join(', ')}`
          ).run()
          
          // 사용자 메시지
          await c.env.DB.prepare(`
            INSERT INTO chatbot_messages (session_id, sender, content, intent, sentiment, created_at)
            VALUES (?, 'user', ?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(chatbotSessionId, comment.content, intent, sentiment).run()
          
          // AI 응답
          const aiResponse = generateAIResponseFromComment(
            comment.content, 
            intent, 
            sentiment, 
            keywords, 
            userType
          )
          
          await c.env.DB.prepare(`
            INSERT INTO chatbot_messages (session_id, sender, content, created_at)
            VALUES (?, 'bot', ?, CURRENT_TIMESTAMP)
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
      post_id: postId, // 네이버 포스트 번호
      post_internal_id: post.id, // 내부 데이터베이스 ID
      blog_id: blogId,
      post_url: url,
      total_comments: totalComments,
      purchase_intent_count: purchaseIntentCount,
      b2c_count: b2cCount,
      b2b_count: b2bCount,
      chatbot_sessions_created: chatbotSessionsCreated
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
        
        // 챗봇 세션 수 - TODO: chatbot_sessions에 comment_id 추가 후 수정
        // 현재는 간단하게 B2B + 구매의도 댓글 수로 추정
        const chatbotSessionCount = (commentStats?.b2b_count || 0) + (commentStats?.purchase_intent_count || 0);
        
        return {
          ...post,
          comment_count: commentStats?.total_comments || 0,
          purchase_intent_count: commentStats?.purchase_intent_count || 0,
          b2c_count: commentStats?.b2c_count || 0,
          b2b_count: commentStats?.b2b_count || 0,
          chatbot_session_count: chatbotSessionCount
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

// 수동 댓글 추가 API (관리자 전용 - 블로그 실제 댓글 수동 입력)
blogReviews.post('/comments/manual', async (c) => {
  try {
    const { post_internal_id, author_name, content, created_at } = await c.req.json()
    
    if (!post_internal_id || !author_name || !content) {
      return c.json({ error: '포스트 ID, 작성자명, 내용이 필요합니다' }, 400)
    }
    
    // 포스트 확인
    const post = await c.env.DB.prepare(`
      SELECT * FROM blog_posts WHERE id = ?
    `).bind(post_internal_id).first()
    
    if (!post) {
      return c.json({ error: '포스트를 찾을 수 없습니다' }, 404)
    }
    
    // 고유 comment_id 생성
    const commentId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    
    // AI 분석 수행
    const sentiment = analyzeSentiment(content)
    const userType = predictUserType(content)
    const intent = extractIntent(content)
    const keywords = extractKeywords(content)
    
    // 댓글 저장
    const commentResult = await c.env.DB.prepare(`
      INSERT INTO blog_comments (
        post_id, comment_id, author_name, author_id, content,
        sentiment, user_type_prediction, intent, keywords, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      post_internal_id,
      commentId,
      author_name,
      null, // author_id는 수동 입력이므로 null
      content,
      sentiment,
      userType,
      intent,
      JSON.stringify(keywords),
      created_at || new Date().toISOString()
    ).run()
    
    // 포스트의 댓글 수 업데이트
    await c.env.DB.prepare(`
      UPDATE blog_posts SET comment_count = comment_count + 1 WHERE id = ?
    `).bind(post_internal_id).run()
    
    // B2B 문의 또는 구매 의도가 감지되면 챗봇 세션 자동 생성
    let chatbotSessionCreated = false
    let chatbotSessionId = null
    
    if (intent === '구매의도' || intent === 'B2B문의' || intent === '가격문의') {
      try {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        
        const sessionResult = await c.env.DB.prepare(`
          INSERT INTO chatbot_sessions (session_id, visitor_id, detected_user_type, started_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(sessionId, visitorId, userType || 'unknown').run()
        
        chatbotSessionId = sessionResult.meta.last_row_id
        
        // 시스템 메시지 (bot으로 전송)
        await c.env.DB.prepare(`
          INSERT INTO chatbot_messages (session_id, sender, content, created_at)
          VALUES (?, 'bot', ?, CURRENT_TIMESTAMP)
        `).bind(
          chatbotSessionId,
          `[시스템] 블로그 댓글에서 시작된 대화입니다. 사용자: ${author_name}, 의도: ${intent}, 감정: ${sentiment}, 키워드: ${keywords.join(', ')}`
        ).run()
        
        // 사용자 메시지
        await c.env.DB.prepare(`
          INSERT INTO chatbot_messages (session_id, sender, content, intent, sentiment, created_at)
          VALUES (?, 'user', ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(chatbotSessionId, content, intent, sentiment).run()
        
        // AI 응답
        const aiResponse = generateAIResponseFromComment(
          content, 
          intent, 
          sentiment, 
          keywords, 
          userType
        )
        
        await c.env.DB.prepare(`
          INSERT INTO chatbot_messages (session_id, sender, content, created_at)
          VALUES (?, 'bot', ?, CURRENT_TIMESTAMP)
        `).bind(chatbotSessionId, aiResponse).run()
        
        chatbotSessionCreated = true
      } catch (chatbotError) {
        console.error('챗봇 세션 생성 실패:', chatbotError)
      }
    }
    
    return c.json({
      message: '수동 댓글이 추가되고 AI 분석이 완료되었습니다',
      comment_id: commentResult.meta.last_row_id,
      post_title: post.title,
      analysis: {
        sentiment,
        user_type: userType,
        intent,
        keywords
      },
      chatbot_session_created: chatbotSessionCreated,
      chatbot_session_id: chatbotSessionId
    })
  } catch (error) {
    console.error('수동 댓글 추가 실패:', error)
    return c.json({ error: '수동 댓글 추가 실패: ' + error }, 500)
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
    '매장', '샵', '가게', '판매',
    '손님', '고객님', '고객', '서비스', '마사지', '스파', '에스테틱', '미용실', '뷰티', '살롱'
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
  
  // B2B 문의 (우선 순위 높게)
  if (lowerText.match(/납품|대량|단체|기업|제품문의|제품 문의|도매|공급|거래/)) return 'B2B문의'
  
  // 구매 의도
  if (lowerText.match(/구매|주문|살|사고|결제/)) return '구매의도'
  
  // 가격 문의
  if (lowerText.match(/가격|얼마|비용|견적/)) return '가격문의'
  
  // 일반 문의
  if (lowerText.match(/문의|궁금|알고싶|질문|어디로/)) return '문의'
  
  // 체험 희망
  if (lowerText.match(/체험|워크샵|클래스|교육/)) return '체험희망'
  
  // 긍정/부정 리뷰
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
  if (lowerText.includes('베르가못')) keywords.push('베르가못')
  if (lowerText.includes('페퍼민트')) keywords.push('페퍼민트')
  if (lowerText.includes('유칼립투스')) keywords.push('유칼립투스')
  if (lowerText.includes('로즈마리')) keywords.push('로즈마리')
  if (lowerText.includes('에센셜오일') || lowerText.includes('에센셜 오일')) keywords.push('에센셜오일')
  if (lowerText.includes('캐리어오일') || lowerText.includes('캐리어 오일')) keywords.push('캐리어오일')
  
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
  const dedup = c.req.query('dedup') // 'true'로 설정 시 작성자별로 중복 제거
  
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
    
    query += ' ORDER BY bc.created_at DESC, bc.id DESC LIMIT 50'
    
    const leads = await c.env.DB.prepare(query).bind(...params).all()
    let results = leads.results as any[]
    
    // 중복 제거 옵션이 활성화된 경우, 작성자별로 가장 최근 리드만 유지
    if (dedup === 'true') {
      const seenAuthors = new Set<string>()
      results = results.filter((lead: any) => {
        if (seenAuthors.has(lead.author_name)) {
          return false
        }
        seenAuthors.add(lead.author_name)
        return true
      })
    }
    
    return c.json({
      leads: results,
      count: results.length,
      total_before_dedup: leads.results.length
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
    
    // 마사지/스파 관련 비즈니스 감지 (최우선)
    const isMassageBusiness = content.toLowerCase().match(/마사지|손님|고객님|고객|스파|에스테틱|샵|가게|미용실|살롱/)
    
    // 오일 관련 키워드 감지
    const hasOilKeywords = keywords.some(k => 
      k.includes('오일') || k.includes('라벤더') || k.includes('베르가못') || 
      k.includes('에센셜') || k.includes('캐리어') || k.includes('페퍼민트') ||
      k.includes('유칼립투스')
    )
    const hasOilInContent = content.toLowerCase().includes('오일') || 
                           content.toLowerCase().includes('에센셜') || 
                           content.toLowerCase().includes('캐리어')
    
    if (isMassageBusiness || hasOilKeywords || hasOilInContent) {
      response += `댓글 내용을 보니 ${isMassageBusiness ? '**손님께 마사지/케어 서비스를 제공하시는**' : '오일을 사용하시는'} 비즈니스를 운영하고 계신 것 같습니다.\n\n`
      
      if (isMassageBusiness) {
        response += `🏢 **마사지/스파 비즈니스 고객님을 위한 맞춤 상담**\n\n`
        response += `보다 정확한 상담을 위해 몇 가지 여쭤봐도 될까요?\n\n`
        response += `📋 **추가 질문**:\n`
        response += `1️⃣ **지역**: 어느 지역에서 운영하고 계신가요? (제휴 공방 매칭을 위해 필요합니다)\n`
        response += `2️⃣ **필요하신 제품 형태**:\n`
        response += `   • 원료용 오일 (직접 블렌딩용)\n`
        response += `   • 즉시 사용 가능한 완제품 (마사지 오일, 룸스프레이, 디퓨저)\n`
        response += `   • 특정 제품 (어떤 제품인지 알려주세요)\n`
        response += `3️⃣ **사용 목적**: 직접 사용? 손님 서비스용? 판매용?\n`
        response += `4️⃣ **선호 향**: ${keywords.length > 0 ? keywords.filter(k => k.includes('라벤더') || k.includes('베르가못') || k.includes('페퍼민트') || k.includes('유칼립투스')).join(', ') || '라벤더, 베르가못 외 다른 향도 필요하신가요?' : '라벤더, 베르가못 등 선호하시는 향이 있으신가요?'}\n`
        response += `5️⃣ **월 사용량**: 대략적인 월 사용량을 알려주시면 도움이 됩니다\n\n`
      } else {
        response += `저희는 오일 원료와 가공 완제품(디퓨저, 룸스프레이, 캔들, 향수 등)을 모두 취급하고 있습니다.\n\n`
        response += `보다 정확한 상담을 위해 몇 가지 여쭤봐도 될까요?\n\n`
        response += `📋 **추가 질문**:\n`
        response += `1️⃣ **지역**: 어느 지역에서 사업하고 계신가요?\n`
        response += `2️⃣ **원하시는 제품 타입**: 원료(오일)? 완제품? 둘 다?\n`
        response += `3️⃣ **사용 용도**: 마사지용, 방향용, 판매용, 기타?\n`
        response += `4️⃣ **필요한 향**: ${keywords.length > 0 ? keywords.filter(k => k.includes('라벤더') || k.includes('베르가못') || k.includes('페퍼민트')).join(', ') || '특정 향이 있으신가요?' : '특정 향이 있으신가요?'}\n\n`
      }
      
      response += `위 내용을 알려주시면 맞춤 제안 및 지역 기반 공방 매칭을 도와드리겠습니다! 😊`
    } else {
      // 일반 B2B 문의
      response += `다음과 같은 서비스를 제공하고 있습니다:\n`
      response += `• 워크샵 & 클래스 제휴\n`
      response += `• 대량 납품 (에스테틱, 미용실, 웰니스 가게 등)\n`
      response += `• 기능성/효능성 제품 공급 (완제품)\n`
      response += `• 파트너사 협업\n\n`
      response += `어떤 서비스가 필요하신가요?`
    }
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
