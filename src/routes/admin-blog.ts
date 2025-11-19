import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Get all blog posts
app.get('/', async (c) => {
  try {
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT * FROM blog_posts 
      ORDER BY created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error) {
    console.error('Blog posts load error:', error);
    return c.json({ error: 'Failed to load blog posts' }, 500);
  }
});

// Get single blog post
app.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const postId = c.req.param('id');
    
    const post = await db.prepare('SELECT * FROM blog_posts WHERE id = ?')
      .bind(postId)
      .first();
    
    if (!post) {
      return c.json({ error: 'Blog post not found' }, 404);
    }
    
    return c.json(post);
  } catch (error) {
    console.error('Blog post load error:', error);
    return c.json({ error: 'Failed to load blog post' }, 500);
  }
});

// Create blog post
app.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const { title, content, category, url } = body;
    
    if (!title || !url) {
      return c.json({ error: 'Title and URL are required' }, 400);
    }
    
    // Generate unique post_id
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await db.prepare(`
      INSERT INTO blog_posts (post_id, title, content, category, url, published_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(postId, title, content || '', category || 'general', url).run();
    
    return c.json({ 
      success: true, 
      message: 'Blog post created successfully',
      id: result.meta.last_row_id 
    }, 201);
  } catch (error) {
    console.error('Blog post create error:', error);
    return c.json({ error: 'Failed to create blog post' }, 500);
  }
});

// Update blog post
app.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const postId = c.req.param('id');
    const body = await c.req.json();
    const { title, content, category, url } = body;
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (title) {
      updates.push('title = ?');
      params.push(title);
    }
    
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    
    if (category) {
      updates.push('category = ?');
      params.push(category);
    }
    
    if (url) {
      updates.push('url = ?');
      params.push(url);
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(postId);
    
    const query = `UPDATE blog_posts SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.prepare(query).bind(...params).run();
    
    return c.json({ success: true, message: 'Blog post updated successfully' });
  } catch (error) {
    console.error('Blog post update error:', error);
    return c.json({ error: 'Failed to update blog post' }, 500);
  }
});

// Delete blog post
app.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const postId = c.req.param('id');
    
    await db.prepare('DELETE FROM blog_posts WHERE id = ?')
      .bind(postId)
      .run();
    
    return c.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Blog post delete error:', error);
    return c.json({ error: 'Failed to delete blog post' }, 500);
  }
});

export default app;
