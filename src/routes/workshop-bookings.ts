import { Hono } from 'hono';
import type { Context } from 'hono';
import {
  calculateDistance,
  searchWorkshopsNearby,
  getRegionCoordinates,
  extractRegion,
  formatDistance,
  isValidCoordinate,
} from '../utils/geo';
import {
  generateWorkshopICalendar,
  getICalendarHeaders,
  generateEventUID,
  type WorkshopBookingData,
} from '../utils/icalendar';

type Bindings = {
  DB: D1Database;
};

const bookings = new Hono<{ Bindings: Bindings }>();

// ==================
// Workshop Search by Location
// ==================

/**
 * GET /api/workshop-bookings/search-nearby
 * Search workshops near user's location
 * Query params: lat, lng, radius (optional, default 50km)
 */
bookings.get('/search-nearby', async (c: Context) => {
  try {
    const { lat, lng, radius } = c.req.query();

    if (!lat || !lng) {
      return c.json({ error: '위도와 경도를 제공해주세요' }, 400);
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = radius ? parseFloat(radius) : 50;

    if (!isValidCoordinate(userLat, userLng)) {
      return c.json({ error: '유효하지 않은 좌표입니다' }, 400);
    }

    // Get all active workshops with coordinates
    const result = await c.env.DB.prepare(`
      SELECT 
        id, title, description, category, location, address, 
        detailed_address, postal_code, latitude, longitude,
        price, duration, max_participants, image_url,
        contact_phone, contact_email, provider_id
      FROM workshops 
      WHERE is_active = 1 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
    `).all();

    if (!result.results || result.results.length === 0) {
      return c.json({
        workshops: [],
        message: '등록된 공방이 없습니다',
      });
    }

    // Calculate distances and filter by radius
    const nearbyWorkshops = searchWorkshopsNearby(
      result.results,
      userLat,
      userLng,
      radiusKm
    );

    // Format response
    const formatted = nearbyWorkshops.map((workshop) => ({
      ...workshop,
      distance_km: workshop.distance,
      distance_formatted: formatDistance(workshop.distance),
    }));

    return c.json({
      workshops: formatted,
      total: formatted.length,
      search_params: {
        user_location: { lat: userLat, lng: userLng },
        radius_km: radiusKm,
      },
    });
  } catch (error) {
    console.error('Search nearby error:', error);
    return c.json({ error: '공방 검색 실패' }, 500);
  }
});

/**
 * GET /api/workshop-bookings/search-by-region
 * Search workshops by region name (Korean regions)
 * Query params: region, radius (optional, default 50km)
 */
bookings.get('/search-by-region', async (c: Context) => {
  try {
    const { region, radius } = c.req.query();

    if (!region) {
      return c.json({ error: '지역명을 제공해주세요' }, 400);
    }

    const coords = getRegionCoordinates(region);
    if (!coords) {
      return c.json({ error: '지원하지 않는 지역입니다' }, 400);
    }

    const radiusKm = radius ? parseFloat(radius) : 50;

    // Get all active workshops with coordinates
    const result = await c.env.DB.prepare(`
      SELECT 
        id, title, description, category, location, address,
        detailed_address, postal_code, latitude, longitude,
        price, duration, max_participants, image_url,
        contact_phone, contact_email, provider_id
      FROM workshops 
      WHERE is_active = 1 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
    `).all();

    if (!result.results || result.results.length === 0) {
      return c.json({
        workshops: [],
        message: '등록된 공방이 없습니다',
      });
    }

    // Calculate distances and filter by radius
    const nearbyWorkshops = searchWorkshopsNearby(
      result.results,
      coords.lat,
      coords.lng,
      radiusKm
    );

    // Format response
    const formatted = nearbyWorkshops.map((workshop) => ({
      ...workshop,
      distance_km: workshop.distance,
      distance_formatted: formatDistance(workshop.distance),
    }));

    return c.json({
      workshops: formatted,
      total: formatted.length,
      search_params: {
        region,
        region_center: coords,
        radius_km: radiusKm,
      },
    });
  } catch (error) {
    console.error('Search by region error:', error);
    return c.json({ error: '공방 검색 실패' }, 500);
  }
});

// ==================
// Workshop Schedule Management
// ==================

/**
 * GET /api/workshop-bookings/schedules/:workshopId
 * Get available schedules for a workshop
 */
bookings.get('/schedules/:workshopId', async (c: Context) => {
  try {
    const workshopId = c.req.param('workshopId');
    const { from_date, to_date } = c.req.query();

    let query = `
      SELECT 
        id, workshop_id, available_date, start_time, end_time,
        max_slots, booked_slots, is_available
      FROM workshop_schedules
      WHERE workshop_id = ? AND is_available = 1
    `;

    const params: any[] = [workshopId];

    if (from_date) {
      query += ` AND available_date >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      query += ` AND available_date <= ?`;
      params.push(to_date);
    }

    query += ` ORDER BY available_date ASC, start_time ASC`;

    const result = await c.env.DB.prepare(query).bind(...params).all();

    // Calculate available slots
    const schedules = result.results?.map((schedule: any) => ({
      ...schedule,
      available_slots: schedule.max_slots - schedule.booked_slots,
      is_full: schedule.booked_slots >= schedule.max_slots,
    })) || [];

    return c.json({
      schedules,
      total: schedules.length,
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    return c.json({ error: '스케줄 조회 실패' }, 500);
  }
});

// ==================
// Booking Creation
// ==================

/**
 * POST /api/workshop-bookings/create
 * Create a new workshop booking
 */
bookings.post('/create', async (c: Context) => {
  try {
    const body = await c.req.json();
    const {
      workshop_id,
      schedule_id,
      user_id,
      booking_date,
      booking_time,
      num_participants,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      special_requests,
    } = body;

    // Validate required fields
    if (
      !workshop_id ||
      !user_id ||
      !booking_date ||
      !customer_name ||
      !customer_email ||
      !customer_phone
    ) {
      return c.json({ error: '필수 정보를 모두 입력해주세요' }, 400);
    }

    // Get workshop details
    const workshop = await c.env.DB.prepare(`
      SELECT id, title, description, price, duration, location, address, detailed_address
      FROM workshops
      WHERE id = ? AND is_active = 1
    `)
      .bind(workshop_id)
      .first();

    if (!workshop) {
      return c.json({ error: '워크샵을 찾을 수 없습니다' }, 404);
    }

    // Calculate total price
    const participants = num_participants || 1;
    const pricePerPerson = workshop.price || 0;
    const totalPrice = pricePerPerson * participants;

    // Generate unique UID for iCalendar
    const icalendarUid = generateEventUID(Date.now());

    // Insert booking
    const insertResult = await c.env.DB.prepare(`
      INSERT INTO workshop_bookings (
        workshop_id, schedule_id, user_id,
        booking_date, booking_time, num_participants,
        customer_name, customer_email, customer_phone, customer_address,
        special_requests,
        price_per_person, total_price,
        status, payment_status,
        icalendar_uid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)
    `)
      .bind(
        workshop_id,
        schedule_id || null,
        user_id,
        booking_date,
        booking_time || null,
        participants,
        customer_name,
        customer_email,
        customer_phone,
        customer_address || null,
        special_requests || null,
        pricePerPerson,
        totalPrice,
        icalendarUid
      )
      .run();

    if (!insertResult.success) {
      return c.json({ error: '예약 생성 실패' }, 500);
    }

    const bookingId = insertResult.meta.last_row_id;

    // If schedule_id provided, increment booked_slots
    if (schedule_id) {
      await c.env.DB.prepare(`
        UPDATE workshop_schedules
        SET booked_slots = booked_slots + ?
        WHERE id = ?
      `)
        .bind(participants, schedule_id)
        .run();
    }

    // Get the created booking
    const booking = await c.env.DB.prepare(`
      SELECT * FROM workshop_bookings WHERE id = ?
    `)
      .bind(bookingId)
      .first();

    return c.json({
      success: true,
      booking_id: bookingId,
      booking,
      message: '예약이 성공적으로 생성되었습니다',
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return c.json({ error: '예약 생성 실패' }, 500);
  }
});

// ==================
// iCalendar Download
// ==================

/**
 * GET /api/workshop-bookings/:bookingId/icalendar
 * Download iCalendar (.ics) file for a booking
 */
bookings.get('/:bookingId/icalendar', async (c: Context) => {
  try {
    const bookingId = c.req.param('bookingId');

    // Get booking with workshop details
    const booking = await c.env.DB.prepare(`
      SELECT 
        wb.*,
        w.title as workshop_title,
        w.description as workshop_description,
        w.location,
        w.address,
        w.detailed_address,
        w.duration
      FROM workshop_bookings wb
      JOIN workshops w ON wb.workshop_id = w.id
      WHERE wb.id = ?
    `)
      .bind(bookingId)
      .first<any>();

    if (!booking) {
      return c.json({ error: '예약을 찾을 수 없습니다' }, 404);
    }

    // Prepare booking data for iCalendar
    const bookingData: WorkshopBookingData = {
      bookingId: booking.id,
      workshopTitle: booking.workshop_title,
      workshopDescription: booking.workshop_description,
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time || '10:00',
      duration: booking.duration || 120,
      location: booking.location,
      address: booking.detailed_address || booking.address,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
    };

    // Generate iCalendar content
    const icalContent = generateWorkshopICalendar(bookingData);

    // Update download tracking
    await c.env.DB.prepare(`
      UPDATE workshop_bookings
      SET icalendar_downloaded = 1, icalendar_downloaded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
      .bind(bookingId)
      .run();

    // Return .ics file
    const headers = getICalendarHeaders(`aromapulse-booking-${bookingId}.ics`);
    return c.body(icalContent, 200, headers);
  } catch (error) {
    console.error('Download iCalendar error:', error);
    return c.json({ error: 'iCalendar 파일 생성 실패' }, 500);
  }
});

// ==================
// Booking Management
// ==================

/**
 * GET /api/workshop-bookings/user/:userId
 * Get user's bookings
 */
bookings.get('/user/:userId', async (c: Context) => {
  try {
    const userId = c.req.param('userId');

    const result = await c.env.DB.prepare(`
      SELECT 
        wb.*,
        w.title as workshop_title,
        w.location,
        w.image_url as workshop_image
      FROM workshop_bookings wb
      JOIN workshops w ON wb.workshop_id = w.id
      WHERE wb.user_id = ?
      ORDER BY wb.booking_date DESC, wb.created_at DESC
    `)
      .bind(userId)
      .all();

    return c.json({
      bookings: result.results || [],
      total: result.results?.length || 0,
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    return c.json({ error: '예약 목록 조회 실패' }, 500);
  }
});

/**
 * PUT /api/workshop-bookings/:bookingId/cancel
 * Cancel a booking
 */
bookings.put('/:bookingId/cancel', async (c: Context) => {
  try {
    const bookingId = c.req.param('bookingId');
    const body = await c.req.json();
    const { cancellation_reason, cancelled_by } = body;

    // Get booking to check schedule_id and num_participants
    const booking = await c.env.DB.prepare(`
      SELECT schedule_id, num_participants FROM workshop_bookings WHERE id = ?
    `)
      .bind(bookingId)
      .first<any>();

    if (!booking) {
      return c.json({ error: '예약을 찾을 수 없습니다' }, 404);
    }

    // Update booking status
    await c.env.DB.prepare(`
      UPDATE workshop_bookings
      SET status = 'cancelled',
          cancelled_at = CURRENT_TIMESTAMP,
          cancellation_reason = ?,
          cancelled_by = ?
      WHERE id = ?
    `)
      .bind(cancellation_reason || null, cancelled_by || 'user', bookingId)
      .run();

    // If schedule_id exists, decrement booked_slots
    if (booking.schedule_id) {
      await c.env.DB.prepare(`
        UPDATE workshop_schedules
        SET booked_slots = booked_slots - ?
        WHERE id = ?
      `)
        .bind(booking.num_participants, booking.schedule_id)
        .run();
    }

    return c.json({
      success: true,
      message: '예약이 취소되었습니다',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return c.json({ error: '예약 취소 실패' }, 500);
  }
});

export default bookings;
