import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl } = await req.json();

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

    console.log('Scanning PDF:', pdfUrl);

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
            content: `You are a concrete test report analyzer. Extract ALL available information from concrete test lab reports.

Extract these fields:
- test_id: The test/sample ID or reference number (e.g., "CT-001", "S123456")
- test_type: The type of test. Must be one of: "7_day", "14_day", "28_day", "slump", "cylinder", "air", "other". Determine based on curing days mentioned (7 day = "7_day", 14 day = "14_day", 28 day = "28_day"), or test type (slump test = "slump", cylinder test = "cylinder", air content = "air")
- pour_date: The date concrete was poured/cast (format: YYYY-MM-DD)
- test_date: The date the test was conducted (format: YYYY-MM-DD)
- supplier: The testing laboratory or concrete supplier name
- target_mpa: The target/specified compressive strength in MPa (just the number)
- actual_mpa: The actual/achieved compressive strength in MPa (just the number)
- sample_count: Number of samples/specimens tested (just the number)
- notes: Any relevant notes, comments, or observations from the report

Return ONLY valid JSON in this exact format:
{"test_id": "string or null", "test_type": "string or null", "pour_date": "string or null", "test_date": "string or null", "supplier": "string or null", "target_mpa": number or null, "actual_mpa": number or null, "sample_count": number or null, "notes": "string or null"}

If you cannot find a value, use null. Do not include any text outside the JSON object.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this concrete test report PDF and extract all available information including test ID, test type, dates, supplier, strength values, sample count, and any notes.'
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

    // Parse the JSON response
    let extractedData = { 
      test_id: null, 
      test_type: null, 
      pour_date: null, 
      test_date: null, 
      supplier: null, 
      target_mpa: null, 
      actual_mpa: null, 
      sample_count: null, 
      notes: null 
    };
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = { ...extractedData, ...JSON.parse(jsonMatch[0]) };
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
