import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Base64url encode helper
function base64urlEncode(data: string): string {
  const base64 = btoa(data);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Convert PEM to binary for signing
async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  // Remove PEM headers and decode
  const pemContents = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false,
    ['sign']
  );
}

// Generate JWT token for APNs
async function generateAPNsToken(teamId: string, keyId: string, privateKey: string): Promise<string> {
  const header = {
    alg: 'ES256',
    kid: keyId,
  };

  const payload = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    key,
    new TextEncoder().encode(signatureInput)
  );

  // Convert signature from DER to raw format and base64url encode
  const signatureArray = new Uint8Array(signature);
  const encodedSignature = base64urlEncode(String.fromCharCode(...signatureArray));

  return `${signatureInput}.${encodedSignature}`;
}

// Send push notification to APNs
async function sendToAPNs(
  deviceToken: string,
  title: string,
  body: string,
  data: Record<string, string> | undefined,
  jwtToken: string,
  bundleId: string
): Promise<{ success: boolean; error?: string }> {
  const payload = {
    aps: {
      alert: {
        title,
        body,
      },
      sound: 'default',
      badge: 1,
    },
    ...data,
  };

  try {
    const response = await fetch(
      `https://api.push.apple.com/3/device/${deviceToken}`,
      {
        method: 'POST',
        headers: {
          'authorization': `bearer ${jwtToken}`,
          'apns-topic': bundleId,
          'apns-push-type': 'alert',
          'apns-priority': '10',
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      console.log(`Push sent successfully to token: ${deviceToken.substring(0, 10)}...`);
      return { success: true };
    } else {
      const errorBody = await response.text();
      console.error(`APNs error: ${response.status} - ${errorBody}`);
      return { success: false, error: `APNs error: ${response.status} - ${errorBody}` };
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return { success: false, error: String(error) };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apnsKeyId = Deno.env.get('APNS_KEY_ID')!;
    const apnsTeamId = Deno.env.get('APNS_TEAM_ID')!;
    const apnsAuthKey = Deno.env.get('APNS_AUTH_KEY')!;
    const bundleId = 'app.lovable.f93db6306fbc403798da9c5a56b01779';

    if (!apnsKeyId || !apnsTeamId || !apnsAuthKey) {
      console.error('Missing APNs configuration');
      return new Response(
        JSON.stringify({ error: 'APNs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id, title, body, data } = await req.json() as NotificationPayload;

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending push notification to user: ${user_id}`);

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', user_id);

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for user');
      return new Response(
        JSON.stringify({ message: 'No push tokens registered for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate APNs JWT token
    const jwtToken = await generateAPNsToken(apnsTeamId, apnsKeyId, apnsAuthKey);

    // Send to all iOS tokens
    const results = await Promise.all(
      tokens
        .filter(t => t.platform === 'ios')
        .map(t => sendToAPNs(t.token, title, body, data, jwtToken, bundleId))
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Push notification results: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        message: 'Push notifications processed',
        success_count: successCount,
        failure_count: failureCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
