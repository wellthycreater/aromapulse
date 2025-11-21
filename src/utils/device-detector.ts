// Device detection utility
export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  userAgent: string;
}

export function detectDevice(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent)) {
    deviceType = 'mobile';
  }
  
  // Detect OS
  let os = 'unknown';
  if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }
  
  // Detect browser
  let browser = 'unknown';
  if (/edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/chrome/i.test(ua) && !/edg/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox/i.test(ua)) {
    browser = 'Firefox';
  } else if (/msie|trident/i.test(ua)) {
    browser = 'IE';
  } else if (/opera|opr\//i.test(ua)) {
    browser = 'Opera';
  }
  
  return {
    deviceType,
    os,
    browser,
    userAgent
  };
}

export function getClientIp(request: Request): string {
  // Try various headers that might contain the real IP
  const headers = [
    'cf-connecting-ip', // Cloudflare
    'x-real-ip',
    'x-forwarded-for',
    'x-client-ip',
  ];
  
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can be comma-separated list
      return value.split(',')[0].trim();
    }
  }
  
  return 'unknown';
}
