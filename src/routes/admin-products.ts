import { Hono } from 'hono';
import type { Bindings } from '../types';

const adminProducts = new Hono<{ Bindings: Bindings }>();

// 관리자 권한 확인 미들웨어
async function checkAdminAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: '인증이 필요합니다' }, 401);
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    // TODO: 실제 관리자 권한 확인 (현재는 모든 로그인 사용자 허용)
    // 추후 users 테이블에 is_admin 컬럼 추가 필요
    c.set('userId', userId);
    await next();
  } catch (error) {
    return c.json({ error: '인증 실패' }, 401);
  }
}

// 공개 제품 목록 조회 (사용자용 - 활성화된 제품만)
adminProducts.get('/public', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC`
    ).all();
    
    return c.json({ products: result.results });
  } catch (error: any) {
    console.error('제품 목록 조회 오류:', error);
    return c.json({ error: '제품 목록 조회 실패', details: error.message }, 500);
  }
});

// 모든 제품 목록 조회 (관리자 - 모든 제품)
adminProducts.get('/', checkAdminAuth, async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT * FROM products ORDER BY created_at DESC`
    ).all();
    
    return c.json({ products: result.results });
  } catch (error: any) {
    console.error('제품 목록 조회 오류:', error);
    return c.json({ error: '제품 목록 조회 실패', details: error.message }, 500);
  }
});

// 제품 상세 조회
adminProducts.get('/:id', checkAdminAuth, async (c) => {
  try {
    const id = c.req.param('id');
    
    const product = await c.env.DB.prepare(
      'SELECT * FROM products WHERE id = ?'
    ).bind(id).first();
    
    if (!product) {
      return c.json({ error: '제품을 찾을 수 없습니다' }, 404);
    }
    
    return c.json(product);
  } catch (error: any) {
    console.error('제품 조회 오류:', error);
    return c.json({ error: '제품 조회 실패', details: error.message }, 500);
  }
});

// 제품 생성
adminProducts.post('/', checkAdminAuth, async (c) => {
  try {
    const data = await c.req.json();
    const {
      name,
      description,
      concept,
      category,
      refresh_type,
      volume,
      price,
      thumbnail_image,
      detail_image,
      stock,
      workshop_name,
      workshop_location,
      workshop_address,
      workshop_contact
    } = data;
    
    // 필수 필드 검증
    if (!name || !concept || !price) {
      return c.json({ 
        error: '필수 필드가 누락되었습니다',
        required: ['name', 'concept', 'price']
      }, 400);
    }
    
    // 증상케어 제품인 경우 category 필수
    if (concept === 'symptom_care' && !category) {
      return c.json({ 
        error: '증상케어 제품은 카테고리가 필수입니다',
        required: ['category']
      }, 400);
    }
    
    // 리프레시 제품인 경우 refresh_type 필수
    if (concept === 'refresh' && !refresh_type) {
      return c.json({ 
        error: '리프레시 제품은 제품 유형이 필수입니다',
        required: ['refresh_type']
      }, 400);
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO products (
        name, description, concept, category, refresh_type, volume, items_per_box, price, thumbnail_image, detail_image, stock,
        workshop_name, workshop_location, workshop_address, workshop_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      name,
      description || null,
      concept,
      category || null,
      refresh_type || null,
      volume || null,
      data.items_per_box || 2,
      price,
      thumbnail_image || null,
      detail_image || null,
      stock || 0,
      workshop_name || null,
      workshop_location || null,
      workshop_address || null,
      workshop_contact || null
    ).run();
    
    return c.json({
      message: '제품이 등록되었습니다',
      id: result.meta.last_row_id
    }, 201);
  } catch (error: any) {
    console.error('제품 생성 오류:', error);
    return c.json({ error: '제품 등록 실패', details: error.message }, 500);
  }
});

// 제품 수정
adminProducts.put('/:id', checkAdminAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const {
      name,
      description,
      concept,
      category,
      refresh_type,
      volume,
      price,
      thumbnail_image,
      detail_image,
      stock,
      is_active,
      workshop_name,
      workshop_location,
      workshop_address,
      workshop_contact
    } = data;
    
    await c.env.DB.prepare(
      `UPDATE products SET
        name = ?, 
        description = ?, 
        concept = ?,
        category = ?, 
        refresh_type = ?,
        volume = ?,
        items_per_box = ?,
        price = ?,
        thumbnail_image = ?,
        detail_image = ?,
        stock = ?,
        is_active = ?,
        workshop_name = ?,
        workshop_location = ?,
        workshop_address = ?,
        workshop_contact = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      name,
      description,
      concept || 'symptom_care',
      category || null,
      refresh_type || null,
      volume || null,
      data.items_per_box || 2,
      price,
      thumbnail_image,
      detail_image,
      stock,
      is_active ?? 1,
      workshop_name || null,
      workshop_location || null,
      workshop_address || null,
      workshop_contact || null,
      id
    ).run();
    
    return c.json({ message: '제품이 수정되었습니다' });
  } catch (error: any) {
    console.error('제품 수정 오류:', error);
    return c.json({ error: '제품 수정 실패', details: error.message }, 500);
  }
});

// 제품 삭제 (하드 삭제)
adminProducts.delete('/:id', checkAdminAuth, async (c) => {
  try {
    const id = c.req.param('id');
    
    // 1단계: 제품 존재 여부 확인
    const product = await c.env.DB.prepare(
      'SELECT * FROM products WHERE id = ?'
    ).bind(id).first();
    
    if (!product) {
      return c.json({ error: '제품을 찾을 수 없습니다' }, 404);
    }
    
    // 2단계: 관련된 order_items 삭제 (Foreign Key 제약 해결)
    try {
      await c.env.DB.prepare(
        'DELETE FROM order_items WHERE product_id = ?'
      ).bind(id).run();
    } catch (e) {
      // order_items 테이블이 없거나 관련 데이터가 없는 경우 무시
      console.log('Order items 삭제 시도:', e);
    }
    
    // 3단계: 제품 완전 삭제
    await c.env.DB.prepare(
      'DELETE FROM products WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ 
      message: '제품이 삭제되었습니다',
      product_name: product.name 
    });
  } catch (error: any) {
    console.error('제품 삭제 오류:', error);
    return c.json({ error: '제품 삭제 실패', details: error.message }, 500);
  }
});

// 이미지 업로드 (Base64 Data URL 방식 - R2 Storage 대안)
adminProducts.post('/upload-image', checkAdminAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return c.json({ error: '이미지 파일이 없습니다' }, 400);
    }
    
    // 파일 확장자 확인
    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    if (!fileExt || !allowedExts.includes(fileExt)) {
      return c.json({ 
        error: '지원하지 않는 파일 형식입니다',
        allowed: allowedExts
      }, 400);
    }
    
    // 파일 크기 확인
    // SQLite BLOB 크기 제한 때문에 500KB로 제한 (Base64 인코딩 시 ~667KB)
    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
      return c.json({ 
        error: `이미지 파일 크기는 500KB 이하여야 합니다 (현재: ${Math.round(file.size / 1024)}KB)` 
      }, 400);
    }
    
    // R2 Storage가 설정되어 있으면 R2 사용
    if (c.env.IMAGES) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const newFileName = `products/${timestamp}-${randomStr}.${fileExt}`;
      
      const arrayBuffer = await file.arrayBuffer();
      await c.env.IMAGES.put(newFileName, arrayBuffer, {
        httpMetadata: {
          contentType: file.type
        }
      });
      
      const imageUrl = `/api/admin-products/images/${newFileName}`;
      
      return c.json({
        message: '이미지가 업로드되었습니다 (R2 Storage)',
        url: imageUrl,
        filename: newFileName
      });
    }
    
    // R2 Storage가 없으면 Base64 Data URL로 변환
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // Data URL 생성
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    return c.json({
      message: '이미지가 업로드되었습니다 (Base64)',
      url: dataUrl,
      filename: fileName,
      storage_type: 'base64'
    });
  } catch (error: any) {
    console.error('이미지 업로드 오류:', error);
    return c.json({ error: '이미지 업로드 실패', details: error.message }, 500);
  }
});

// 이미지 제공 (R2에서 가져오기)
adminProducts.get('/images/*', async (c) => {
  try {
    const path = c.req.path.replace('/api/admin-products/images/', '');
    
    const object = await c.env.IMAGES.get(path);
    
    if (!object) {
      return c.notFound();
    }
    
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error: any) {
    console.error('이미지 조회 오류:', error);
    return c.json({ error: '이미지를 찾을 수 없습니다' }, 404);
  }
});

// 대시보드 통계 조회
adminProducts.get('/dashboard/stats', checkAdminAuth, async (c) => {
  try {
    // 기간 필터 파라미터
    const startDate = c.req.query('start_date');
    const dateFilter = startDate ? `WHERE created_at >= '${startDate}'` : '';
    const blogDateFilter = startDate ? `WHERE published_at >= '${startDate}'` : '';
    
    // 제품 통계
    const productStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN concept = 'symptom_care' THEN 1 ELSE 0 END) as symptom_care_count,
        SUM(CASE WHEN concept = 'refresh' THEN 1 ELSE 0 END) as refresh_count,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_products,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_products,
        SUM(stock) as total_stock
      FROM products
      ${dateFilter}
    `).first();

    // 블로그 통계
    const blogStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(comment_count) as total_comments
      FROM blog_posts
      ${blogDateFilter}
    `).first();

    // 댓글 통계 (B2B, B2C, 구매 의도)
    const commentStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_comments,
        SUM(CASE WHEN user_type_prediction = 'B2B' THEN 1 ELSE 0 END) as b2b_comments,
        SUM(CASE WHEN user_type_prediction = 'B2C' THEN 1 ELSE 0 END) as b2c_comments,
        SUM(CASE WHEN intent = '구매의도' OR intent = 'B2B문의' THEN 1 ELSE 0 END) as purchase_intent_comments,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive_comments,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_comments,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral_comments
      FROM comments
      ${dateFilter}
    `).first();

    // 챗봇 세션 통계
    const chatbotStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_sessions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions
      FROM chatbot_sessions
      ${dateFilter}
    `).first();

    // 최근 등록된 제품 (5개)
    const recentProducts = await c.env.DB.prepare(`
      SELECT id, name, price, stock, concept, created_at
      FROM products
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // 최근 블로그 포스트 (5개)
    const recentPosts = await c.env.DB.prepare(`
      SELECT id, post_id, title, comment_count, published_at
      FROM blog_posts
      ORDER BY published_at DESC
      LIMIT 5
    `).all();

    // 최근 댓글 (5개)
    const recentComments = await c.env.DB.prepare(`
      SELECT c.id, c.author_name, c.content, c.user_type_prediction, c.intent, c.created_at, bp.title as post_title
      FROM comments c
      LEFT JOIN blog_posts bp ON c.post_id = bp.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `).all();

    return c.json({
      products: productStats,
      blog: blogStats,
      comments: commentStats,
      chatbot: chatbotStats,
      recent: {
        products: recentProducts.results,
        posts: recentPosts.results,
        comments: recentComments.results
      }
    });
  } catch (error: any) {
    console.error('대시보드 통계 조회 오류:', error);
    return c.json({ error: '통계 조회 실패', details: error.message }, 500);
  }
});

export default adminProducts;
