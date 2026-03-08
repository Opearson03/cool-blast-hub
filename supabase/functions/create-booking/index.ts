import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getZoomAccessToken(): Promise<string> {
  const accountId = Deno.env.get("ZOOM_ACCOUNT_ID");
  const clientId = Deno.env.get("ZOOM_CLIENT_ID");
  const clientSecret = Deno.env.get("ZOOM_CLIENT_SECRET");

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom credentials not configured");
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom auth failed [${res.status}]: ${body}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function createZoomMeeting(
  accessToken: string,
  topic: string,
  startTime: string,
  durationMinutes: number
): Promise<{ join_url: string; id: string }> {
  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      type: 2, // scheduled
      start_time: startTime,
      duration: durationMinutes,
      timezone: "Australia/Sydney",
      settings: {
        join_before_host: false,
        waiting_room: true,
        auto_recording: "none",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom meeting creation failed [${res.status}]: ${body}`);
  }

  const data = await res.json();
  return { join_url: data.join_url, id: String(data.id) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      name,
      email,
      phone,
      company,
      quotes_per_week,
      booking_time,
      timezone,
    } = await req.json();

    // Validation
    if (!name || !email || !company || !booking_time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for double booking
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("booking_time", booking_time)
      .eq("status", "booked")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "This time slot is already booked" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Zoom meeting
    let zoomLink: string | null = null;
    let zoomMeetingId: string | null = null;

    try {
      const accessToken = await getZoomAccessToken();
      const meeting = await createZoomMeeting(
        accessToken,
        `PourHub Onboarding — ${name}`,
        booking_time,
        30
      );
      zoomLink = meeting.join_url;
      zoomMeetingId = meeting.id;
    } catch (zoomErr) {
      console.error("Zoom meeting creation failed, continuing without:", zoomErr);
    }

    // Insert booking
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        name,
        email,
        phone: phone || null,
        company,
        quotes_per_week: quotes_per_week || null,
        booking_time,
        timezone: timezone || "Australia/Sydney",
        zoom_link: zoomLink,
        zoom_meeting_id: zoomMeetingId,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    // Send confirmation email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        const bookingDate = new Date(booking_time);
        const formattedDate = bookingDate.toLocaleDateString("en-AU", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Australia/Sydney",
        });
        const formattedTime = bookingDate.toLocaleTimeString("en-AU", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Australia/Sydney",
        });

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "PourHub <noreply@pourhub.com.au>",
            to: [email],
            subject: "Your PourHub Onboarding Call is Confirmed ✅",
            html: `
              <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #e8720c;">Your call is booked!</h2>
                <p>Hi ${name},</p>
                <p>Your 30 minute PourHub onboarding call is confirmed:</p>
                <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>Date:</strong> ${formattedDate}</p>
                  <p style="margin: 4px 0;"><strong>Time:</strong> ${formattedTime} AEST</p>
                  ${zoomLink ? `<p style="margin: 4px 0;"><strong>Zoom:</strong> <a href="${zoomLink}">${zoomLink}</a></p>` : ""}
                </div>
                <p>We'll show you how to create quotes with PourHub and help you set up your first job.</p>
                <p style="margin-top: 24px;">
                  <a href="https://pourhub.com.au/signup" style="background: #e8720c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Start Your Free Trial</a>
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 32px;">— The PourHub Team</p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error("Confirmation email failed:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        zoom_link: zoomLink,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-booking error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
