import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planUrl, pageNumber } = await req.json();

    if (!planUrl) {
      return new Response(
        JSON.stringify({ detected: false, pixels_per_meter: null, confidence: 0, method: null, message: "No plan URL provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the plan image
    const imageResponse = await fetch(planUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch plan image");
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const mimeType = imageResponse.headers.get("content-type") || "image/png";

    // Use Lovable AI Gateway for scale detection
    const aiResponse = await fetch("https://ai.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY") || ""}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this architectural/construction plan image. Look for scale indicators such as:
1. Scale bars (e.g., graphical scale showing meters/feet)
2. Scale ratios (e.g., "1:100", "1:50", "Scale 1:200")
3. Dimension callouts with known measurements

If you find a scale indicator, calculate the pixels per meter ratio based on:
- The image appears to be approximately 1200 pixels wide (standard)
- A4 at 1:100 scale = 2.97m real width per page

Return your analysis as JSON in this exact format:
{
  "detected": true/false,
  "scale_ratio": "1:100" or null,
  "pixels_per_meter": number or null,
  "confidence": 0.0-1.0,
  "method": "scale_bar" | "dimension" | "ratio" | null,
  "notes": "brief explanation"
}

Only return the JSON, no other text.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      return new Response(
        JSON.stringify({ detected: false, pixels_per_meter: null, confidence: 0, method: null, message: "AI detection unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return new Response(
          JSON.stringify({
            detected: result.detected || false,
            pixels_per_meter: result.pixels_per_meter || null,
            confidence: result.confidence || 0,
            method: result.method || null,
            message: result.notes || null
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
    }

    return new Response(
      JSON.stringify({ detected: false, pixels_per_meter: null, confidence: 0, method: null, message: "Could not parse scale from plan" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in detect-plan-scale:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ detected: false, pixels_per_meter: null, confidence: 0, method: null, message: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
