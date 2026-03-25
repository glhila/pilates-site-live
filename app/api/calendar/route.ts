// app/api/calendar/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    // ─── שעות: חילוץ ישיר מהמחרוזת + TZID ───────────────────────────────
    const [datePart, timePart] = c.start_time.split('T');
    const [year, month, day] = datePart.split('-');
    const [hour, minute]     = (timePart ?? '00:00').split(':');

    const totalMinutes = parseInt(hour, 10) * 60 + parseInt(minute, 10) + 50;
    const endHour      = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const endMinute    = String(totalMinutes % 60).padStart(2, '0');

    // TZID מגדיר שהשעה היא בשעון ישראל – Google לא יוסיף offset
    const dtStart = `TZID=Asia/Jerusalem:${year}${month}${day}T${hour}${minute}00`;
    const dtEnd   = `TZID=Asia/Jerusalem:${year}${month}${day}T${endHour}${endMinute}00`;

    // ─── תיאור: שם + קישור וואטסאפ לכל מתאמנת ───────────────────────────
    const attendeeLines = (c.bookings ?? [])
      .map((b: any) => {
        const name  = b.profiles?.full_name;
        const phone = b.profiles?.phone;
        if (!name) return null;

        const normalized = phone
          ? phone.replace(/\D/g, '').replace(/^0/, '972')
          : null;
        const waUrl = normalized
          ? `https://wa.me/${normalized}`
          : null;

        return waUrl ? `${name} – ${waUrl}` : name;
      })
      .filter(Boolean);

    const description = attendeeLines.length > 0
      ? `רשומות (${attendeeLines.length}):\\n${attendeeLines.join('\\n')}`
      : 'אין רשומות';

    return [
      'BEGIN:VEVENT',
      `UID:${c.id}@oneg-pilates`,
      `DTSTART;${dtStart}`,
      `DTEND;${dtEnd}`,
      `SUMMARY:פילאטיס ${c.name}`,
      'LOCATION:רחוב איינשטיין 3 כפר סבא',
      // DESCRIPTION עם fold לפי תקן ics (שורות עד 75 תווים)
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
    // הגדרת timezone – נדרש כשמשתמשים ב-TZID
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Jerusalem',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0300',
    'TZOFFSETTO:+0200',
    'TZNAME:IST',
    'DTSTART:19701025T020000',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0300',
    'TZNAME:IDT',
    'DTSTART:19700329T020000',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
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

// ─── fold: תקן ics מחייב שורות עד 75 תווים, המשך בשורה חדשה עם רווח ───────
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