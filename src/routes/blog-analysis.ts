import { Hono } from 'hono';
import type { Bindings } from '../types';

const blogAnalysis = new Hono<{ Bindings: Bindings }>();

// AI 기반 댓글 분석 함수 (실제로는 OpenAI/Claude API 사용)
function analyzeComment(content: string): {
  userType: 'B2C' | 'B2B' | 'unknown';
  confidence: number;
  b2cStressType?: 'daily' | 'work';
  b2cDetailCategory?: string;
  b2bBusinessType?: 'perfumer' | 'company' | 'shop' | 'independent';
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  intent: string;
  intentKeywords: string[];
  contextTags: string[];
  mentionedProducts: string[];
  painPoints: string[];
  nextAction: string;
  recommendedProducts: number[];
  conversionProbability: number;
} {
  const lowerContent = content.toLowerCase();
  
  // B2B 키워드 감지
  const b2bKeywords = ['공방', '워크샵', '체험', '납품', '대량', '기업', '회사', '매장', '샵', '비즈니스', '협업'];
  const isB2B = b2bKeywords.some(keyword => lowerContent.includes(keyword));
  
  // B2C 스트레스 타입 감지
  const dailyStressKeywords = ['학생', '취준', '엄마', '아빠', '육아', '돌봄'];
  const workStressKeywords = ['직장', '업무', '회사', '야근', '스트레스', '피곤'];
  
  let b2cStressType: 'daily' | 'work' | undefined;
  let b2cDetailCategory: string | undefined;
  
  if (dailyStressKeywords.some(k => lowerContent.includes(k))) {
    b2cStressType = 'daily';
    if (lowerContent.includes('학생')) b2cDetailCategory = 'student';
    else if (lowerContent.includes('취준')) b2cDetailCategory = 'job_seeker';
    else if (lowerContent.includes('엄마')) b2cDetailCategory = 'working_mom';
  } else if (workStressKeywords.some(k => lowerContent.includes(k))) {
    b2cStressType = 'work';
  }
  
  // 감성 분석
  const positiveKeywords = ['좋아요', '감사', '최고', '만족', '추천', '훌륭', '완벽'];
  const negativeKeywords = ['별로', '실망', '아쉽', '나쁘', '안좋', '불만'];
  
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  let sentimentScore = 0;
  
  const positiveCount = positiveKeywords.filter(k => lowerContent.includes(k)).length;
  const negativeCount = negativeKeywords.filter(k => lowerContent.includes(k)).length;
  
  if (positiveCount > negativeCount) {
    sentiment = 'positive';
    sentimentScore = Math.min(1.0, 0.5 + positiveCount * 0.2);
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
    sentimentScore = Math.max(-1.0, -0.5 - negativeCount * 0.2);
  }
  
  // 의도 분석
  let intent = 'experience_sharing';
  const intentKeywords: string[] = [];
  
  if (lowerContent.includes('구매') || lowerContent.includes('살') || lowerContent.includes('사고싶')) {
    intent = 'purchase_intent';
    intentKeywords.push('purchase', 'buy');
  } else if (lowerContent.includes('문의') || lowerContent.includes('궁금') || lowerContent.includes('어떻게')) {
    intent = 'inquiry';
    intentKeywords.push('question', 'inquiry');
  } else if (lowerContent.includes('불만') || lowerContent.includes('문제')) {
    intent = 'complaint';
    intentKeywords.push('complaint', 'issue');
  }
  
  // 컨텍스트 태그
  const contextTags: string[] = [];
  if (lowerContent.includes('불면') || lowerContent.includes('잠')) contextTags.push('insomnia');
  if (lowerContent.includes('우울') || lowerContent.includes('기분')) contextTags.push('depression');
  if (lowerContent.includes('불안') || lowerContent.includes('긴장')) contextTags.push('anxiety');
  if (lowerContent.includes('스트레스')) contextTags.push('stress');
  if (lowerContent.includes('선물')) contextTags.push('gift');
  
  // 고충 분석
  const painPoints: string[] = [];
  if (lowerContent.includes('가격')) painPoints.push('price_concern');
  if (lowerContent.includes('배송')) painPoints.push('shipping_concern');
  if (lowerContent.includes('효과')) painPoints.push('effectiveness_doubt');
  
  // 다음 행동 예측
  let nextAction = 'needs_more_info';
  let conversionProbability = 0.3;
  
  if (intent === 'purchase_intent' && sentiment === 'positive') {
    nextAction = 'likely_purchase';
    conversionProbability = 0.8;
  } else if (painPoints.includes('price_concern')) {
    nextAction = 'price_sensitive';
    conversionProbability = 0.5;
  } else if (intent === 'inquiry') {
    nextAction = 'needs_consultation';
    conversionProbability = 0.6;
  }
  
  // 추천 제품 (간단한 매칭)
  const recommendedProducts: number[] = [];
  if (contextTags.includes('insomnia')) recommendedProducts.push(1);
  if (contextTags.includes('stress')) recommendedProducts.push(2);
  
  return {
    userType: isB2B ? 'B2B' : (b2cStressType ? 'B2C' : 'unknown'),
    confidence: isB2B ? 0.85 : (b2cStressType ? 0.75 : 0.4),
    b2cStressType,
    b2cDetailCategory,
    b2bBusinessType: isB2B ? 'company' : undefined,
    sentiment,
    sentimentScore,
    intent,
    intentKeywords,
    contextTags,
    mentionedProducts: [],
    painPoints,
    nextAction,
    recommendedProducts,
    conversionProbability
  };
}

// 블로그 포스트 목록 조회
blogAnalysis.get('/posts', async (c) => {
  const { env } = c;
  const { category, limit = 20, offset = 0 } = c.req.query();
  
  try {
    let query = `
      SELECT * FROM blog_posts
      ${category ? 'WHERE category = ?' : ''}
      ORDER BY published_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const params = category ? [category, limit, offset] : [limit, offset];
    const { results } = await env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      posts: results,
      total: results.length
    });
  } catch (error) {
    console.error('블로그 포스트 조회 오류:', error);
    return c.json({ error: '포스트 조회 실패' }, 500);
  }
});

// 블로그 포스트 상세 + 댓글
blogAnalysis.get('/posts/:id', async (c) => {
  const { env } = c;
  const postId = c.req.param('id');
  
  try {
    // 포스트 조회
    const post = await env.DB.prepare(
      'SELECT * FROM blog_posts WHERE id = ?'
    ).bind(postId).first();
    
    if (!post) {
      return c.json({ error: '포스트를 찾을 수 없습니다' }, 404);
    }
    
    // 댓글 조회 (분석 데이터 포함)
    const { results: comments } = await env.DB.prepare(`
      SELECT 
        bc.*,
        GROUP_CONCAT(pr.product_id) as recommended_product_ids
      FROM blog_comments bc
      LEFT JOIN product_recommendations pr ON bc.id = pr.comment_id
      WHERE bc.post_id = ?
      GROUP BY bc.id
      ORDER BY bc.created_at DESC
    `).bind(postId).all();
    
    return c.json({
      post,
      comments,
      comment_count: comments.length
    });
  } catch (error) {
    console.error('포스트 상세 조회 오류:', error);
    return c.json({ error: '조회 실패' }, 500);
  }
});

// 댓글 분석 및 저장
blogAnalysis.post('/comments/analyze', async (c) => {
  const { env } = c;
  const { post_id, comment_id, author_name, author_id, content, published_at } = await c.req.json();
  
  if (!post_id || !content) {
    return c.json({ error: 'post_id와 content는 필수입니다' }, 400);
  }
  
  try {
    // AI 분석 수행
    const analysis = analyzeComment(content);
    
    // 댓글 저장
    const result = await env.DB.prepare(`
      INSERT INTO blog_comments (
        comment_id, post_id, author_name, author_id, content,
        predicted_user_type, confidence,
        b2c_stress_type, b2c_detail_category, b2b_business_type,
        sentiment, sentiment_score,
        intent, keywords,
        context_tags, mentioned_products, pain_points,
        next_action, recommended_products, conversion_probability
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      comment_id || null,
      post_id,
      author_name || null,
      author_id || null,
      content,
      analysis.userType,
      analysis.confidence,
      analysis.b2cStressType || null,
      analysis.b2cDetailCategory || null,
      analysis.b2bBusinessType || null,
      analysis.sentiment,
      analysis.sentimentScore,
      analysis.intent,
      JSON.stringify(analysis.intentKeywords),
      JSON.stringify(analysis.contextTags),
      JSON.stringify(analysis.mentionedProducts),
      JSON.stringify(analysis.painPoints),
      analysis.nextAction,
      JSON.stringify(analysis.recommendedProducts),
      analysis.conversionProbability
    ).run();
    
    const commentDbId = result.meta.last_row_id;
    
    // 행동 예측 저장 (user_behavior_predictions 테이블에만 저장)
    try {
      await env.DB.prepare(`
        INSERT INTO user_behavior_predictions (comment_id, predicted_action, confidence, reasoning)
        VALUES (?, ?, ?, ?)
      `).bind(
        commentDbId,
        analysis.nextAction,
        analysis.conversionProbability,
        `Intent: ${analysis.intent}, Sentiment: ${analysis.sentiment}, Context: ${analysis.contextTags.join(', ')}`
      ).run();
    } catch (predictionError) {
      console.log('행동 예측 저장 건너뜀:', predictionError);
    }
    
    return c.json({
      success: true,
      comment_id: commentDbId,
      analysis
    });
  } catch (error) {
    console.error('댓글 분석 오류:', error);
    return c.json({ error: '분석 실패' }, 500);
  }
});

// 사용자 타입별 통계
blogAnalysis.get('/stats/user-types', async (c) => {
  const { env } = c;
  
  try {
    const { results } = await env.DB.prepare(`
      SELECT 
        predicted_user_type,
        COUNT(*) as count,
        AVG(conversion_probability) as avg_conversion_rate,
        AVG(confidence) as avg_confidence
      FROM blog_comments
      WHERE predicted_user_type IS NOT NULL
      GROUP BY predicted_user_type
    `).all();
    
    return c.json({ stats: results });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    return c.json({ error: '통계 조회 실패' }, 500);
  }
});

// 고전환율 댓글 목록 (회원가입 유도 대상)
blogAnalysis.get('/high-conversion-leads', async (c) => {
  const { env } = c;
  const { min_probability = 0.6 } = c.req.query();
  
  try {
    const { results } = await env.DB.prepare(`
      SELECT 
        bc.*,
        bp.title as post_title,
        bp.url as post_url
      FROM blog_comments bc
      JOIN blog_posts bp ON bc.post_id = bp.id
      WHERE bc.conversion_probability >= ?
      ORDER BY bc.conversion_probability DESC
      LIMIT 50
    `).bind(min_probability).all();
    
    return c.json({ leads: results });
  } catch (error) {
    console.error('리드 조회 오류:', error);
    return c.json({ error: '조회 실패' }, 500);
  }
});

// 회원가입 유도 표시 (signup_invited 컬럼이 없으므로 현재 비활성화)
blogAnalysis.post('/invite-signup/:commentId', async (c) => {
  const { env } = c;
  const commentId = c.req.param('commentId');
  
  try {
    // TODO: signup_invited 컬럼 추가 후 활성화
    // await env.DB.prepare(`
    //   UPDATE blog_comments
    //   SET signup_invited = 1
    //   WHERE id = ?
    // `).bind(commentId).run();
    
    return c.json({ success: true, message: '기능 준비 중' });
  } catch (error) {
    console.error('유도 표시 오류:', error);
    return c.json({ error: '표시 실패' }, 500);
  }
});

// 회원가입 전환 기록 (signup_converted, signup_conversions 테이블 없으므로 비활성화)
blogAnalysis.post('/signup-conversion', async (c) => {
  const { env } = c;
  const { comment_id, user_id, referrer_url, landing_page, conversion_time_seconds, incentive_offered } = await c.req.json();
  
  try {
    // TODO: signup_converted 컬럼 및 signup_conversions 테이블 추가 후 활성화
    // await env.DB.prepare(`
    //   UPDATE blog_comments
    //   SET signup_converted = 1, user_id = ?
    //   WHERE id = ?
    // `).bind(user_id, comment_id).run();
    
    return c.json({ success: true, message: '기능 준비 중' });
  } catch (error) {
    console.error('전환 기록 오류:', error);
    return c.json({ error: '기록 실패' }, 500);
  }
});

export default blogAnalysis;
