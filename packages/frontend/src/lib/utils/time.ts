// 把 ISO 时间戳转为印尼语耳语文案，供抽屉、对话页、列表使用。
// 展示时区固定 Asia/Jakarta（WIB）。

import { addZonedDays, pad2, zonedCalendarKey, zonedDateParts } from '@/lib/locale';

const WEEKDAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function partOfDay(h: number): string {
  if (h >= 22 || h < 4) return 'Malam ini';
  if (h >= 18) return 'Malam ini';
  if (h >= 12) return 'Siang ini';
  if (h >= 6) return 'Pagi ini';
  return 'Dini hari';
}

function yesterdayWord(h: number): string {
  if (h >= 22 || h < 4) return 'Tadi malam';
  if (h >= 18) return 'Tadi malam';
  return 'Kemarin';
}

export function formatWhisperTime(iso: string, now: Date = new Date()): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '';

  const diffMs = now.getTime() - t.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 30) return `${diffMin} menit lalu`;

  const tParts = zonedDateParts(t);
  const nowParts = zonedDateParts(now);
  const clock = `${pad2(tParts.hour)}:${pad2(tParts.minute)}`;
  const todayKey = zonedCalendarKey(now);
  const yesterdayKey = zonedCalendarKey(addZonedDays(now, -1));
  const tKey = zonedCalendarKey(t);

  if (tKey === todayKey) {
    return `${partOfDay(tParts.hour)} ${clock}`;
  }
  if (tKey === yesterdayKey) {
    return `${yesterdayWord(tParts.hour)} ${clock}`;
  }

  const todayStart = Date.parse(`${todayKey}T00:00:00+07:00`);
  const tStart = Date.parse(`${tKey}T00:00:00+07:00`);
  const dayDiff = Math.floor((todayStart - tStart) / 86_400_000);

  if (dayDiff < 7) {
    return `${WEEKDAYS[tParts.weekday]} lalu`;
  }
  if (dayDiff < 30) {
    return `${Math.floor(dayDiff / 7)} minggu lalu`;
  }
  if (tParts.year === nowParts.year) {
    return `${tParts.day}/${tParts.month}`;
  }
  return `${tParts.month}/${tParts.year}`;
}
