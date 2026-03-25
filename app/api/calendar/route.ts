// app/api/calendar/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── המרת שעה ישראלית ל-UTC עם Z ─────────────────────────────────────────
function toUtcDtString(datePart: string, timePart: string, durationMinutes = 0): string {
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute]     = (timePart ?? '00:00').split(':').map(Number);

  // שעון קיץ ישראלי (IDT) = UTC+3 | שעון חורף (IST) = UTC+2
  // קירוב מספיק: קיץ = אפריל–ספטמבר + סוף מרץ + תחילת אוקטובר
  const isDst =
    (month > 3 && month < 10) ||
    (month === 3 && day >= 25) ||
    (month === 10 && day < 25);
  const offsetMinutes = isDst ? 3 * 60 : 2 * 60;

  const totalMinutes = hour * 60 + minute - offsetMinutes + durationMinutes;
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCMinutes(utcDate.getUTCMinutes() + totalMinutes);

  const y   = utcDate.getUTCFullYear();
  const mo  = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const d   = String(utcDate.getUTCDate()).padStart(2, '0');
  const h   = String(utcDate.getUTCHours()).padStart(2, '0');
  const min = String(utcDate.getUTCMinutes()).padStart(2, '0');

  return `${y}${mo}${d}T${h}${min}00Z`;
}

// ─── fold: תקן ics מחייב שורות עד 75 תווים ───────────────────────────────
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  let result = '';
  let pos = 0;
  while (pos < line.length) {
    if (pos === 0) {
      result += line.slice(0, 75);
      pos = 75;
    } else {
      result += '\r\n ' + line.slice(pos, pos + 74);
      pos += 74;
    }
  }
  return result;
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, start_time, max_capacity, bookings!class_id(profiles(full_name, phone))')
    .gte('start_time', new Date().toISOString())
    .order('start_time');

  const events = (classes ?? []).map((c) => {
    const [datePart, timePart] = c.start_time.split('T');

    const dtStart = toUtcDtString(datePart, timePart);
    const dtEnd   = toUtcDtString(datePart, timePart, 50);

    // ─── תיאור: שם + קישור וואטסאפ לכל מתאמנת ───────────────────────────
    const attendeeLines = (c.bookings ?? [])
      .map((b: any) => {
        const name  = b.profiles?.full_name;
        const phone = b.profiles?.phone;
        if (!name) return null;
        const normalized = phone
          ? phone.replace(/\D/g, '').replace(/^0/, '972')
          : null;
        const waUrl = normalized ? `https://wa.me/${normalized}` : null;
        return waUrl ? `${name} – ${waUrl}` : name;
      })
      .filter(Boolean);

    const description = attendeeLines.length > 0
      ? `רשומות (${attendeeLines.length}):\\n${attendeeLines.join('\\n')}`
      : 'אין רשומות';

    return [
      'BEGIN:VEVENT',
      `UID:${c.id}@oneg-pilates`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:פילאטיס ${c.name}`,
      'LOCATION:רחוב איינשטיין 3 כפר סבא',
      foldLine(`DESCRIPTION:${description}`),
      'SEQUENCE:1',
      'END:VEVENT',
    ].join('\r\n');
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Oneg Pilates//HE',
    'NAME:עונג של פילאטיס',
    'X-WR-CALNAME:עונג של פילאטיס',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}