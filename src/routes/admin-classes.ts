import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Get all oneday classes
app.get('/', async (c) => {
  try {
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT oc.*, u.name as provider_name
      FROM oneday_classes oc
      LEFT JOIN users u ON oc.provider_id = u.id
      ORDER BY oc.created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error) {
    console.error('Classes load error:', error);
    return c.json({ error: 'Failed to load classes' }, 500);
  }
});

// Get single class
app.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const classId = c.req.param('id');
    
    const classData = await db.prepare(`
      SELECT oc.*, u.name as provider_name
      FROM oneday_classes oc
      LEFT JOIN users u ON oc.provider_id = u.id
      WHERE oc.id = ?
    `).bind(classId).first();
    
    if (!classData) {
      return c.json({ error: 'Class not found' }, 404);
    }
    
    return c.json(classData);
  } catch (error) {
    console.error('Class load error:', error);
    return c.json({ error: 'Failed to load class' }, 500);
  }
});

// Create class
app.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const { 
      provider_id, 
      title, 
      description, 
      category, 
      location, 
      address,
      price, 
      duration, 
      max_participants,
      image_url
    } = body;
    
    if (!provider_id || !title || !location) {
      return c.json({ error: 'Provider ID, title, and location are required' }, 400);
    }
    
    const result = await db.prepare(`
      INSERT INTO oneday_classes (
        provider_id, title, description, category, location, address,
        price, duration, max_participants, image_url, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      provider_id,
      title,
      description || '',
      category || 'general',
      location,
      address || '',
      price || 0,
      duration || 60,
      max_participants || 10,
      image_url || ''
    ).run();
    
    return c.json({ 
      success: true, 
      message: 'Class created successfully',
      id: result.meta.last_row_id 
    }, 201);
  } catch (error) {
    console.error('Class create error:', error);
    return c.json({ error: 'Failed to create class' }, 500);
  }
});

// Update class
app.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const classId = c.req.param('id');
    const body = await c.req.json();
    
    const updates: string[] = [];
    const params: any[] = [];
    
    const allowedFields = [
      'title', 'description', 'category', 'location', 'address',
      'price', 'duration', 'max_participants', 'image_url', 'is_active'
    ];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(body[field]);
      }
    });
    
    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(classId);
    
    const query = `UPDATE oneday_classes SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.prepare(query).bind(...params).run();
    
    return c.json({ success: true, message: 'Class updated successfully' });
  } catch (error) {
    console.error('Class update error:', error);
    return c.json({ error: 'Failed to update class' }, 500);
  }
});

// Delete class
app.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const classId = c.req.param('id');
    
    // Soft delete by setting is_active to 0
    await db.prepare('UPDATE oneday_classes SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(classId)
      .run();
    
    return c.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Class delete error:', error);
    return c.json({ error: 'Failed to delete class' }, 500);
  }
});

export default app;
