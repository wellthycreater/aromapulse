import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Dashboard stats
app.get('/stats', async (c) => {
  try {
    const db = c.env.DB;
    
    // Get total users count
    const usersResult = await db.prepare('SELECT COUNT(*) as count FROM users').first();
    const totalUsers = usersResult?.count || 0;
    
    // Get total products count
    const productsResult = await db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').first();
    const totalProducts = productsResult?.count || 0;
    
    // Get active workshops count
    const workshopsResult = await db.prepare('SELECT COUNT(*) as count FROM workshops WHERE is_active = 1').first();
    const activeWorkshops = workshopsResult?.count || 0;
    
    // Get active oneday classes count
    const classesResult = await db.prepare('SELECT COUNT(*) as count FROM oneday_classes WHERE is_active = 1').first();
    const activeClasses = classesResult?.count || 0;
    
    return c.json({
      users: totalUsers,
      products: totalProducts,
      workshops: activeWorkshops,
      classes: activeClasses
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({ error: 'Failed to load dashboard stats' }, 500);
  }
});

// Recent activity
app.get('/activity', async (c) => {
  try {
    const db = c.env.DB;
    
    const activities = [];
    
    // Get recent user registrations
    const recentUsers = await db.prepare(`
      SELECT name, created_at FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    recentUsers.results?.forEach((user: any) => {
      activities.push({
        icon: 'fa-user-plus',
        message: `${user.name}님이 회원가입했습니다.`,
        created_at: user.created_at
      });
    });
    
    // Get recent orders
    const recentOrders = await db.prepare(`
      SELECT o.id, u.name, o.created_at 
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC 
      LIMIT 5
    `).all();
    
    recentOrders.results?.forEach((order: any) => {
      activities.push({
        icon: 'fa-shopping-cart',
        message: `${order.name}님이 주문했습니다. (주문번호: ${order.id})`,
        created_at: order.created_at
      });
    });
    
    // Sort by date
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return c.json(activities.slice(0, 10));
  } catch (error) {
    console.error('Activity load error:', error);
    return c.json({ error: 'Failed to load activity' }, 500);
  }
});

export default app;
