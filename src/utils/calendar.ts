/**
 * Calendar Integration Utility
 * 
 * Generates calendar event URLs for different providers:
 * - Google Calendar
 * - Naver Calendar  
 * - Kakao Calendar
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startTime)}/${formatDate(event.endTime)}`,
    details: event.description || '',
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Naver Calendar URL
 * Naver Calendar uses a similar structure to Google Calendar
 */
export function generateNaverCalendarUrl(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    // Naver uses: YYYYMMDD'T'HHmmss format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  const params = new URLSearchParams({
    title: event.title,
    sd: formatDate(event.startTime),
    ed: formatDate(event.endTime),
    des: event.description || '',
    loca: event.location || '',
  });

  // Naver Calendar web interface
  return `https://calendar.naver.com/event/form?${params.toString()}`;
}

/**
 * Generate Kakao Calendar URL
 * Note: Kakao Calendar API requires authentication
 * This generates a URL that opens the Kakao Calendar app or web interface
 */
export function generateKakaoCalendarUrl(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    // Kakao uses ISO 8601 format
    return date.toISOString();
  };

  // Kakao Calendar deep link structure
  // This will attempt to open the Kakao Calendar app if installed,
  // otherwise falls back to web interface
  const params = new URLSearchParams({
    title: event.title,
    startAt: formatDate(event.startTime),
    endAt: formatDate(event.endTime),
    description: event.description || '',
    location: event.location || '',
  });

  // Using Kakao's calendar scheme
  // If this doesn't work, we'll need to use Kakao's REST API with authentication
  return `kakaotalk://calendar/add?${params.toString()}`;
}

/**
 * Generate calendar URL based on provider
 */
export function generateCalendarUrl(
  provider: 'google' | 'naver' | 'kakao',
  event: CalendarEvent
): string {
  switch (provider) {
    case 'google':
      return generateGoogleCalendarUrl(event);
    case 'naver':
      return generateNaverCalendarUrl(event);
    case 'kakao':
      return generateKakaoCalendarUrl(event);
    default:
      return generateGoogleCalendarUrl(event); // fallback
  }
}

/**
 * Format calendar event from class booking data
 */
export function formatClassBookingEvent(
  classTitle: string,
  classLocation: string,
  bookingDate: Date,
  duration: number = 120 // default 2 hours in minutes
): CalendarEvent {
  const startTime = new Date(bookingDate);
  const endTime = new Date(bookingDate.getTime() + duration * 60 * 1000);

  return {
    title: `${classTitle} 원데이 클래스`,
    description: `아로마펄스 힐링 체험\n\n클래스: ${classTitle}\n장소: ${classLocation}`,
    location: classLocation,
    startTime,
    endTime,
  };
}
