import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch BP readings for this session
    const { data: readings, error } = await supabase
      .from("bp_readings")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      throw new Error("Failed to fetch BP readings");
    }

    if (!readings || readings.length === 0) {
      return new Response(
        JSON.stringify({ 
          analysis: "No BP readings recorded yet. Start by completing the assessment form to track your progress.",
          trend: "neutral",
          change: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate trends
    const latestReading = readings[readings.length - 1];
    const previousReadings = readings.slice(0, -1);
    
    let trendData = {
      readings: readings.map(r => ({
        systolic: r.systolic,
        diastolic: r.diastolic,
        stage: r.stage,
        date: r.created_at
      })),
      latestSystolic: latestReading.systolic,
      latestDiastolic: latestReading.diastolic,
      latestStage: latestReading.stage,
      readingCount: readings.length,
      avgSystolic: 0,
      avgDiastolic: 0,
      systolicChange: 0,
      diastolicChange: 0
    };

    if (readings.length > 1) {
      trendData.avgSystolic = Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / readings.length);
      trendData.avgDiastolic = Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / readings.length);
      
      const firstReading = readings[0];
      trendData.systolicChange = latestReading.systolic - firstReading.systolic;
      trendData.diastolicChange = latestReading.diastolic - firstReading.diastolic;
    }

    // Get AI analysis of trends
    const prompt = `Analyze this patient's blood pressure trend data and provide encouraging, actionable feedback in 2-3 sentences:

BP Readings (${readings.length} total):
${JSON.stringify(trendData.readings, null, 2)}

Latest Reading: ${trendData.latestSystolic}/${trendData.latestDiastolic} mmHg (${trendData.latestStage})
${readings.length > 1 ? `Change since first reading: Systolic ${trendData.systolicChange > 0 ? '+' : ''}${trendData.systolicChange} mmHg, Diastolic ${trendData.diastolicChange > 0 ? '+' : ''}${trendData.diastolicChange} mmHg` : ''}

Provide feedback that:
1. Acknowledges any improvement or expresses concern if readings are worsening
2. Gives one specific actionable tip based on their trend
3. Uses encouraging language

Keep response under 100 words. Include Hindi phrases if appropriate.`;

    console.log("Requesting trend analysis from AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "You are a supportive Indian health coach specializing in hypertension management. Provide brief, encouraging feedback on BP trends." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", response.status);
      // Return basic analysis without AI
      const trend = trendData.systolicChange < 0 ? "improving" : trendData.systolicChange > 0 ? "worsening" : "stable";
      return new Response(
        JSON.stringify({ 
          analysis: `You have ${readings.length} readings recorded. Latest: ${trendData.latestSystolic}/${trendData.latestDiastolic} mmHg.`,
          trend,
          trendData
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices?.[0]?.message?.content || "Unable to generate analysis.";
    
    const trend = trendData.systolicChange < -5 ? "improving" : 
                  trendData.systolicChange > 5 ? "worsening" : "stable";

    console.log("Trend analysis complete");

    return new Response(
      JSON.stringify({ 
        analysis,
        trend,
        trendData
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Trend analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
