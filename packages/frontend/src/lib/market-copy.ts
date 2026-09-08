/**
 * 阶段 2 mock 入口的印尼语文案。
 * C1 已锁：用户侧货币名 = Binar。
 */
import { CREDITS_NAME } from '@miniapp/shared';

export const MARKET_UNAVAILABLE_COPY = {
  create: {
    eyebrow: 'Create',
    title: 'Kreasi',
    body: 'Fitur kreasi dan kolam harapan belum dibuka. Kamu tetap bisa pilih karakter di lobby dan mulai ngobrol.',
  },
  wish: {
    eyebrow: 'Wish Pool',
    title: 'Kolam harapan',
    body: 'Kolam harapan belum dibuka. Permintaan karakter tidak dikirim.',
  },
  payment: {
    eyebrow: 'Wallet',
    title: `Isi ${CREDITS_NAME}`,
    body: `Isi ulang belum dibuka. Dapatkan ${CREDITS_NAME} lewat check-in harian atau undang teman.`,
  },
  orders: {
    eyebrow: 'Orders',
    title: 'Pesanan',
    body: 'Pembayaran belum dibuka, jadi belum ada pesanan.',
  },
  voice: {
    eyebrow: 'Voice',
    title: 'Suara',
    body: 'Fitur suara belum dibuka. Kamu tetap bisa chat teks seperti biasa.',
  },
  image: {
    eyebrow: 'Image',
    title: 'Pengaturan gambar',
    body: 'Fitur ini belum dibuka.',
  },
  insufficientCredits: {
    title: `${CREDITS_NAME} tidak cukup`,
    body: `Isi ulang belum dibuka. Check-in harian atau undang teman untuk dapat ${CREDITS_NAME}, lalu coba lagi.`,
  },
} as const;

export const MARKET_UNAVAILABLE_ACTIONS = {
  checkin: 'Check-in harian',
  invite: 'Undang teman',
  close: 'Mengerti',
  back: 'Kembali',
} as const;

export type MarketUnavailableKind = keyof typeof MARKET_UNAVAILABLE_COPY;
