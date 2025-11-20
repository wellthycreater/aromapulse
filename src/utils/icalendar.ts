// iCalendar (.ics) file generation utilities
// RFC 5545 compliant format for calendar events

/**
 * Format date for iCalendar (YYYYMMDDTHHMMSSZ format in UTC)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate a unique UID for calendar events
 */
export function generateEventUID(bookingId: number, domain: string = 'aromapulse.kr'): string {
  const timestamp = Date.now();
  return `booking-${bookingId}-${timestamp}@${domain}`;
}

/**
 * Escape special characters for iCalendar format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Fold lines longer than 75 characters (RFC 5545 requirement)
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;

  const lines: string[] = [];
  let remaining = line;

  while (remaining.length > 75) {
    lines.push(remaining.substring(0, 75));
    remaining = ' ' + remaining.substring(75); // Continuation lines start with space
  }

  if (remaining.length > 0) {
    lines.push(remaining);
  }

  return lines.join('\r\n');
}

export interface ICalendarEvent {
  uid: string;
  summary: string; // Event title
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  organizerName?: string;
  organizerEmail?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  url?: string;
}

/**
 * Generate iCalendar (.ics) file content
 */
export function generateICalendar(event: ICalendarEvent): string {
  const now = new Date();
  const lines: string[] = [];

  // Calendar header
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//AromaPulse//Workshop Booking//KR');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:REQUEST');

  // Event
  lines.push('BEGIN:VEVENT');
  lines.push(`UID:${event.uid}`);
  lines.push(`DTSTAMP:${formatICalDate(now)}`);
  lines.push(`DTSTART:${formatICalDate(event.startDate)}`);
  lines.push(`DTEND:${formatICalDate(event.endDate)}`);
  lines.push(`SUMMARY:${escapeICalText(event.summary)}`);

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`);
  }

  if (event.organizerEmail) {
    const organizerName = event.organizerName || event.organizerEmail;
    lines.push(`ORGANIZER;CN=${escapeICalText(organizerName)}:mailto:${event.organizerEmail}`);
  }

  if (event.attendeeEmail) {
    const attendeeName = event.attendeeName || event.attendeeEmail;
    lines.push(
      `ATTENDEE;CN=${escapeICalText(attendeeName)};RSVP=TRUE:mailto:${event.attendeeEmail}`
    );
  }

  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push('STATUS:CONFIRMED');
  lines.push('SEQUENCE:0');
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  // Fold lines and join with CRLF
  return lines.map(foldLine).join('\r\n');
}

/**
 * Generate iCalendar for workshop booking
 */
export interface WorkshopBookingData {
  bookingId: number;
  workshopTitle: string;
  workshopDescription?: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:MM
  duration: number; // minutes
  location: string;
  address?: string;
  customerName: string;
  customerEmail: string;
  providerName?: string;
  providerEmail?: string;
}

export function generateWorkshopICalendar(booking: WorkshopBookingData): string {
  // Parse date and time
  const [year, month, day] = booking.bookingDate.split('-').map(Number);
  const [hours, minutes] = booking.bookingTime.split(':').map(Number);

  const startDate = new Date(year, month - 1, day, hours, minutes);
  const endDate = new Date(startDate.getTime() + booking.duration * 60 * 1000);

  // Build description
  const descriptionParts: string[] = [];
  descriptionParts.push(`아로마펄스 워크샵 예약`);
  descriptionParts.push(`\n예약번호: ${booking.bookingId}`);
  descriptionParts.push(`\n예약자: ${booking.customerName}`);

  if (booking.workshopDescription) {
    descriptionParts.push(`\n\n${booking.workshopDescription}`);
  }

  descriptionParts.push(
    `\n\n예약 확인: https://www.aromapulse.kr/my-bookings?id=${booking.bookingId}`
  );

  // Build location string
  const locationStr = booking.address ? `${booking.location} - ${booking.address}` : booking.location;

  // Generate UID
  const uid = generateEventUID(booking.bookingId);

  return generateICalendar({
    uid,
    summary: `${booking.workshopTitle}`,
    description: descriptionParts.join(''),
    location: locationStr,
    startDate,
    endDate,
    organizerName: booking.providerName || '아로마펄스',
    organizerEmail: booking.providerEmail || 'support@aromapulse.kr',
    attendeeName: booking.customerName,
    attendeeEmail: booking.customerEmail,
    url: `https://www.aromapulse.kr/workshops/${booking.bookingId}`,
  });
}

/**
 * Get file download headers for .ics file
 */
export function getICalendarHeaders(filename: string = 'booking.ics'): Record<string, string> {
  return {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-cache',
  };
}
