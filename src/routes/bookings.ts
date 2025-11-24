// Bookings API for Oneday Classes and Products
import { Hono } from 'hono';
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { JWTManager } from '../lib/auth/jwt';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const bookings = new Hono<{ Bindings: Bindings }>();

// Create a new booking
bookings.post('/oneday-classes/:classId', async (c: Context) => {
  try {
    console.log('=== Booking Request Start ===');
    const { DB, JWT_SECRET } = c.env as Bindings;
    const classId = c.req.param('classId');
    console.log('Class ID:', classId);
    
    // Get user from JWT token
    const token = getCookie(c, 'auth_token');
    console.log('Token exists:', !!token);
    if (!token) {
      return c.json({ error: '로그인이 필요합니다' }, 401);
    }
    
    const jwtManager = new JWTManager(JWT_SECRET);
    const payload = await jwtManager.verify(token);
    console.log('Payload:', payload);
    
    if (!payload) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // Get booking data from request
    const data = await c.req.json();
    console.log('Booking data:', data);
    const {
      booking_date,  // ISO datetime string
      participants,
      booker_name,
      booker_phone,
      booker_email
    } = data;
    
    // Validate required fields
    if (!booking_date || !booker_name || !booker_phone || !booker_email) {
      return c.json({ error: '필수 정보를 모두 입력해주세요' }, 400);
    }
    
    console.log('Querying class info...');
    // Get class info
    const classInfo = await DB.prepare(`
      SELECT id, title, price, provider_id FROM oneday_classes 
      WHERE id = ? AND is_active = 1
    `).bind(classId).first<{ id: number, title: string, price: number, provider_id: number }>();
    
    console.log('Class info:', classInfo);
    if (!classInfo) {
      return c.json({ error: '클래스를 찾을 수 없습니다' }, 404);
    }
    
    // Calculate total price
    const numParticipants = participants || 1;
    const totalPrice = classInfo.price * numParticipants;
    
    // Create booking
    const result = await DB.prepare(`
      INSERT INTO oneday_class_bookings (
        class_id, user_id, booking_date, participants, total_price,
        booker_name, booker_phone, booker_email, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `).bind(
      classId,
      payload.userId,
      booking_date,
      numParticipants,
      totalPrice,
      booker_name,
      booker_phone,
      booker_email
    ).run();
    
    const bookingId = Number(result.meta.last_row_id);
    
    // Get full booking details
    const booking = await DB.prepare(`
      SELECT 
        b.*,
        c.title as class_title,
        c.description as class_description,
        c.location,
        c.address,
        c.duration
      FROM oneday_class_bookings b
      JOIN oneday_classes c ON b.class_id = c.id
      WHERE b.id = ?
    `).bind(bookingId).first();
    
    return c.json({
      message: '예약이 완료되었습니다',
      booking: booking
    }, 201);
    
  } catch (error: any) {
    console.error('Booking creation error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return c.json({ 
      error: '예약 처리 중 오류가 발생했습니다', 
      details: error.message,
      stack: error.stack,
      type: error.constructor.name 
    }, 500);
  }
});

// Get user's bookings
bookings.get('/my', async (c: Context) => {
  try {
    const { DB, JWT_SECRET } = c.env as Bindings;
    
    // Get user from JWT token
    const token = getCookie(c, 'auth_token');
    if (!token) {
      return c.json({ error: '로그인이 필요합니다' }, 401);
    }
    
    const jwtManager = new JWTManager(JWT_SECRET);
    const payload = await jwtManager.verify(token);
    
    if (!payload) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // Get bookings
    const result = await DB.prepare(`
      SELECT 
        b.*,
        c.title as class_title,
        c.location,
        c.address
      FROM oneday_class_bookings b
      JOIN oneday_classes c ON b.class_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.booking_date DESC
    `).bind(payload.userId).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('Get bookings error:', error);
    return c.json({ error: '예약 조회 중 오류가 발생했습니다', details: error.message }, 500);
  }
});

// Get user's bookings (마이페이지용 - 형식화된 응답)
bookings.get('/my-bookings', async (c: Context) => {
  try {
    const { DB, JWT_SECRET } = c.env as Bindings;
    
    // Get user from JWT token
    const token = getCookie(c, 'auth_token');
    if (!token) {
      return c.json({ error: '로그인이 필요합니다' }, 401);
    }
    
    const jwtManager = new JWTManager(JWT_SECRET);
    const payload = await jwtManager.verify(token);
    
    if (!payload) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // Get oneday class bookings
    const classBookings = await DB.prepare(`
      SELECT 
        b.id,
        b.booking_date,
        b.participants,
        b.total_price,
        b.status,
        b.created_at,
        c.title as class_title,
        c.location,
        c.address
      FROM oneday_class_bookings b
      JOIN oneday_classes c ON b.class_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.booking_date DESC
    `).bind(payload.userId).all();
    
    // Get product bookings (쇼핑 예약)
    const productBookings = await DB.prepare(`
      SELECT 
        b.id,
        b.booking_date,
        b.quantity as participants,
        b.total_price,
        b.status,
        b.created_at,
        b.booker_name,
        p.name as product_name
      FROM product_bookings b
      JOIN products p ON b.product_id = p.id
      WHERE b.user_id = ?
      ORDER BY b.booking_date DESC
    `).bind(payload.userId).all();
    
    // Format class bookings
    const formattedClassBookings = classBookings.results.map((booking: any) => ({
      booking_id: `CLASS-${booking.id}`,
      type: 'class',
      title: booking.class_title,
      date: new Date(booking.booking_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      participants: booking.participants,
      amount: booking.total_price,
      status: booking.status,
      location: booking.location || booking.address,
      created_at: booking.created_at
    }));
    
    // Format product bookings
    const formattedProductBookings = productBookings.results.map((booking: any) => ({
      booking_id: `PRODUCT-${booking.id}`,
      type: 'product',
      title: booking.product_name,
      date: new Date(booking.booking_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      participants: booking.participants,
      amount: booking.total_price,
      status: booking.status,
      location: '',
      created_at: booking.created_at
    }));
    
    // Combine and sort by created_at
    const allBookings = [...formattedClassBookings, ...formattedProductBookings]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return c.json({
      success: true,
      bookings: allBookings
    });
    
  } catch (error: any) {
    console.error('Get my-bookings error:', error);
    return c.json({ 
      success: false,
      error: '예약 조회 중 오류가 발생했습니다', 
      details: error.message,
      bookings: []
    }, 500);
  }
});

// Get booking detail
bookings.get('/:id', async (c: Context) => {
  try {
    const { DB, JWT_SECRET } = c.env as Bindings;
    const bookingId = c.req.param('id');
    
    // Get user from JWT token
    const token = getCookie(c, 'auth_token');
    if (!token) {
      return c.json({ error: '로그인이 필요합니다' }, 401);
    }
    
    const jwtManager = new JWTManager(JWT_SECRET);
    const payload = await jwtManager.verify(token);
    
    if (!payload) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // Get booking
    const booking = await DB.prepare(`
      SELECT 
        b.*,
        c.title as class_title,
        c.description as class_description,
        c.location,
        c.address,
        c.duration,
        c.latitude,
        c.longitude
      FROM oneday_class_bookings b
      JOIN oneday_classes c ON b.class_id = c.id
      WHERE b.id = ? AND b.user_id = ?
    `).bind(bookingId, payload.userId).first();
    
    if (!booking) {
      return c.json({ error: '예약을 찾을 수 없습니다' }, 404);
    }
    
    return c.json(booking);
    
  } catch (error: any) {
    console.error('Get booking error:', error);
    return c.json({ error: '예약 조회 중 오류가 발생했습니다', details: error.message }, 500);
  }
});

// Cancel booking
bookings.delete('/:id', async (c: Context) => {
  try {
    const { DB, JWT_SECRET } = c.env as Bindings;
    const bookingId = c.req.param('id');
    
    // Get user from JWT token
    const token = getCookie(c, 'auth_token');
    if (!token) {
      return c.json({ error: '로그인이 필요합니다' }, 401);
    }
    
    const jwtManager = new JWTManager(JWT_SECRET);
    const payload = await jwtManager.verify(token);
    
    if (!payload) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // Check if booking exists and belongs to user
    const booking = await DB.prepare(`
      SELECT id, user_id, status FROM oneday_class_bookings
      WHERE id = ?
    `).bind(bookingId).first<{ id: number, user_id: number, status: string }>();
    
    if (!booking) {
      return c.json({ error: '예약을 찾을 수 없습니다' }, 404);
    }
    
    if (booking.user_id !== payload.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    if (booking.status === 'cancelled') {
      return c.json({ error: '이미 취소된 예약입니다' }, 400);
    }
    
    // Cancel booking
    await DB.prepare(`
      UPDATE oneday_class_bookings
      SET status = 'cancelled', updated_at = datetime('now')
      WHERE id = ?
    `).bind(bookingId).run();
    
    return c.json({ message: '예약이 취소되었습니다' });
    
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return c.json({ error: '예약 취소 중 오류가 발생했습니다', details: error.message }, 500);
  }
});

// Generate iCalendar file for booking
bookings.get('/:id/icalendar', async (c: Context) => {
  try {
    const { DB, JWT_SECRET } = c.env as Bindings;
    const bookingId = c.req.param('id');
    
    // Get user from JWT token
    const token = getCookie(c, 'auth_token');
    if (!token) {
      return c.json({ error: '로그인이 필요합니다' }, 401);
    }
    
    const jwtManager = new JWTManager(JWT_SECRET);
    const payload = await jwtManager.verify(token);
    
    if (!payload) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // Get booking details
    const booking = await DB.prepare(`
      SELECT 
        b.*,
        c.title as class_title,
        c.description as class_description,
        c.location,
        c.address,
        c.duration
      FROM oneday_class_bookings b
      JOIN oneday_classes c ON b.class_id = c.id
      WHERE b.id = ? AND b.user_id = ?
    `).bind(bookingId, payload.userId).first<any>();
    
    if (!booking) {
      return c.json({ error: '예약을 찾을 수 없습니다' }, 404);
    }
    
    // Generate iCalendar content
    const ics = generateICS(booking);
    
    // Return as downloadable file
    return c.body(ics, 200, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="aromapulse-booking-${bookingId}.ics"`
    });
    
  } catch (error: any) {
    console.error('Generate iCalendar error:', error);
    return c.json({ error: 'iCalendar 생성 중 오류가 발생했습니다', details: error.message }, 500);
  }
});

// Helper function to generate iCalendar content
function generateICS(booking: any): string {
  const startDate = new Date(booking.booking_date);
  const endDate = new Date(startDate.getTime() + (booking.duration || 90) * 60000); // duration in minutes
  
  // Format dates for iCalendar (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const now = formatDate(new Date());
  const dtstart = formatDate(startDate);
  const dtend = formatDate(endDate);
  
  const location = booking.address || booking.location || '';
  const description = booking.class_description || '';
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AromaPulse//Oneday Class Booking//KO
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:아로마펄스 원데이 클래스
X-WR-TIMEZONE:Asia/Seoul
BEGIN:VEVENT
UID:aromapulse-${booking.id}@aromapulse.kr
DTSTAMP:${now}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${booking.class_title}
DESCRIPTION:${description}\\n\\n예약자: ${booking.booker_name}\\n참가 인원: ${booking.participants}명\\n총 금액: ${booking.total_price?.toLocaleString()}원
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:1시간 후 ${booking.class_title} 시작
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

// ==================== Product Bookings ====================

// Create a new product booking
bookings.post('/products', async (c: Context) => {
  try {
    const { DB, JWT_SECRET } = c.env as Bindings;
    
    // Get user from JWT token (optional for products)
    const token = getCookie(c, 'auth_token');
    let userId = null;
    
    if (token) {
      const jwtManager = new JWTManager(JWT_SECRET);
      const payload = await jwtManager.verify(token);
      if (payload) {
        userId = payload.userId;
      }
    }
    
    // Get booking data from request
    const data = await c.req.json();
    const {
      product_id,
      booking_date,
      booking_time,
      quantity,
      booker_name,
      booker_phone,
      booker_email,
      special_requests
    } = data;
    
    // Validate required fields
    if (!product_id || !booking_date || !booking_time || !booker_name || !booker_phone || !booker_email) {
      return c.json({ error: '필수 정보를 모두 입력해주세요' }, 400);
    }
    
    // Combine date and time
    const bookingDateTime = `${booking_date}T${booking_time}:00`;
    
    // Get product info
    const product = await DB.prepare(`
      SELECT id, name, price FROM products 
      WHERE id = ?
    `).bind(product_id).first<{ id: number, name: string, price: number }>();
    
    if (!product) {
      return c.json({ error: '제품을 찾을 수 없습니다' }, 404);
    }
    
    // Calculate total price
    const numQuantity = quantity || 1;
    const totalPrice = product.price * numQuantity;
    
    // Create product booking
    const result = await DB.prepare(`
      INSERT INTO product_bookings (
        product_id, user_id, booking_date, quantity, total_price,
        booker_name, booker_phone, booker_email, special_requests, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `).bind(
      product_id,
      userId,
      bookingDateTime,
      numQuantity,
      totalPrice,
      booker_name,
      booker_phone,
      booker_email,
      special_requests || null
    ).run();
    
    const bookingId = Number(result.meta.last_row_id);
    
    // Get full booking details
    const booking = await DB.prepare(`
      SELECT 
        b.*,
        p.name as product_name,
        p.description as product_description,
        p.thumbnail_image as image_url
      FROM product_bookings b
      JOIN products p ON b.product_id = p.id
      WHERE b.id = ?
    `).bind(bookingId).first();
    
    return c.json({
      message: '예약이 완료되었습니다',
      booking: booking
    }, 201);
    
  } catch (error: any) {
    console.error('Product booking creation error:', error);
    return c.json({ error: '예약 처리 중 오류가 발생했습니다', details: error.message }, 500);
  }
});

// Get user's product bookings
bookings.get('/products/my', async (c: Context) => {
  try {
    const { DB, JWT_SECRET } = c.env as Bindings;
    
    // Get user from JWT token
    const token = getCookie(c, 'auth_token');
    if (!token) {
      return c.json({ error: '로그인이 필요합니다' }, 401);
    }
    
    const jwtManager = new JWTManager(JWT_SECRET);
    const payload = await jwtManager.verify(token);
    
    if (!payload) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // Get bookings
    const result = await DB.prepare(`
      SELECT 
        b.*,
        p.name as product_name,
        p.thumbnail_image as image_url
      FROM product_bookings b
      JOIN products p ON b.product_id = p.id
      WHERE b.user_id = ?
      ORDER BY b.booking_date DESC
    `).bind(payload.userId).all();
    
    return c.json(result.results);
    
  } catch (error: any) {
    console.error('Get product bookings error:', error);
    return c.json({ error: '예약 조회 중 오류가 발생했습니다', details: error.message }, 500);
  }
});

// Get user statistics (마이페이지 통계용)
bookings.get('/stats', async (c: Context) => {
  try {
    const { DB, JWT_SECRET } = c.env as Bindings;
    
    // Get user from JWT token
    const token = getCookie(c, 'auth_token');
    if (!token) {
      return c.json({ error: '로그인이 필요합니다' }, 401);
    }
    
    const jwtManager = new JWTManager(JWT_SECRET);
    const payload = await jwtManager.verify(token);
    
    if (!payload) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // Count total class bookings
    const classBookingsCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM oneday_class_bookings
      WHERE user_id = ?
    `).bind(payload.userId).first<{ count: number }>();
    
    // Count total product bookings
    const productBookingsCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM product_bookings
      WHERE user_id = ?
    `).bind(payload.userId).first<{ count: number }>();
    
    // Count total orders
    const ordersCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE user_id = ?
    `).bind(payload.userId).first<{ count: number }>();
    
    // Total bookings = class bookings + product bookings
    const totalBookings = (classBookingsCount?.count || 0) + (productBookingsCount?.count || 0);
    
    return c.json({
      success: true,
      stats: {
        total_orders: ordersCount?.count || 0,
        total_bookings: totalBookings,
        total_consultations: 0  // TODO: 상담 시스템 구현 시 추가
      }
    });
    
  } catch (error: any) {
    console.error('Get stats error:', error);
    return c.json({ 
      success: false,
      error: '통계 조회 중 오류가 발생했습니다', 
      stats: {
        total_orders: 0,
        total_bookings: 0,
        total_consultations: 0
      }
    }, 500);
  }
});

export default bookings;
