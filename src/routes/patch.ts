import { Hono } from 'hono';
import type { Bindings } from '../types';

const patch = new Hono<{ Bindings: Bindings }>();

// 패치 신청
patch.post('/apply', async (c) => {
  try {
    const { user_id, name, phone, email, address, symptoms, notes } = await c.req.json();
    
    if (!name || !phone || !address) {
      return c.json({ error: '필수 정보를 입력해주세요' }, 400);
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO patch_applications (user_id, name, phone, email, address, symptoms, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).bind(
      user_id || null,
      name,
      phone,
      email || null,
      address,
      symptoms ? JSON.stringify(symptoms) : null,
      notes || null
    ).run();
    
    return c.json({ 
      message: '패치 신청이 완료되었습니다',
      application_id: result.meta.last_row_id 
    }, 201);
    
  } catch (error) {
    console.error('Patch application error:', error);
    return c.json({ error: '패치 신청 실패' }, 500);
  }
});

// 패치 신청 목록 조회
patch.get('/applications', async (c) => {
  try {
    const user_id = c.req.query('user_id');
    const status = c.req.query('status');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let sql = 'SELECT * FROM patch_applications WHERE 1=1';
    const params: any[] = [];
    
    if (user_id) {
      sql += ' AND user_id = ?';
      params.push(user_id);
    }
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = c.env.DB.prepare(sql);
    const { results } = await stmt.bind(...params).all();
    
    // Parse JSON fields
    const applications = results.map((a: any) => ({
      ...a,
      symptoms: a.symptoms ? JSON.parse(a.symptoms) : [],
    }));
    
    return c.json({ applications, total: results.length });
    
  } catch (error) {
    console.error('Get applications error:', error);
    return c.json({ error: '신청 목록 조회 실패' }, 500);
  }
});

// 패치 신청 상세 조회
patch.get('/applications/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const application = await c.env.DB.prepare(
      'SELECT * FROM patch_applications WHERE id = ?'
    ).bind(id).first();
    
    if (!application) {
      return c.json({ error: '신청을 찾을 수 없습니다' }, 404);
    }
    
    // Parse JSON fields
    const result = {
      ...application,
      symptoms: application.symptoms ? JSON.parse(application.symptoms as string) : [],
    };
    
    return c.json({ application: result });
    
  } catch (error) {
    console.error('Get application error:', error);
    return c.json({ error: '신청 조회 실패' }, 500);
  }
});

// 설문 제출 (BEFORE/AFTER)
patch.post('/survey', async (c) => {
  try {
    const { user_id, application_id, survey_type, stress_level, sleep_quality, anxiety_level, depression_level, feedback } = await c.req.json();
    
    if (!survey_type || !['before', 'after'].includes(survey_type)) {
      return c.json({ error: '설문 유형이 잘못되었습니다' }, 400);
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO surveys (user_id, application_id, survey_type, stress_level, sleep_quality, anxiety_level, depression_level, feedback)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user_id || null,
      application_id || null,
      survey_type,
      stress_level || null,
      sleep_quality || null,
      anxiety_level || null,
      depression_level || null,
      feedback || null
    ).run();
    
    return c.json({ 
      message: '설문이 제출되었습니다',
      survey_id: result.meta.last_row_id 
    }, 201);
    
  } catch (error) {
    console.error('Survey submission error:', error);
    return c.json({ error: '설문 제출 실패' }, 500);
  }
});

// 설문 조회
patch.get('/surveys', async (c) => {
  try {
    const user_id = c.req.query('user_id');
    const application_id = c.req.query('application_id');
    const survey_type = c.req.query('survey_type');
    
    let sql = 'SELECT * FROM surveys WHERE 1=1';
    const params: any[] = [];
    
    if (user_id) {
      sql += ' AND user_id = ?';
      params.push(user_id);
    }
    
    if (application_id) {
      sql += ' AND application_id = ?';
      params.push(application_id);
    }
    
    if (survey_type) {
      sql += ' AND survey_type = ?';
      params.push(survey_type);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const stmt = c.env.DB.prepare(sql);
    const { results } = await stmt.bind(...params).all();
    
    return c.json({ surveys: results });
    
  } catch (error) {
    console.error('Get surveys error:', error);
    return c.json({ error: '설문 조회 실패' }, 500);
  }
});

export default patch;
