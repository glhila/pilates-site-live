import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // 1. קבלת ההדרים לאימות
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 })
  }

  // 2. קבלת גוף ההודעה כטקסט נקי (קריטי לאימות החתימה!)
  const body = await req.text();
  
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent

  // 3. אימות החתימה הדיגיטלית
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured during verification', { status: 400 })
  }

  // 4. טיפול באירוע יצירת משתמש
  const eventType = evt.type;
  
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;
    const fullName = `${first_name || ''} ${last_name || ''}`.trim();

    // התחברות ל-Supabase עם ה-Secret Key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    /**
     * לוגיקת החיבור:
     * האדמין כבר יצר שורה עם המייל הזה. אנחנו מחפשים אותה ומעדכנים את ה-clerk_id.
     */
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        clerk_id: id,            // המזהה של Clerk
        full_name: fullName,      // עדכון שם במידה והשתנה ברישום
        updated_at: new Date().toISOString()
      })
      .eq('email', email)         // חיפוש לפי המייל שהאדמין הזין מראש
      .select();

    // בדיקה: אם לא נמצאה שורה כזו (מישהו נרשם בלי שהאדמין הוסיף אותו מראש)
    if (!data || data.length === 0) {
      console.warn(`User ${email} registered but was not pre-approved by admin.`);
      
      // אופציונלי: יצירת פרופיל חדש חסום למי שנרשם "בטעות" בלי לשלם
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          clerk_id: id,
          email: email,
          full_name: fullName,
          is_approved: false // חסום כברירת מחדל
        });

      if (insertError) {
        console.error('Error creating new unapproved profile:', insertError);
      }
    }

    if (updateError) {
      console.error('Error updating profile in Supabase:', updateError)
      return new Response('Error updating database', { status: 500 })
    }
  }

  return new Response('Webhook processed successfully', { status: 200 })
}