import { Hono } from 'hono';
import type { Bindings } from '../types';

const workshopQuotes = new Hono<{ Bindings: Bindings }>();

// Create workshop quote request
workshopQuotes.post('/', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    const data = await c.req.json();
    const {
      workshop_id,
      company_name,
      company_department,
      company_contact_name,
      company_contact_phone,
      company_contact_email,
      participant_count,
      preferred_date,
      requested_instructors,
      special_requests,
      is_workation
    } = data;
    
    // Validate required fields
    if (!workshop_id || !company_name || !company_contact_name || !company_contact_phone || !company_contact_email || !participant_count) {
      return c.json({ error: '필수 항목을 모두 입력해주세요' }, 400);
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO workshop_quotes (
        workshop_id, user_id, company_name, company_contact_name,
        company_contact_phone, company_contact_email, company_department,
        participant_count, preferred_date, requested_instructors,
        special_requests, is_workation, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).bind(
      workshop_id,
      userId,
      company_name,
      company_contact_name,
      company_contact_phone,
      company_contact_email,
      company_department || null,
      participant_count,
      preferred_date || null,
      requested_instructors || null,
      special_requests || null,
      is_workation || 0
    ).run();
    
    return c.json({
      message: '견적 문의가 접수되었습니다',
      quote_id: result.meta.last_row_id
    }, 201);
    
  } catch (error: any) {
    console.error('견적 문의 생성 오류:', error);
    return c.json({ error: '견적 문의 접수 실패', details: error.message }, 500);
  }
});

// Get user's quote requests
workshopQuotes.get('/my', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    const result = await c.env.DB.prepare(
      `SELECT q.*, w.title as workshop_title
       FROM workshop_quotes q
       JOIN workshops w ON q.workshop_id = w.id
       WHERE q.user_id = ?
       ORDER BY q.created_at DESC`
    ).bind(userId).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('내 견적 조회 오류:', error);
    return c.json({ error: '견적 조회 실패', details: error.message }, 500);
  }
});

// Get all quote requests (admin only)
workshopQuotes.get('/admin/all', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    // TODO: Add admin role check
    
    const result = await c.env.DB.prepare(
      `SELECT q.*, w.title as workshop_title, u.name as user_name, u.email as user_email
       FROM workshop_quotes q
       JOIN workshops w ON q.workshop_id = w.id
       JOIN users u ON q.user_id = u.id
       ORDER BY q.created_at DESC`
    ).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('전체 견적 조회 오류:', error);
    return c.json({ error: '견적 조회 실패', details: error.message }, 500);
  }
});

// Update quote status (admin only)
workshopQuotes.put('/:id/status', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }
    
    // TODO: Add admin role check
    
    const id = c.req.param('id');
    const { status, quoted_price, quote_details, admin_notes } = await c.req.json();
    
    await c.env.DB.prepare(
      `UPDATE workshop_quotes SET
        status = ?,
        quoted_price = ?,
        quote_details = ?,
        admin_notes = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      status,
      quoted_price || null,
      quote_details || null,
      admin_notes || null,
      id
    ).run();
    
    return c.json({ message: '견적 상태가 업데이트되었습니다' });
    
  } catch (error: any) {
    console.error('견적 업데이트 오류:', error);
    return c.json({ error: '견적 업데이트 실패', details: error.message }, 500);
  }
});

export default workshopQuotes;
