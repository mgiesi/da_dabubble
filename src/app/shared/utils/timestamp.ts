export function formatMessageTime(timestamp: Date | null | undefined): string {
  if (!timestamp) return '';

  const now = new Date();
  const messageDate = new Date(timestamp);

  const isToday = isSameDay(now, messageDate);
  const isYesterday = isSameDay(addDays(now, -1), messageDate);

  const time = formatTime(messageDate);

  if (isToday) {
    return time; // Nur Uhrzeit: "14:25"
  }

  if (isYesterday) {
    return `Gestern ${time}`; // "Gestern 14:25"
  }

  // Älter als gestern: Datum + Uhrzeit
  const day = messageDate.getDate();
  const month = messageDate.toLocaleDateString('de-DE', { month: 'short' });
  return `${day}. ${month} ${time}`; // "12. Jan 14:25"
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDateSeparator(timestamp: Date | null | undefined): string {
  if (!timestamp) return '';

  const now = new Date();
  const messageDate = new Date(timestamp);

  const isToday = isSameDay(now, messageDate);
  const isYesterday = isSameDay(addDays(now, -1), messageDate);

  if (isToday) {
    return 'Heute';
  }

  if (isYesterday) {
    return 'Gestern';
  }

  const day = messageDate.getDate();
  const month = messageDate.toLocaleDateString('de-DE', { month: 'long' });
  return `${day}. ${month}`;
}

export function getDateKey(timestamp: Date | null | undefined): string {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function groupMessagesByDate(messages: any[]): { date: string; dateLabel: string; messages: any[] }[] {
  const groups = new Map<string, any[]>();

  messages.forEach(message => {
    const dateKey = getDateKey(message.timestamp);
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(message);
  });

  return Array.from(groups.entries()).map(([date, msgs]) => ({
    date,
    dateLabel: formatDateSeparator(msgs[0].timestamp),
    messages: msgs
  }));
}