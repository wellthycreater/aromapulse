import { Hono } from 'hono';
import type { Bindings } from '../types';

const blog = new Hono<{ Bindings: Bindings }>();

// 블로그 포스트 목록 조회
blog.get('/posts', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM blog_posts ORDER BY published_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all();
    
    // Parse JSON fields
    const posts = results.map((p: any) => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
    }));
    
    return c.json({ posts, total: results.length });
    
  } catch (error) {
    console.error('Get blog posts error:', error);
    return c.json({ error: '블로그 포스트 조회 실패' }, 500);
  }
});

// 블로그 포스트 상세 조회
blog.get('/posts/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const post = await c.env.DB.prepare(
      'SELECT * FROM blog_posts WHERE id = ?'
    ).bind(id).first();
    
    if (!post) {
      return c.json({ error: '포스트를 찾을 수 없습니다' }, 404);
    }
    
    // 댓글 조회
    const { results: comments } = await c.env.DB.prepare(
      'SELECT * FROM blog_comments WHERE post_id = ? ORDER BY created_at ASC'
    ).bind(id).all();
    
    // Parse JSON fields
    const result = {
      ...post,
      tags: post.tags ? JSON.parse(post.tags as string) : [],
      comments: comments.map((c: any) => ({
        ...c,
        keywords: c.keywords ? JSON.parse(c.keywords) : [],
      }))
    };
    
    return c.json({ post: result });
    
  } catch (error) {
    console.error('Get blog post error:', error);
    return c.json({ error: '블로그 포스트 조회 실패' }, 500);
  }
});

// RSS 피드에서 블로그 포스트 수집 (관리자 전용)
blog.post('/collect-rss', async (c) => {
  try {
    // RSS 피드 URL
    const rssUrl = 'https://rss.blog.naver.com/aromapulse.xml';
    
    // RSS 파싱 (실제로는 XML 파서 필요)
    // 여기서는 간단히 구조만 제공
    const response = await fetch(rssUrl);
    const xmlText = await response.text();
    
    // TODO: XML 파싱하여 포스트 정보 추출
    // 각 포스트마다 DB에 저장
    
    return c.json({ 
      message: 'RSS 수집 완료 (구현 필요)',
      rss_url: rssUrl
    });
    
  } catch (error) {
    console.error('RSS collection error:', error);
    return c.json({ error: 'RSS 수집 실패' }, 500);
  }
});

// 블로그 댓글 수집 (관리자 전용 - 크롤링)
blog.post('/collect-comments', async (c) => {
  try {
    const { post_id } = await c.req.json();
    
    if (!post_id) {
      return c.json({ error: 'post_id가 필요합니다' }, 400);
    }
    
    // 포스트 정보 조회
    const post = await c.env.DB.prepare(
      'SELECT * FROM blog_posts WHERE id = ?'
    ).bind(post_id).first();
    
    if (!post) {
      return c.json({ error: '포스트를 찾을 수 없습니다' }, 404);
    }
    
    // TODO: 네이버 블로그 댓글 크롤링
    // 1. post.link에서 logNo 추출
    // 2. 네이버 댓글 API 호출 또는 크롤링
    // 3. 댓글 데이터 파싱 후 DB 저장
    
    return c.json({ 
      message: '댓글 수집 완료 (구현 필요)',
      post_link: post.link
    });
    
  } catch (error) {
    console.error('Comment collection error:', error);
    return c.json({ error: '댓글 수집 실패' }, 500);
  }
});

export default blog;
