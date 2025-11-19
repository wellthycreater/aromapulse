import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Get all workshops
app.get('/', async (c) => {
  try {
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT w.*, u.name as provider_name
      FROM workshops w
      LEFT JOIN users u ON w.provider_id = u.id
      ORDER BY w.created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error) {
    console.error('Workshops load error:', error);
    return c.json({ error: 'Failed to load workshops' }, 500);
  }
});

// Get single workshop
app.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const workshopId = c.req.param('id');
    
    const workshop = await db.prepare(`
      SELECT w.*, u.name as provider_name
      FROM workshops w
      LEFT JOIN users u ON w.provider_id = u.id
      WHERE w.id = ?
    `).bind(workshopId).first();
    
    if (!workshop) {
      return c.json({ error: 'Workshop not found' }, 404);
    }
    
    return c.json(workshop);
  } catch (error) {
    console.error('Workshop load error:', error);
    return c.json({ error: 'Failed to load workshop' }, 500);
  }
});

// Create workshop
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
      image_url,
      type
    } = body;
    
    if (!provider_id || !title || !location) {
      return c.json({ error: 'Provider ID, title, and location are required' }, 400);
    }
    
    const result = await db.prepare(`
      INSERT INTO workshops (
        provider_id, title, description, category, location, address,
        price, duration, max_participants, image_url, type, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
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
      image_url || '',
      type || 'class'
    ).run();
    
    return c.json({ 
      success: true, 
      message: 'Workshop created successfully',
      id: result.meta.last_row_id 
    }, 201);
  } catch (error) {
    console.error('Workshop create error:', error);
    return c.json({ error: 'Failed to create workshop' }, 500);
  }
});

// Update workshop
app.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const workshopId = c.req.param('id');
    const body = await c.req.json();
    
    const updates: string[] = [];
    const params: any[] = [];
    
    const allowedFields = [
      'title', 'description', 'category', 'location', 'address',
      'price', 'duration', 'max_participants', 'image_url', 'is_active', 'type'
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
    params.push(workshopId);
    
    const query = `UPDATE workshops SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.prepare(query).bind(...params).run();
    
    return c.json({ success: true, message: 'Workshop updated successfully' });
  } catch (error) {
    console.error('Workshop update error:', error);
    return c.json({ error: 'Failed to update workshop' }, 500);
  }
});

// Delete workshop
app.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const workshopId = c.req.param('id');
    
    // Soft delete by setting is_active to 0
    await db.prepare('UPDATE workshops SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(workshopId)
      .run();
    
    return c.json({ success: true, message: 'Workshop deleted successfully' });
  } catch (error) {
    console.error('Workshop delete error:', error);
    return c.json({ error: 'Failed to delete workshop' }, 500);
  }
});

export default app;
