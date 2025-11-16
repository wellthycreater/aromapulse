import { Hono } from 'hono';
import type { Bindings } from '../types';

const products = new Hono<{ Bindings: Bindings }>();

// 제품 목록 조회 (필터링)
products.get('/', async (c) => {
  try {
    const concept = c.req.query('concept'); // symptom_care or refresh
    const category = c.req.query('category'); // 제품 타입
    const region = c.req.query('region'); // 지역
    const symptom = c.req.query('symptom'); // 증상
    const isActive = c.req.query('is_active') !== '0'; // 활성 상태 (기본 true)
    
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];
    
    if (concept) {
      sql += ' AND concept = ?';
      params.push(concept);
    }
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (region) {
      sql += ' AND (workshop_location = ? OR workshop_location IS NULL)';
      params.push(region);
    }
    
    if (symptom) {
      sql += ' AND description LIKE ?';
      params.push(`%${symptom}%`);
    }
    
    // 기본적으로 활성화된 제품만 조회
    if (isActive) {
      sql += ' AND is_active = 1';
    }
    
    sql += ' ORDER BY created_at ASC';
    
    const stmt = c.env.DB.prepare(sql);
    const { results } = await stmt.bind(...params).all();
    
    // Parse JSON fields
    const products = results.map((p: any) => ({
      ...p,
      symptoms: p.symptoms ? JSON.parse(p.symptoms) : [],
    }));
    
    return c.json({ products });
    
  } catch (error) {
    console.error('Get products error:', error);
    return c.json({ error: '제품 조회 실패' }, 500);
  }
});

// 제품 상세 조회
products.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const product = await c.env.DB.prepare(
      'SELECT * FROM products WHERE id = ?'
    ).bind(id).first();
    
    if (!product) {
      return c.json({ error: '제품을 찾을 수 없습니다' }, 404);
    }
    
    // Parse JSON fields
    const result = {
      ...product,
      symptoms: product.symptoms ? JSON.parse(product.symptoms as string) : [],
    };
    
    return c.json({ product: result });
    
  } catch (error) {
    console.error('Get product error:', error);
    return c.json({ error: '제품 조회 실패' }, 500);
  }
});

// Rule 기반 추천
products.get('/recommend/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    // 사용자 정보 조회
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();
    
    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);
    }
    
    const userSymptoms = user.symptoms ? JSON.parse(user.symptoms as string) : [];
    const userRegion = user.region;
    
    // 추천 로직: 증상 + 지역 매칭
    let sql = `
      SELECT * FROM products 
      WHERE status = 'active'
    `;
    const params: any[] = [];
    
    // 증상 매칭
    if (userSymptoms.length > 0) {
      const symptomConditions = userSymptoms.map(() => 'symptoms LIKE ?').join(' OR ');
      sql += ` AND (${symptomConditions})`;
      userSymptoms.forEach((symptom: string) => {
        params.push(`%${symptom}%`);
      });
    }
    
    // 지역 매칭 (우선순위: 같은 지역 > 전국)
    if (userRegion) {
      sql += ` AND (region = ? OR region = '전국')`;
      params.push(userRegion);
    }
    
    sql += ' ORDER BY CASE WHEN region = ? THEN 0 ELSE 1 END, created_at DESC LIMIT 10';
    params.push(userRegion || '전국');
    
    const stmt = c.env.DB.prepare(sql);
    const { results } = await stmt.bind(...params).all();
    
    // Parse JSON and log recommendation
    const recommendations = results.map((p: any) => ({
      ...p,
      symptoms: p.symptoms ? JSON.parse(p.symptoms) : [],
    }));
    
    // 추천 로그 저장
    for (const product of recommendations) {
      await c.env.DB.prepare(
        'INSERT INTO recommendation_logs (user_id, product_id, reason) VALUES (?, ?, ?)'
      ).bind(userId, product.id, '증상+지역 매칭').run();
    }
    
    return c.json({ 
      recommendations,
      reason: '증상과 지역 기반 추천'
    });
    
  } catch (error) {
    console.error('Recommend error:', error);
    return c.json({ error: '추천 실패' }, 500);
  }
});

export default products;
