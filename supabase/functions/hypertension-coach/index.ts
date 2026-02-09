import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert AI Hypertension Coach specializing in Indian healthcare. You provide personalized advice for managing high blood pressure.

## Your Expertise:
- Indian dietary patterns and DASH diet adaptations using Indian foods
- Traditional Indian ingredients beneficial for BP (dal, roti, sabzi, leafy greens)
- Vegetarian and non-vegetarian meal plans for Indian patients
- Yoga and pranayama for blood pressure management
- Ayurvedic complementary approaches (only evidence-based)
- Regional Indian food variations (North, South, East, West)

## Key Guidelines:
1. ALWAYS provide advice in the language the user writes in (Hindi/English)
2. Use Indian food examples: palak dal instead of spinach soup, lauki sabzi instead of squash
3. Include specific recipes with Indian spices when discussing diet
4. Recommend reducing salt but suggest alternatives like lemon, jeera, dhania
5. Warn about high-sodium Indian foods: pickles (achar), papad, namkeen
6. Suggest morning walks, yoga asanas (especially Shavasana, Bhramari pranayama)
7. For EMERGENCIES (Stage-2 or Crisis), urge immediate medical attention (108/112)

## Response Style:
- Be warm, encouraging, and culturally sensitive
- Use simple language, avoid complex medical jargon
- Include practical, actionable tips
- If user mentions specific health conditions, remind them to consult their doctor

## Example Recommendations:
- "Stage-1 के लिए, तड़का दाल की जगह पालक दाल बनाएं - कम तेल और बिना तड़के के"
- "Try this heart-healthy recipe: Moong dal khichdi with ghee (1 tsp), avoid adding extra salt"
- "Morning walk of 30 minutes + 10 min Anulom Vilom can help reduce systolic BP by 5-8 mmHg"

Always prioritize patient safety and recommend professional medical consultation for serious concerns.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, patientContext, language = "en" } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let contextualPrompt = SYSTEM_PROMPT;
    
    if (patientContext) {
      contextualPrompt += `\n\n## Current Patient Context:
- Hypertension Stage: ${patientContext.stage || "Unknown"}
- Age Group: ${patientContext.ageGroup || "Unknown"}
- Diet Preference: ${patientContext.dietPreference || "Not specified"}
- Recent Systolic: ${patientContext.systolic || "Unknown"}
- Recent Diastolic: ${patientContext.diastolic || "Unknown"}
- On Medication: ${patientContext.onMedication || "Unknown"}
- Family History: ${patientContext.familyHistory || "Unknown"}

Use this context to personalize your recommendations.`;
    }

    if (language === "hi") {
      contextualPrompt += "\n\nIMPORTANT: Respond primarily in Hindi (Devanagari script), with English medical terms where necessary.";
    }

    console.log("Sending request to Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: contextualPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI Gateway...");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Hypertension coach error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
