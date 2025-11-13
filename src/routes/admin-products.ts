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

// 모든 제품 목록 조회 (관리자)
adminProducts.get('/', checkAdminAuth, async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT * FROM products ORDER BY created_at DESC`
    ).all();
    
    return c.json(result.results);
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
      category,
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
    if (!name || !category || !price) {
      return c.json({ 
        error: '필수 필드가 누락되었습니다',
        required: ['name', 'category', 'price']
      }, 400);
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO products (
        name, description, category, price, thumbnail_image, detail_image, stock,
        workshop_name, workshop_location, workshop_address, workshop_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      name,
      description || null,
      category,
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
      category,
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
        category = ?, 
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
      category,
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

// 제품 삭제 (소프트 삭제)
adminProducts.delete('/:id', checkAdminAuth, async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(
      'UPDATE products SET is_active = 0 WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ message: '제품이 삭제되었습니다' });
  } catch (error: any) {
    console.error('제품 삭제 오류:', error);
    return c.json({ error: '제품 삭제 실패', details: error.message }, 500);
  }
});

// 이미지 업로드 (R2 Storage)
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
    
    // 고유 파일명 생성
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const newFileName = `products/${timestamp}-${randomStr}.${fileExt}`;
    
    // R2에 업로드
    const arrayBuffer = await file.arrayBuffer();
    await c.env.IMAGES.put(newFileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });
    
    // 공개 URL 생성 (R2 public bucket 또는 Cloudflare CDN 사용)
    const imageUrl = `/api/admin-products/images/${newFileName}`;
    
    return c.json({
      message: '이미지가 업로드되었습니다',
      url: imageUrl,
      filename: newFileName
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

export default adminProducts;
