import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Get all users with filters
app.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const { user_type, role, search, is_active } = c.req.query();
    
    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    
    // Filter by user type (b2c/b2b)
    if (user_type) {
      query += ' AND user_type = ?';
      params.push(user_type);
    }
    
    // Filter by role (admin/partner/user)
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    // Search by name or email
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Filter by active status
    if (is_active !== undefined && is_active !== '') {
      query += ' AND is_active = ?';
      params.push(parseInt(is_active));
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).all();
    
    // Remove sensitive fields
    const users = result.results?.map((user: any) => {
      const { password_hash, ...safeUser } = user;
      return safeUser;
    });
    
    return c.json(users || []);
  } catch (error) {
    console.error('Users load error:', error);
    return c.json({ error: 'Failed to load users' }, 500);
  }
});

// Get single user
app.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.req.param('id');
    
    const user = await db.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Remove sensitive fields
    const { password_hash, ...safeUser } = user as any;
    
    return c.json(safeUser);
  } catch (error) {
    console.error('User load error:', error);
    return c.json({ error: 'Failed to load user' }, 500);
  }
});

// Update user
app.patch('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.req.param('id');
    const body = await c.req.json();
    
    const { is_active, role, name, phone } = body;
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (phone) {
      updates.push('phone = ?');
      params.push(phone);
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.prepare(query).bind(...params).run();
    
    return c.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('User update error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Delete user (soft delete by setting is_active to 0)
app.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.req.param('id');
    
    await db.prepare('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(userId)
      .run();
    
    return c.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('User delete error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

export default app;
