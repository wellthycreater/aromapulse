import { Hono } from 'hono';
import type { Bindings } from '../types';

const reviews = new Hono<{ Bindings: Bindings }>();

// 리뷰 작성 (자체 플랫폼)
reviews.post('/', async (c) => {
  try {
    const { user_id, post_id, content, rating } = await c.req.json();
    
    if (!content || content.trim().length === 0) {
      return c.json({ error: '리뷰 내용을 입력해주세요' }, 400);
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO reviews (user_id, post_id, content, rating, source)
       VALUES (?, ?, ?, ?, 'platform')`
    ).bind(user_id || null, post_id || null, content, rating || null).run();
    
    return c.json({ 
      message: '리뷰가 작성되었습니다',
      review_id: result.meta.last_row_id 
    }, 201);
    
  } catch (error) {
    console.error('Create review error:', error);
    return c.json({ error: '리뷰 작성 실패' }, 500);
  }
});

// 리뷰 목록 조회
reviews.get('/', async (c) => {
  try {
    const source = c.req.query('source'); // blog or platform
    const is_tagged = c.req.query('is_tagged'); // 0 or 1
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let sql = 'SELECT r.*, u.name as user_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE 1=1';
    const params: any[] = [];
    
    if (source) {
      sql += ' AND r.source = ?';
      params.push(source);
    }
    
    if (is_tagged !== undefined) {
      sql += ' AND r.is_tagged = ?';
      params.push(parseInt(is_tagged));
    }
    
    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = c.env.DB.prepare(sql);
    const { results } = await stmt.bind(...params).all();
    
    // Parse JSON fields
    const reviews = results.map((r: any) => ({
      ...r,
      keywords: r.keywords ? JSON.parse(r.keywords) : [],
    }));
    
    return c.json({ reviews, total: results.length });
    
  } catch (error) {
    console.error('Get reviews error:', error);
    return c.json({ error: '리뷰 조회 실패' }, 500);
  }
});

// 리뷰 상세 조회
reviews.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const review = await c.env.DB.prepare(
      'SELECT r.*, u.name as user_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = ?'
    ).bind(id).first();
    
    if (!review) {
      return c.json({ error: '리뷰를 찾을 수 없습니다' }, 404);
    }
    
    // Parse JSON fields
    const result = {
      ...review,
      keywords: review.keywords ? JSON.parse(review.keywords as string) : [],
    };
    
    return c.json({ review: result });
    
  } catch (error) {
    console.error('Get review error:', error);
    return c.json({ error: '리뷰 조회 실패' }, 500);
  }
});

// 블로그 댓글 목록 조회
reviews.get('/blog-comments', async (c) => {
  try {
    const is_tagged = c.req.query('is_tagged');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let sql = 'SELECT bc.*, bp.title as post_title FROM blog_comments bc LEFT JOIN blog_posts bp ON bc.post_id = bp.id WHERE 1=1';
    const params: any[] = [];
    
    if (is_tagged !== undefined) {
      sql += ' AND bc.is_tagged = ?';
      params.push(parseInt(is_tagged));
    }
    
    sql += ' ORDER BY bc.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = c.env.DB.prepare(sql);
    const { results } = await stmt.bind(...params).all();
    
    // Parse JSON fields
    const comments = results.map((c: any) => ({
      ...c,
      keywords: c.keywords ? JSON.parse(c.keywords) : [],
    }));
    
    return c.json({ comments, total: results.length });
    
  } catch (error) {
    console.error('Get blog comments error:', error);
    return c.json({ error: '블로그 댓글 조회 실패' }, 500);
  }
});

export default reviews;
