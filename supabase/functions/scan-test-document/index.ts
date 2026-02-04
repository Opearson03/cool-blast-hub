import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create user-scoped client to validate JWT
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth validation failed:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { pdfUrl, documentType } = await req.json();

    if (!pdfUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'PDF URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} scanning PDF:`, pdfUrl, 'Type:', documentType || 'test_result');

    // Fetch the PDF file
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
    }

    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    
    // Convert to base64 in chunks to avoid stack overflow
    const uint8Array = new Uint8Array(pdfArrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    const pdfBase64 = btoa(binary);

    // Choose system prompt based on document type
    const isDeliveryDocket = documentType === 'delivery_docket';
    const isBuildingPlan = documentType === 'building_plan';
    
    let systemPrompt: string;
    let userPrompt: string;
    
    if (isBuildingPlan) {
      systemPrompt = `You are a building plan analyzer. Extract available information from construction/architectural plans.

Extract these fields:
- project_name: The project or job name if visible
- site_address: The site/project address
- client_name: Client or builder name if visible
- architect: Architect or designer name if visible
- plan_type: Type of plan (floor plan, site plan, structural, footing, slab, etc.)
- drawing_number: Drawing/plan number if visible
- revision: Revision number or date
- scale: Drawing scale if shown (e.g., 1:100)
- total_area_sqm: Total area in square meters if dimensioned
- notes: Any relevant notes or special requirements

Return ONLY valid JSON in this exact format:
{"project_name": "string or null", "site_address": "string or null", "client_name": "string or null", "architect": "string or null", "plan_type": "string or null", "drawing_number": "string or null", "revision": "string or null", "scale": "string or null", "total_area_sqm": number or null, "notes": "string or null"}

If you cannot find a value, use null. Do not include any text outside the JSON object.`;
      userPrompt = 'Please analyze this building/construction plan PDF and extract all available information including project name, site address, client name, architect, plan type, drawing number, revision, scale, and any notes.';
    } else if (isDeliveryDocket) {
      systemPrompt = `You are a concrete delivery docket analyzer. Extract ALL available information from concrete delivery dockets.

Extract these fields:
- docket_number: The delivery docket number or reference (e.g., "D-123456", "DEL001")
- delivery_date: The date of delivery (format: YYYY-MM-DD)
- delivery_time: The time of delivery if available (format: HH:MM)
- supplier: The concrete supplier company name (e.g., "Boral", "Holcim", "Hanson")
- volume_m3: The volume of concrete delivered in cubic meters (just the number)
- mix_code: The concrete mix code/grade (e.g., "N32/20/80", "S40")
- slump: The slump value if specified (just the number in mm)
- truck_rego: The truck registration number if visible
- driver_name: The driver's name if visible
- site_address: The delivery site address - VERY IMPORTANT for matching to jobs
- batch_plant: The batch plant or depot name if visible
- batch_ticket: The batch ticket number if different from docket number
- notes: Any relevant notes, special instructions, or observations

Return ONLY valid JSON in this exact format:
{"docket_number": "string or null", "delivery_date": "string or null", "delivery_time": "string or null", "supplier": "string or null", "volume_m3": number or null, "mix_code": "string or null", "slump": number or null, "truck_rego": "string or null", "driver_name": "string or null", "site_address": "string or null", "batch_plant": "string or null", "batch_ticket": "string or null", "notes": "string or null"}

If you cannot find a value, use null. Do not include any text outside the JSON object.`;
      userPrompt = 'Please analyze this concrete delivery docket PDF and extract all available information including docket number, delivery date/time, supplier, volume, mix code, truck details, and most importantly the site/delivery address.';
    } else {
      systemPrompt = `You are a concrete test report analyzer. Extract ALL available information from concrete test lab reports.

CRITICAL EXTRACTION FIELDS:
- test_id: The test/sample ID or reference number
- test_type: Must be one of: "7_day", "14_day", "28_day", "slump", "cylinder", "air", "other"
- pour_date: Date concrete was poured/cast (format: YYYY-MM-DD)
- test_date: Date test was conducted (format: YYYY-MM-DD)
- supplier: Testing laboratory name
- target_mpa: Target/specified compressive strength in MPa (just the number)
- actual_mpa: Actual/achieved compressive strength in MPa (just the number)
- sample_count: Number of samples/specimens tested
- site_address: The full site/project/delivery address
- project_name: The project or job name
- docket_number: Delivery docket number if visible
- batch_ticket: Batch ticket number if visible
- sample_ref: The lab's sample reference/ID
- project_ref: Client's project/job reference number
- job_number: Any job number visible on the report
- notes: Any relevant notes or observations

Return ONLY valid JSON in this exact format:
{"test_id": "string or null", "test_type": "string or null", "pour_date": "string or null", "test_date": "string or null", "supplier": "string or null", "target_mpa": number or null, "actual_mpa": number or null, "sample_count": number or null, "site_address": "string or null", "project_name": "string or null", "docket_number": "string or null", "batch_ticket": "string or null", "sample_ref": "string or null", "project_ref": "string or null", "job_number": "string or null", "notes": "string or null"}

If you cannot find a value, use null. Do not include any text outside the JSON object.`;
      userPrompt = 'Please analyze this concrete test report PDF and extract all available information including test ID, test type, dates, supplier, strength values, sample count, and most importantly the site/project address.';
    }

    // Use Gemini to analyze the PDF
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response:', content);

    // Parse the JSON response with appropriate defaults
    let defaultData: any;
    if (isBuildingPlan) {
      defaultData = {
        project_name: null,
        site_address: null,
        client_name: null,
        architect: null,
        plan_type: null,
        drawing_number: null,
        revision: null,
        scale: null,
        total_area_sqm: null,
        notes: null
      };
    } else if (isDeliveryDocket) {
      defaultData = { 
        docket_number: null, 
        delivery_date: null, 
        delivery_time: null, 
        supplier: null, 
        volume_m3: null, 
        mix_code: null, 
        slump: null, 
        truck_rego: null,
        driver_name: null,
        site_address: null,
        batch_plant: null,
        batch_ticket: null,
        notes: null 
      };
    } else {
      defaultData = { 
        test_id: null, 
        test_type: null, 
        pour_date: null, 
        test_date: null, 
        supplier: null, 
        target_mpa: null, 
        actual_mpa: null, 
        sample_count: null,
        site_address: null,
        project_name: null,
        docket_number: null,
        batch_ticket: null,
        sample_ref: null,
        project_ref: null,
        job_number: null,
        notes: null 
      };
    }

    let extractedData = { ...defaultData };
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = { ...defaultData, ...JSON.parse(jsonMatch[0]) };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scanning document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
