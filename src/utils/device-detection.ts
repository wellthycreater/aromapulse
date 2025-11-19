// Device detection utilities
export interface DeviceInfo {
  device_type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string;
  browser: string;
  browser_version: string;
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let device_type: DeviceInfo['device_type'] = 'unknown';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    device_type = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    device_type = 'mobile';
  } else {
    device_type = 'desktop';
  }
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows nt 10.0')) os = 'Windows 10';
  else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (ua.includes('windows nt 6.2')) os = 'Windows 8';
  else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x')) {
    const match = ua.match(/mac os x ([\d_]+)/);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (ua.includes('android')) {
    const match = ua.match(/android ([\d.]+)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    const match = ua.match(/os ([\d_]+)/);
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  } else if (ua.includes('linux')) os = 'Linux';
  
  // Detect browser
  let browser = 'Unknown';
  let browser_version = '';
  
  if (ua.includes('edg/')) {
    const match = ua.match(/edg\/([\d.]+)/);
    browser = 'Edge';
    browser_version = match ? match[1] : '';
  } else if (ua.includes('chrome/') && !ua.includes('edg')) {
    const match = ua.match(/chrome\/([\d.]+)/);
    browser = 'Chrome';
    browser_version = match ? match[1] : '';
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    const match = ua.match(/version\/([\d.]+)/);
    browser = 'Safari';
    browser_version = match ? match[1] : '';
  } else if (ua.includes('firefox/')) {
    const match = ua.match(/firefox\/([\d.]+)/);
    browser = 'Firefox';
    browser_version = match ? match[1] : '';
  } else if (ua.includes('msie') || ua.includes('trident/')) {
    browser = 'Internet Explorer';
  }
  
  return {
    device_type,
    os,
    browser,
    browser_version
  };
}

export async function logUserLogin(
  db: any,
  userId: number,
  email: string,
  loginMethod: 'email' | 'oauth' | 'kakao' | 'naver' | 'google',
  request: Request
): Promise<void> {
  try {
    const userAgent = request.headers.get('User-Agent') || '';
    const deviceInfo = parseUserAgent(userAgent);
    
    // Get IP address
    const ipAddress = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For') || 
                     'unknown';
    
    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    await db.prepare(`
      INSERT INTO user_login_logs (
        user_id, email, device_type, os, browser, browser_version,
        ip_address, user_agent, login_method, login_status, session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      email,
      deviceInfo.device_type,
      deviceInfo.os,
      deviceInfo.browser,
      deviceInfo.browser_version,
      ipAddress,
      userAgent,
      loginMethod,
      'success',
      sessionId
    ).run();
  } catch (error) {
    console.error('Failed to log user login:', error);
    // Don't throw error - logging failure shouldn't break login
  }
}
