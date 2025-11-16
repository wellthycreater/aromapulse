import { Hono } from 'hono';
import type { Bindings } from '../types';

const orders = new Hono<{ Bindings: Bindings }>();

// 주문 번호 생성
function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${year}${month}${day}${random}`;
}

// 주문 생성
orders.post('/create', async (c) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_zipcode,
      customer_address,
      customer_detail_address,
      delivery_message,
      items,
      total_amount,
      delivery_fee,
      final_amount
    } = await c.req.json();
    
    // 필수 필드 검증
    if (!customer_name || !customer_email || !customer_phone || !items || items.length === 0) {
      return c.json({ error: '필수 정보가 누락되었습니다' }, 400);
    }
    
    const orderNumber = generateOrderNumber();
    
    // 주문 생성
    const orderResult = await c.env.DB.prepare(`
      INSERT INTO orders (
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        customer_zipcode,
        customer_address,
        customer_detail_address,
        delivery_message,
        total_amount,
        delivery_fee,
        final_amount,
        payment_method,
        payment_status,
        order_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'payup', 'pending', 'pending')
    `).bind(
      orderNumber,
      customer_name,
      customer_email,
      customer_phone,
      customer_zipcode || null,
      customer_address || null,
      customer_detail_address || null,
      delivery_message || null,
      total_amount,
      delivery_fee,
      final_amount
    ).run();
    
    const orderId = orderResult.meta.last_row_id;
    
    // 주문 상품 등록
    for (const item of items) {
      // 제품 정보 조회
      const product = await c.env.DB.prepare(
        'SELECT * FROM products WHERE id = ?'
      ).bind(item.product_id).first();
      
      if (!product) {
        continue;
      }
      
      await c.env.DB.prepare(`
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          product_concept,
          product_category,
          product_refresh_type,
          product_volume,
          quantity,
          unit_price,
          total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        orderId,
        product.id,
        product.name,
        product.concept,
        product.category || null,
        product.refresh_type || null,
        product.volume || null,
        item.quantity,
        item.unit_price,
        item.unit_price * item.quantity
      ).run();
    }
    
    return c.json({
      message: '주문이 생성되었습니다',
      order_id: orderId,
      order_number: orderNumber
    });
    
  } catch (error: any) {
    console.error('주문 생성 오류:', error);
    return c.json({ error: '주문 생성 실패', details: error.message }, 500);
  }
});

// 주문 조회 (주문번호로)
orders.get('/:order_number', async (c) => {
  try {
    const orderNumber = c.req.param('order_number');
    
    const order = await c.env.DB.prepare(
      'SELECT * FROM orders WHERE order_number = ?'
    ).bind(orderNumber).first();
    
    if (!order) {
      return c.json({ error: '주문을 찾을 수 없습니다' }, 404);
    }
    
    const items = await c.env.DB.prepare(
      'SELECT * FROM order_items WHERE order_id = ?'
    ).bind(order.id).all();
    
    return c.json({
      order,
      items: items.results
    });
    
  } catch (error: any) {
    console.error('주문 조회 오류:', error);
    return c.json({ error: '주문 조회 실패', details: error.message }, 500);
  }
});

// 주문 목록 조회 (관리자용)
orders.get('/admin/list', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    
    const orderStatus = c.req.query('order_status');
    const paymentStatus = c.req.query('payment_status');
    const search = c.req.query('search');
    
    let whereClause = '';
    const bindings: any[] = [];
    
    if (orderStatus) {
      whereClause += ' WHERE order_status = ?';
      bindings.push(orderStatus);
    }
    
    if (paymentStatus) {
      whereClause += whereClause ? ' AND' : ' WHERE';
      whereClause += ' payment_status = ?';
      bindings.push(paymentStatus);
    }
    
    if (search) {
      whereClause += whereClause ? ' AND' : ' WHERE';
      whereClause += ' (order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)';
      const searchPattern = `%${search}%`;
      bindings.push(searchPattern, searchPattern, searchPattern);
    }
    
    const ordersResult = await c.env.DB.prepare(`
      SELECT * FROM orders
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all();
    
    const totalCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM orders ${whereClause}
    `).bind(...bindings).first();
    
    return c.json({
      orders: ordersResult.results,
      total: totalCount?.count || 0,
      pagination: {
        page,
        limit,
        total: totalCount?.count || 0,
        total_pages: Math.ceil((totalCount?.count || 0) / limit)
      }
    });
    
  } catch (error: any) {
    console.error('주문 목록 조회 오류:', error);
    return c.json({ error: '주문 목록 조회 실패', details: error.message }, 500);
  }
});

// 관리자 통계 조회
orders.get('/admin/stats', async (c) => {
  try {
    // 전체 주문 수
    const totalOrders = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM orders'
    ).first();
    
    // 결제 대기 수
    const paymentPending = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE payment_status = ?'
    ).bind('pending').first();
    
    // 결제 완료 수
    const paymentPaid = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE payment_status = ?'
    ).bind('paid').first();
    
    // 배송중 주문 수
    const orderShipping = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE order_status = ?'
    ).bind('shipped').first();
    
    // 배송 완료 수
    const orderDelivered = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE order_status = ?'
    ).bind('delivered').first();
    
    return c.json({
      total_orders: totalOrders?.count || 0,
      payment_pending: paymentPending?.count || 0,
      payment_paid: paymentPaid?.count || 0,
      order_shipping: orderShipping?.count || 0,
      order_delivered: orderDelivered?.count || 0
    });
    
  } catch (error: any) {
    console.error('통계 조회 오류:', error);
    return c.json({ error: '통계 조회 실패', details: error.message }, 500);
  }
});

// 관리자 주문 상세 조회
orders.get('/admin/:id', async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));
    
    const order = await c.env.DB.prepare(
      'SELECT * FROM orders WHERE id = ?'
    ).bind(orderId).first();
    
    if (!order) {
      return c.json({ error: '주문을 찾을 수 없습니다' }, 404);
    }
    
    const items = await c.env.DB.prepare(
      'SELECT * FROM order_items WHERE order_id = ?'
    ).bind(orderId).all();
    
    return c.json({
      order,
      items: items.results
    });
    
  } catch (error: any) {
    console.error('주문 상세 조회 오류:', error);
    return c.json({ error: '주문 상세 조회 실패', details: error.message }, 500);
  }
});

// 결제 상태 업데이트
orders.put('/admin/:id/payment-status', async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));
    const { payment_status } = await c.req.json();
    
    // 유효한 결제 상태 확인
    const validStatuses = ['pending', 'paid', 'failed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      return c.json({ error: '유효하지 않은 결제 상태입니다' }, 400);
    }
    
    // 주문 조회
    const order = await c.env.DB.prepare(
      'SELECT * FROM orders WHERE id = ?'
    ).bind(orderId).first();
    
    if (!order) {
      return c.json({ error: '주문을 찾을 수 없습니다' }, 404);
    }
    
    // 결제 완료 시 주문 상태도 함께 변경
    let orderStatus = order.order_status;
    let paidAt = order.paid_at;
    
    if (payment_status === 'paid' && order.payment_status !== 'paid') {
      orderStatus = 'confirmed';
      paidAt = new Date().toISOString();
      
      // 재고 차감
      const orderItems = await c.env.DB.prepare(
        'SELECT * FROM order_items WHERE order_id = ?'
      ).bind(orderId).all();
      
      for (const item of orderItems.results) {
        await c.env.DB.prepare(
          'UPDATE products SET stock = stock - ? WHERE id = ?'
        ).bind(item.quantity, item.product_id).run();
      }
    }
    
    // 상태 업데이트
    await c.env.DB.prepare(`
      UPDATE orders SET
        payment_status = ?,
        order_status = ?,
        paid_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(payment_status, orderStatus, paidAt, orderId).run();
    
    return c.json({
      message: '결제 상태가 업데이트되었습니다',
      payment_status,
      order_status: orderStatus
    });
    
  } catch (error: any) {
    console.error('결제 상태 업데이트 오류:', error);
    return c.json({ error: '결제 상태 업데이트 실패', details: error.message }, 500);
  }
});

// 주문 상태 업데이트
orders.put('/admin/:id/order-status', async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));
    const { order_status } = await c.req.json();
    
    // 유효한 주문 상태 확인
    const validStatuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(order_status)) {
      return c.json({ error: '유효하지 않은 주문 상태입니다' }, 400);
    }
    
    // 주문 조회
    const order = await c.env.DB.prepare(
      'SELECT * FROM orders WHERE id = ?'
    ).bind(orderId).first();
    
    if (!order) {
      return c.json({ error: '주문을 찾을 수 없습니다' }, 404);
    }
    
    // 타임스탬프 업데이트
    let shippedAt = order.shipped_at;
    let deliveredAt = order.delivered_at;
    let cancelledAt = order.cancelled_at;
    
    if (order_status === 'shipped' && !order.shipped_at) {
      shippedAt = new Date().toISOString();
    }
    if (order_status === 'delivered' && !order.delivered_at) {
      deliveredAt = new Date().toISOString();
    }
    if (order_status === 'cancelled' && !order.cancelled_at) {
      cancelledAt = new Date().toISOString();
      
      // 취소 시 재고 복구 (결제 완료된 경우만)
      if (order.payment_status === 'paid') {
        const orderItems = await c.env.DB.prepare(
          'SELECT * FROM order_items WHERE order_id = ?'
        ).bind(orderId).all();
        
        for (const item of orderItems.results) {
          await c.env.DB.prepare(
            'UPDATE products SET stock = stock + ? WHERE id = ?'
          ).bind(item.quantity, item.product_id).run();
        }
      }
    }
    
    // 상태 업데이트
    await c.env.DB.prepare(`
      UPDATE orders SET
        order_status = ?,
        shipped_at = ?,
        delivered_at = ?,
        cancelled_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(order_status, shippedAt, deliveredAt, cancelledAt, orderId).run();
    
    return c.json({
      message: '주문 상태가 업데이트되었습니다',
      order_status
    });
    
  } catch (error: any) {
    console.error('주문 상태 업데이트 오류:', error);
    return c.json({ error: '주문 상태 업데이트 실패', details: error.message }, 500);
  }
});

// 배송 정보 업데이트
orders.put('/admin/:id/shipping', async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));
    const { delivery_company, tracking_number, order_status } = await c.req.json();
    
    if (!delivery_company || !tracking_number) {
      return c.json({ error: '배송 정보가 누락되었습니다' }, 400);
    }
    
    const shippedAt = new Date().toISOString();
    
    await c.env.DB.prepare(`
      UPDATE orders SET
        delivery_company = ?,
        tracking_number = ?,
        order_status = ?,
        shipped_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(delivery_company, tracking_number, order_status || 'shipped', shippedAt, orderId).run();
    
    return c.json({
      message: '배송 정보가 업데이트되었습니다'
    });
    
  } catch (error: any) {
    console.error('배송 정보 업데이트 오류:', error);
    return c.json({ error: '배송 정보 업데이트 실패', details: error.message }, 500);
  }
});

// 관리자 메모 업데이트
orders.put('/admin/:id/memo', async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));
    const { admin_memo } = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE orders SET
        admin_memo = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(admin_memo || null, orderId).run();
    
    return c.json({
      message: '메모가 저장되었습니다'
    });
    
  } catch (error: any) {
    console.error('메모 저장 오류:', error);
    return c.json({ error: '메모 저장 실패', details: error.message }, 500);
  }
});

// 결제 준비 - 주문 생성 (결제 대기 상태)
orders.post('/prepare-payment', async (c) => {
  try {
    const orderData = await c.req.json();
    
    // 필수 필드 검증
    if (!orderData.customer_name || !orderData.customer_email || !orderData.customer_phone || !orderData.items || orderData.items.length === 0) {
      return c.json({ error: '필수 정보가 누락되었습니다' }, 400);
    }
    
    // 주문 번호 생성
    const orderNumber = generateOrderNumber();
    
    // 주문 생성 (결제 대기 상태)
    const orderResult = await c.env.DB.prepare(`
      INSERT INTO orders (
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        customer_zipcode,
        customer_address,
        customer_detail_address,
        delivery_message,
        total_amount,
        delivery_fee,
        final_amount,
        payment_method,
        payment_status,
        order_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'card', 'pending', 'pending')
    `).bind(
      orderNumber,
      orderData.customer_name,
      orderData.customer_email,
      orderData.customer_phone,
      orderData.customer_zipcode || null,
      orderData.customer_address || null,
      orderData.customer_detail_address || null,
      orderData.delivery_message || null,
      orderData.total_amount,
      orderData.delivery_fee,
      orderData.final_amount
    ).run();
    
    const orderId = orderResult.meta.last_row_id;
    
    // 주문 상품 등록
    for (const item of orderData.items) {
      // 제품 정보 조회
      const product = await c.env.DB.prepare(
        'SELECT * FROM products WHERE id = ?'
      ).bind(item.product_id).first();
      
      if (!product) {
        continue;
      }
      
      await c.env.DB.prepare(`
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          product_concept,
          product_category,
          product_refresh_type,
          product_volume,
          quantity,
          unit_price,
          total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        orderId,
        product.id,
        product.name,
        product.concept,
        product.category || null,
        product.refresh_type || null,
        product.volume || null,
        item.quantity,
        item.unit_price,
        item.unit_price * item.quantity
      ).run();
    }
    
    console.log('주문 생성 완료:', {
      orderId,
      orderNumber,
      amount: orderData.final_amount
    });
    
    // 결제 안내 페이지로 리디렉트 (주문번호 포함)
    const origin = c.req.header('origin') || 'http://localhost:3000';
    const paymentInfoUrl = `${origin}/static/payment-info.html?orderNumber=${orderNumber}&amount=${orderData.final_amount}`;
    
    return c.json({
      success: true,
      orderId: orderId,
      orderNumber: orderNumber,
      checkoutUrl: paymentInfoUrl,
      message: '주문이 생성되었습니다'
    });
    
  } catch (error: any) {
    console.error('주문 생성 오류:', error);
    return c.json({ error: '주문 생성 실패', details: error.message }, 500);
  }
});

// 페이업 결제 링크 요청 (SMS/카카오톡)
orders.post('/request-payup', async (c) => {
  try {
    const { orderNumber, amount } = await c.req.json();
    
    if (!orderNumber || !amount) {
      return c.json({ error: '주문번호와 금액이 필요합니다' }, 400);
    }
    
    // 주문 정보 조회
    const order = await c.env.DB.prepare(
      'SELECT * FROM orders WHERE order_number = ?'
    ).bind(orderNumber).first();
    
    if (!order) {
      return c.json({ error: '주문을 찾을 수 없습니다' }, 404);
    }
    
    console.log('페이업 결제 링크 요청:', {
      orderNumber,
      amount,
      customerName: order.customer_name,
      customerPhone: order.customer_phone
    });
    
    // TODO: 실제 페이업 API 연동
    // 현재는 로그만 남기고 성공 응답
    // 페이업 API 키를 받으면 실제 API 호출 코드로 교체
    
    /*
    // 페이업 API 연동 예시 (API 키 받으면 활성화)
    const payupResponse = await fetch('https://api.payup.co.kr/v1/payments/link', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.PAYUP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        merchant_id: c.env.PAYUP_MERCHANT_ID,
        order_id: orderNumber,
        amount: amount,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        product_name: '아로마펄스 제품',
        callback_url: `${c.req.header('origin')}/api/orders/payup-callback`,
        method: 'sms' // 또는 'kakao'
      })
    });
    
    const payupResult = await payupResponse.json();
    */
    
    // 주문 상태 업데이트 (결제 대기 → 결제 링크 전송)
    await c.env.DB.prepare(`
      UPDATE orders 
      SET payment_method = 'payup', 
          updated_at = CURRENT_TIMESTAMP
      WHERE order_number = ?
    `).bind(orderNumber).run();
    
    return c.json({
      success: true,
      message: '페이업 결제 링크가 요청되었습니다',
      orderNumber: orderNumber,
      // payupLinkId: payupResult.link_id, // 실제 API 연동 시
      note: 'API 연동 대기 중 - 관리자가 수동으로 링크를 전송합니다'
    });
    
  } catch (error: any) {
    console.error('페이업 요청 오류:', error);
    return c.json({ error: '페이업 요청 실패', details: error.message }, 500);
  }
});

// 페이업 결제 완료 콜백
orders.post('/payup-callback', async (c) => {
  try {
    const callbackData = await c.req.json();
    
    console.log('페이업 콜백 수신:', callbackData);
    
    // TODO: 페이업 콜백 데이터 검증 및 주문 상태 업데이트
    // 실제 페이업 API 연동 시 구현
    
    return c.json({ success: true, message: '콜백 처리 완료' });
    
  } catch (error: any) {
    console.error('페이업 콜백 오류:', error);
    return c.json({ error: '콜백 처리 실패', details: error.message }, 500);
  }
});

// 토스페이먼츠 결제 승인
orders.post('/confirm-payment', async (c) => {
  try {
    const { paymentKey, orderId, amount, orderData } = await c.req.json();

    if (!paymentKey || !orderId || !amount || !orderData) {
      return c.json({ error: '필수 정보가 누락되었습니다' }, 400);
    }

    // 토스페이먼츠 API로 결제 승인 요청
    const tossSecretKey = c.env.TOSS_SECRET_KEY || 'test_sk_ma60RZblrq7YNqnEzPKb3wzYWBn1';
    const encodedKey = btoa(tossSecretKey + ':');

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount
      })
    });

    const tossData = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error('토스페이먼츠 결제 승인 실패:', tossData);
      return c.json({ 
        error: '결제 승인 실패', 
        details: tossData.message || '알 수 없는 오류' 
      }, 400);
    }

    // 주문 번호 생성
    const orderNumber = generateOrderNumber();

    // 주문 생성
    const orderResult = await c.env.DB.prepare(`
      INSERT INTO orders (
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        customer_zipcode,
        customer_address,
        customer_detail_address,
        delivery_message,
        total_amount,
        delivery_fee,
        final_amount,
        payment_method,
        payment_status,
        order_status,
        payment_id,
        payment_data,
        paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'confirmed', ?, ?, ?)
    `).bind(
      orderNumber,
      orderData.customer_name,
      orderData.customer_email,
      orderData.customer_phone,
      orderData.customer_zipcode || null,
      orderData.customer_address || null,
      orderData.customer_detail_address || null,
      orderData.delivery_message || null,
      orderData.total_amount,
      orderData.delivery_fee,
      orderData.final_amount,
      tossData.method || 'CARD',
      paymentKey,
      JSON.stringify(tossData),
      new Date().toISOString()
    ).run();

    const dbOrderId = orderResult.meta.last_row_id;

    // 주문 상품 등록
    for (const item of orderData.items) {
      // 제품 정보 조회
      const product = await c.env.DB.prepare(
        'SELECT * FROM products WHERE id = ?'
      ).bind(item.product_id).first();

      if (!product) {
        continue;
      }

      await c.env.DB.prepare(`
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          product_concept,
          product_category,
          product_refresh_type,
          product_volume,
          quantity,
          unit_price,
          total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        dbOrderId,
        product.id,
        product.name,
        product.concept,
        product.category || null,
        product.refresh_type || null,
        product.volume || null,
        item.quantity,
        item.unit_price,
        item.unit_price * item.quantity
      ).run();

      // 재고 차감
      await c.env.DB.prepare(
        'UPDATE products SET stock = stock - ? WHERE id = ?'
      ).bind(item.quantity, item.product_id).run();
    }

    return c.json({
      message: '결제가 완료되었습니다',
      order_number: orderNumber,
      order_id: dbOrderId,
      final_amount: orderData.final_amount,
      payment_method: tossData.method || 'CARD'
    });

  } catch (error: any) {
    console.error('결제 승인 오류:', error);
    return c.json({ 
      error: '결제 처리 실패', 
      details: error.message 
    }, 500);
  }
});

export default orders;
