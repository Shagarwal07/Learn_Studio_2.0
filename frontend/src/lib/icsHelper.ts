const formatDateTime = (dateStr: string, timeStr: string) => {
  // dateStr is "YYYY-MM-DD", timeStr is "HH:MM:SS" or "HH:MM"
  const cleanDate = dateStr.replace(/-/g, '');
  // Extract only HHMM from timeStr and append 00 for seconds
  const parts = timeStr.split(':');
  const hh = parts[0] || '00';
  const mm = parts[1] || '00';
  return `${cleanDate}T${hh.padStart(2, '0')}${mm.padStart(2, '0')}00`;
};

export const generateIcsFile = (events: any[], filename = 'schedule.ics') => {
  if (!events || events.length === 0) return;

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
  const nowDate = String(now.getDate()).padStart(2, '0');
  const nowHours = String(now.getHours()).padStart(2, '0');
  const nowMinutes = String(now.getMinutes()).padStart(2, '0');
  const dtStamp = `${nowYear}${nowMonth}${nowDate}T${nowHours}${nowMinutes}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LearnStudio//NONSGML Schedule Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach((event) => {
    const start = formatDateTime(event.eventDate, event.startTime);
    const end = formatDateTime(event.eventDate, event.endTime);
    
    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:event-${event.id || Math.floor(Math.random() * 1000000)}@learnstudio.com`);
    icsContent.push(`DTSTAMP:${dtStamp}`);
    icsContent.push(`DTSTART:${start}`);
    icsContent.push(`DTEND:${end}`);
    icsContent.push(`SUMMARY:${event.title}`);
    
    // Clean description for ICS format
    const desc = (event.description || '')
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n');
    icsContent.push(`DESCRIPTION:${desc}`);
    
    const location = event.meetingLink || event.location || 'Online';
    icsContent.push(`LOCATION:${location}`);
    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
