export const ATELIER_BUSINESS_HOURS = {
  timeZone: 'Asia/Seoul',
  daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  opensAt: '08:00',
  closesAt: '20:00',
} as const;

export function isAtelierBusinessTime(value: Date, time?: string): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ATELIER_BUSINESS_HOURS.timeZone,
    weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  const weekday = part('weekday');
  const at = time ?? `${part('hour')}:${part('minute')}`;
  return ATELIER_BUSINESS_HOURS.daysOfWeek.includes(weekday as any)
    && at >= ATELIER_BUSINESS_HOURS.opensAt
    && at < ATELIER_BUSINESS_HOURS.closesAt;
}
