import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_TIME_ZONE } from '@miniapp/shared';

export {
  CREDITS_NAME,
  DISPLAY_LANG,
  DISPLAY_LOCALE,
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_TIME_ZONE,
} from '@miniapp/shared';

export function truncateDisplayName(
  source: string,
  maxLength: number = DISPLAY_NAME_MAX_LENGTH
): string {
  const chars = Array.from(source);
  if (chars.length <= maxLength) return source;
  return `${chars.slice(0, maxLength).join('')}…`;
}

export interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function zonedDateParts(date: Date, timeZone: string = DISPLAY_TIME_ZONE): ZonedDateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    hour: Number(read('hour')),
    minute: Number(read('minute')),
    weekday: WEEKDAY_INDEX[read('weekday')] ?? 0,
  };
}

export function zonedCalendarKey(date: Date, timeZone: string = DISPLAY_TIME_ZONE): string {
  const parts = zonedDateParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function addZonedDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}
