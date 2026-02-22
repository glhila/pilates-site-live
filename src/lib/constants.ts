import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SERVICE_PHONE = "052-6409993";
export const STUDIO_NAME = "עונג של פילאטיס";
export const ADMIN_EMAILS = ['hilaglazz13@gmail.com', 'oneg3gri@gmail.com'].map(email => email.toLowerCase());
export const SERVICE_EMAIL = "oneg3gri@gmail.com";

// ─── Schedule / calendar layout (shared by admin + user portal) ─────────────
export const DAYS_HEBREW = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''] as const;
export const TIME_SLOTS = [ '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  'break',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
] as const;
export const HOUR_HEIGHT = 100;
export const MORNING_START = 7;
export const MORNING_END = 13;
export const EVENING_START = 16;
export const EVENING_END = 22;

// ─── Booking rules (user portal) ──────────────────────────────────────────
export const CANCELLATION_WINDOW_HOURS = 4;

// ─── Admin: class types & external links ──────────────────────────────────
export const CLASS_TEMPLATES = [
  "מכשירים - Level 1", "מכשירים - Level 2", "מכשירים - Level 3",
  "מזרן - Level 1", "מזרן - Level 2", "מזרן - Level 3"
] as const;
export const HEALTH_FORM_URL = process.env.NEXT_PUBLIC_HEALTH_FORM_URL || 'https://docs.google.com/forms/d/e/1FAIpQLSfyhdYaC3Sw4afJU-IXjoEbhgNr62w3yeW5seL31i9md8YPrg/viewform?pli=1';

// ─── Shared functions ─────────────────────────────────────────────────────
/** Get Supabase client with Clerk JWT. Pass getToken from useAuth(). */
export async function getAuthenticatedSupabase(
  getToken: (opts: { template: string }) => Promise<string | null>
): Promise<SupabaseClient | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  try {
    const token = await getToken({ template: 'supabase' });
    if (!token) return null;
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  } catch {
    return null;
  }
}
/** Normalize Israeli phone for WhatsApp link (strip non-digits, 0 → 972). */
export const normalizePhoneForWhatsApp = (phone: string): string =>
  phone.replace(/\D/g, '').replace(/^0/, '972');

/** WhatsApp URL for a given phone and optional pre-filled message. */
export const getWhatsAppUrlForPhone = (phone: string, message: string): string =>
  `https://wa.me/${normalizePhoneForWhatsApp(phone)}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

/** Studio contact WhatsApp link (uses SERVICE_PHONE). */
export const getWhatsAppLink = (message: string): string =>
  getWhatsAppUrlForPhone(SERVICE_PHONE, message);

/** Format date string for Hebrew locale (DD.MM.YYYY). */
export const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Format time for Hebrew locale (HH:MM). */
export const formatTime = (dateStr: string): string =>
  new Date(dateStr).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

/** Whether two dates fall in the same week (Sun–Sat). */
export const isSameWeek = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff1 = d1.getDate() - d1.getDay();
  const diff2 = d2.getDate() - d2.getDay();
  const week1 = new Date(d1.setDate(diff1)).toDateString();
  const week2 = new Date(d2.setDate(diff2)).toDateString();
  return week1 === week2;
};