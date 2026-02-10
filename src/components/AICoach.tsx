import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Mic, MicOff, Loader2, User, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { type PredictionResult, type PatientInput } from "@/lib/prediction";
import type { SpeechRecognition as SpeechRecognitionType } from "@/types/speech.d";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AICoachProps {
  predictionResult?: PredictionResult | null;
  patientInput?: PatientInput | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hypertension-coach`;

const AICoach = ({ predictionResult, patientInput }: AICoachProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<string>("en");
  const [dietPlanVisible, setDietPlanVisible] = useState<boolean>(false);
  const [dietPlan, setDietPlan] = useState<string>("");
  const [dietFormVisible, setDietFormVisible] = useState<boolean>(false);
  const [dietPreference, setDietPreference] = useState<string>("Vegetarian");
  const [favoriteFoods, setFavoriteFoods] = useState<string>("");
  const LANGUAGE_LABELS: Record<string, string> = {
    en: "English",
    hi: "हिन्दी",
    bn: "বাংলা",
    ta: "தமிழ்",
    te: "తెలుగు",
    ml: "മലയാളം",
    mr: "मराठी",
    gu: "ગુજરાતી",
    kn: "ಕನ್ನಡ",
    pa: "ਪੰਜਾਬੀ",
    or: "ଓଡ଼ିଆ",
    as: "অসমীয়া",
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const { toast } = useToast();

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      let greeting = "";

      const getRiskLevel = (stage: string) => {
        const stageMap: Record<string, string> = {
          "Normal": "Low",
          "Elevated": "Moderate",
          "Stage 1": "High",
          "Stage 2": "Very High",
          "Hypertensive Crisis": "Critical"
        };
        return stageMap[stage] || "Unknown";
      };

      if (predictionResult && patientInput) {
        const riskLevel = getRiskLevel(predictionResult.stage);

        const englishGreeting = `Hello! 🙏 Your Risk Level: ${riskLevel} (Stage: ${predictionResult.stage})\n\nI'm your AI Hypertension Coach. Based on your assessment, I'll provide you:\n✓ Personalized Indian diet plans with specific foods\n✓ Yoga and exercise recommendations\n✓ Lifestyle modifications\n\nAsk me about your personalized diet plan, exercises, or medications!`;

        const hindiGreeting = `नमस्ते! 🙏 आपका Risk Level: ${riskLevel} है (Stage: ${predictionResult.stage})\n\nमैं आपका AI Hypertension Coach हूं। आपके BP को manage करने के लिए मैं आपको:\n✓ व्यक्तिगत भारतीय आहार योजना\n✓ योग और व्यायाम सुझाव\n✓ जीवनशैली संशोधन\n\nप्रदान करूंगा। कृपया अपने आहार, व्यायाम, या दवा के बारे में पूछें।`;

        greeting = `${englishGreeting}\n\n---\n\n${hindiGreeting}`;
      } else {
        const englishGreeting = "Hello! 🙏 I'm your AI Hypertension Coach. Please complete the assessment first to receive personalized Indian diet plans, yoga recommendations, and lifestyle tips.";
        const hindiGreeting = "नमस्ते! 🙏 मैं आपका AI Hypertension Coach हूं। कृपया पहले assessment पूरा करें, फिर मुझसे diet, exercise, या lifestyle के बारे में पूछें।";
        greeting = `${englishGreeting}\n\n---\n\n${hindiGreeting}`;
      }

      setMessages([{ id: crypto.randomUUID(), role: "assistant", content: greeting }]);
    }
  }, [language, predictionResult, patientInput]);

  // Save risk assessment and generate diet plan
  useEffect(() => {
    const saveRiskAssessment = async () => {
      if (!predictionResult || !patientInput) return;

      try {
        const sessionId = sessionStorage.getItem("sessionId") || crypto.randomUUID().toString();
        if (!sessionStorage.getItem("sessionId")) {
          sessionStorage.setItem("sessionId", sessionId);
        }

        // Get risk level based on stage
        const getRiskLevel = (stage: string) => {
          const stageMap: Record<string, string> = {
            "Normal": "Low",
            "Elevated": "Moderate",
            "Stage 1": "High",
            "Stage 2": "Very High",
            "Hypertensive Crisis": "Critical"
          };
          return stageMap[stage] || "Unknown";
        };

        // Generate Indian diet recommendations based on stage
        const getDietRecommendations = (stage: string) => {
          const recommendations: Record<string, string> = {
            "Normal": "• Continue with balanced diet\n• Include vegetables, whole grains, legumes\n• Limit salt to <5g per day\n• Stay hydrated with water and herbal tea",
            "Elevated": "• Focus on low-sodium Indian foods\n• Include more leafy greens, millets, pulses\n• Prepare food with minimal oil\n• Avoid pickles, processed foods, and excess salt",
            "Stage 1": "• Strict DASH-like diet with Indian flavors\n• Increase potassium-rich foods: bananas, spinach, moong\n• Use herbs for seasoning instead of salt\n• Limit red meat, include fish 2x/week",
            "Stage 2": "• Therapeutic DASH diet strictly\n• Plant-based emphasis: dal, beans, vegetables\n• Avoid fried foods and high-sodium snacks\n• Work with nutritionist for meal planning",
            "Hypertensive Crisis": "• Consult doctor immediately\n• Follow prescribed diet plan strictly\n• Emergency dietary management required\n• Regular monitoring essential"
          };
          return recommendations[stage] || "Consult healthcare provider for personalized diet plan";
        };

        const riskLevel = getRiskLevel(predictionResult.stage);
        const dietRecommendations = getDietRecommendations(predictionResult.stage);

        // Save to Supabase
        const { error } = await supabase
          .from("risk_assessments")
          .insert({
            session_id: sessionId,
            age_group: patientInput.ageGroup,
            stage: predictionResult.stage,
            risk_level: riskLevel,
            systolic: patientInput.systolic,
            diastolic: patientInput.diastolic,
            on_medication: patientInput.takingMedication === "Yes",
            family_history: patientInput.familyHistory === "Yes",
            diet_preference: patientInput.controlledDiet,
            diet_recommendations: dietRecommendations,
            lifestyle_recommendations: `• Daily 30-minute exercise (brisk walk, yoga)\n• Manage stress through meditation\n• Sleep 7-8 hours regularly\n• Limit alcohol consumption\n• Avoid smoking\n• Regular BP monitoring`
          });

        if (error) {
          console.error("Error saving risk assessment:", error);
        } else {
          console.log("Risk assessment saved successfully");
        }
      } catch (err) {
        console.error("Failed to save risk assessment:", err);
      }
    };

    saveRiskAssessment();
  }, [predictionResult, patientInput]);

  // Helper to generate a personalized plan (used by Diet Planner form)
  const generateDietPlan = (stage: string, preference: string, favorites: string) => {
    const stageDetails: Record<string, { title: string; keyPoints: string; foods: string; avoid: string }> = {
      "Normal": {
        title: "Normal BP - Maintenance Plan",
        keyPoints: "• Continue balanced, low-sodium diet\n• Focus on whole foods and vegetables\n• Regular physical activity\n• Limit salt to <5g/day",
        foods: "✅ Include: White rice, wheat rotis, jowar, bajra, all seasonal vegetables (leafy greens, beans, carrots), legumes (dal, moong, masoor), dry fruits, fruits (apple, banana, orange), honey, jaggery in moderation",
        avoid: "❌ Avoid: Excess salt, pickles, canned foods, fried snacks, processed meats, excess ghee/oil"
      },
      "Elevated": {
        title: "Elevated BP - Prevention Plan",
        keyPoints: "• Reduce sodium intake strictly\n• Increase potassium-rich foods\n• Focus on plant-based meals\n• 30 mins daily exercise",
        foods: "✅ Include: Brown rice, bajra, jowar, spinach, fenugreek leaves, bottle gourd, bitter gourd, ash gourd, cucumber, tomato, onion, garlic, ginger, moong dal, split chickpeas, groundnuts, almonds, bananas, dates, low-fat yogurt, herbs (dhania, mint)",
        avoid: "❌ Avoid: Papad, namkeen, achar (pickles), salted nuts, processed cheese, high-sodium bread, fried items, excess cooking oil, white rice daily"
      },
      "Stage 1": {
        title: "Stage 1 Hypertension - Therapeutic Plan",
        keyPoints: "• Strict DASH diet adapted to Indian cuisine\n• High potassium, low sodium\n• Consult doctor regularly\n• Monitor BP weekly",
        foods: "✅ Include: Millets (bajra, ragi), oats, brown rice, pulses (moong, masoor, chana, urad), leafy greens (palak, methi), bottle gourd, pumpkin, carrot, beetroot, tomato, cucumber, garlic, ginger, fish (2-3x/week), chicken (skinless), milk (low-fat), curd, honey, herbs, spices (jeera, dhania, turmeric)",
        avoid: "❌ Avoid: White rice, maida, salt/namkeen, achar, papad, processed meats, red meat, eggs (more than 2/week), full-fat dairy, fried foods, refined oil, excess ghee, palm oil, coconut oil"
      },
      "Stage 2": {
        title: "Stage 2 Hypertension - Strict Therapeutic Plan",
        keyPoints: "• Strictly follow DASH diet\n• Minimize salt to <3g/day\n• High fiber intake\n• Medication + lifestyle changes\n• Regular doctor visits",
        foods: "✅ Include: Millets exclusively, oats, pulses as main protein, vegetables (all seasonal), sprouts, soaked seeds, nuts (unsalted), herbs, spices without salt, low-fat curd, turmeric in water, flax seeds, chia seeds, honey, dates",
        avoid: "❌ Avoid: All salted/processed foods, red meat, organ meats, full-fat dairy, fried items, refined grains, fast food, restaurant meals, excess oil, pickles, sauces, canned items, excess spicy food, alcohol"
      },
      "Hypertensive Crisis": {
        title: "EMERGENCY - Immediate Medical Attention Required",
        keyPoints: "🚨 SEEK EMERGENCY HELP (108/112)\n• This is a medical emergency\n• Follow doctor's strict dietary guidance\n• Possible hospitalization needed\n• Complete lifestyle change required",
        foods: "✅ Follow doctor's prescribed diet strictly after medical evaluation",
        avoid: "❌ Any self-medication or home remedies - SEEK PROFESSIONAL HELP"
      }
    };

    const details = stageDetails[stage] || stageDetails["Normal"];

    let dietPreferenceNote = "";
    let preferenceSpecificFoods = "";
    if (preference === "Vegan") {
      dietPreferenceNote = "🌱 VEGAN OPTION";
      preferenceSpecificFoods = `\nProtein Sources: Moong dal, masoor dal, chickpeas, lentils, peas, tofu (if available), nuts (almonds, walnuts, groundnuts), seeds (sunflower, pumpkin), legume flour\nMilk Alternative: Coconut milk (unsweetened, low quantity), or skip\nFats: Mustard oil (limited), sesame oil (limited)`;
    } else if (preference === "Vegetarian") {
      dietPreferenceNote = "🥬 VEGETARIAN OPTION";
      preferenceSpecificFoods = `\nProtein Sources: All dals, paneer (low-fat, occasional), chickpeas, peas, sprouted grams, nuts, seeds, low-fat yogurt\nDairy: Low-fat milk (200-250ml/day), low-fat curd, buttermilk (without salt)\nFats: Ghee (1 tsp/day), mustard or sesame oil (limited)`;
    } else {
      dietPreferenceNote = "🍗 NON-VEGETARIAN OPTION";
      preferenceSpecificFoods = `\nProtein Sources: White fish (sardine, mackerel, pomfret) 2-3x/week, skinless chicken (2-3x/week), eggs (max 2/week - boiled/poached), dals for daily protein\nDairy: Low-fat milk (200-250ml/day), low-fat curd\nFats: Mustard or sesame oil (limited), fish oil beneficial`;
    }

    const favoritesNote = favorites 
      ? `\n\n🍽️ Using Your Favorites:\nIncorporate: ${favorites}\n→ Prepare without added salt\n→ Steam, grill, or bake instead of frying\n→ Use herbs and spices for flavor instead of salt`
      : "";

    const detailedMealPlan = preference === "Vegan"
      ? `\n\n📋 SAMPLE 1-DAY MEAL PLAN:\n\n🌅 BREAKFAST (7-8 AM)\n• Bajra/Ragi porridge (1 cup) with jaggery (small piece)\n• OR Oats upma with vegetables (tomato, onion, carrot)\n• Fresh fruit (banana or orange)\n• Herbal tea (tulsi, ginger)\n\n☕ MID-MORNING (10-11 AM) - Optional\n• Handful of unsalted almonds/walnuts\n• OR Fresh fruit (apple, papaya)\n\n🍲 LUNCH (12-1 PM)\n• Millet khichdi (1.5 cups) OR Brown rice (1 cup) + moong dal\n• Mixed vegetable curry (bottle gourd, pumpkin, beans)\n• Cucumber/tomato salad (lemon juice, not salt)\n• 1 small roti (millet/wheat)\n\n🥤 AFTERNOON (3-4 PM)\n• Herbal tea with ginger\n• Handful of roasted chana/sprouts\n\n🍛 DINNER (7-8 PM)\n• Masoor dal soup (1.5 cups) with vegetables\n• Steamed millet OR Ragi roti (1-2)\n• Leafy greens sabzi (spinach/fenugreek with minimal oil)\n• Mixed vegetable salad\n\n🌙 BEFORE BED (Optional)\n• Warm turmeric milk (using plant-based milk alternate)`
      : preference === "Vegetarian"
      ? `\n\n📋 SAMPLE 1-DAY MEAL PLAN:\n\n🌅 BREAKFAST (7-8 AM)\n• Idli/Dhokla (2-3 pieces) with sambar (low-salt)\n• OR Oats with low-fat milk\n• Fresh fruit (banana or orange)\n• Herbal tea\n\n☕ MID-MORNING (10-11 AM) - Optional\n• Low-fat curd (1/2 cup) with honey\n• OR Handful of unsalted nuts\n\n🍲 LUNCH (12-1 PM)\n• Millet khichdi (1.5 cups) OR Brown rice (1 cup) with moong dal\n• Paneer sabzi (100g fresh paneer, light oil)\n• Mixed vegetable curry (beans, carrots, peas)\n• 1 roti (wheat/millet flour)\n• Cucumber/tomato salad with lemon\n\n🥤 AFTERNOON (3-4 PM)\n• Buttermilk/lassi (without added salt, 200ml)\n• Roasted chana snack\n\n🍛 DINNER (7-8 PM)\n• Masoor/Moong dal tadka (1.5 cups)\n• Leafy greens sabzi (spinach with minimal ghee)\n• 1-2 millet roti\n• Vegetable salad\n\n🌙 BEFORE BED (Optional)\n• Warm low-fat milk with turmeric`
      : `\n\n📋 SAMPLE 1-DAY MEAL PLAN:\n\n🌅 BREAKFAST (7-8 AM)\n• Poached/boiled egg (1) with whole wheat toast\n• OR Upma with vegetables\n• Orange juice (fresh, no added sugar)\n• Herbal tea\n\n☕ MID-MORNING (10-11 AM) - Optional\n• Handful of unsalted almonds\n• OR Fresh fruit (apple, papaya)\n\n🍲 LUNCH (12-1 PM)\n• Basmati/Brown rice (1 cup) + Moong dal soup\n• Grilled fish (100g, white fish) OR Skinless chicken (100g)\n• Mixed vegetable curry (low oil)\n• 1 roti (wheat)\n• Salad with lemon dressing\n\n🥤 AFTERNOON (3-4 PM)\n• Herbal tea\n• Handful of roasted unsalted chana\n\n🍛 DINNER (7-8 PM)\n• Masoor dal (1.5 cups)\n• Leafy green sabzi with minimal oil\n• 1-2 roti\n• Vegetable salad\n\n🌙 BEFORE BED (Optional)\n• Warm low-fat milk with honey`;

    const recipes = preference === "Vegan"
      ? `\n\n👨‍🍳 3 EASY RECIPES:\n\n1️⃣ MOONG DAL KHICHDI (15 mins)\nIngredients: Moong dal (1/2 cup), rice (1/2 cup), turmeric (pinch), cumin (1/2 tsp), water (3 cups), vegetables (optional)\nMethod: Pressure cook dal + rice + water (3 whistles). Temper with cumin. Add vegetables if desired.\n\n2️⃣ LEAFY GREENS SOUP (10 mins)\nIngredients: Spinach (2 cups), ginger (1 tbsp), garlic (3 cloves), turmeric (pinch), cumin (1/2 tsp), water (2 cups)\nMethod: Boil spinach, ginger, garlic. Blend smooth. Season with spices. Serve warm.\n\n3️⃣ MIXED VEGETABLE CURRY (20 mins)\nIngredients: Bottle gourd (1 cup), pumpkin (1 cup), beans (1/2 cup), onion (1), mustard oil (1 tsp), turmeric (pinch), chili powder (optional)\nMethod: Sauté onion in oil. Add vegetables. Cook 15 mins. Season with spices.`
      : preference === "Vegetarian"
      ? `\n\n👨‍🍳 3 EASY RECIPES:\n\n1️⃣ PANEER SABZI (15 mins)\nIngredients: Fresh paneer (100g), onion (1), bell pepper (1/2), tomato (1), ghee (1 tsp), turmeric, cumin\nMethod: Cut paneer into cubes. Sauté onion in ghee. Add peppers, tomato. Add paneer & spices. Cook 8 mins.\n\n2️⃣ CURD RICE (10 mins)\nIngredients: Cooked rice (2 cups), curd (1 cup), turmeric (pinch), mustard (1/4 tsp), curry leaves, ginger\nMethod: Mix rice + curd. Temper mustard & curry leaves in oil. Pour over rice. Mix well.\n\n3️⃣ DAL WITH GREENS (20 mins)\nIngredients: Moong dal (1 cup cooked), spinach (2 cups), ginger (1 tbsp), garlic (3 cloves), cumin (1/2 tsp), minimal oil\nMethod: Cook dal. Boil spinach separately. Add to dal. Temper with ginger, garlic, cumin. Simmer 5 mins.`
      : `\n\n👨‍🍳 3 EASY RECIPES:\n\n1️⃣ GRILLED FISH WITH HERBS (20 mins)\nIngredients: White fish (200g), lemon (1), ginger (1 tbsp), garlic (2 cloves), turmeric, mustard oil (1 tsp)\nMethod: Marinate fish in lemon, ginger, garlic, turmeric (30 mins). Grill in oven at 180°C for 15 mins. Serve with vegetables.\n\n2️⃣ CHICKEN & LENTIL SOUP (25 mins)\nIngredients: Chicken (100g, diced), masoor dal (3/4 cup), vegetable (carrot, peas), turmeric, cumin\nMethod: Boil dal & chicken together (4 whistles). Add vegetables & spices. Simmer 5 mins. Serve hot.\n\n3️⃣ STEAMED FISH WITH VEGETABLES (20 mins)\nIngredients: Fish (150g), vegetables (beans, carrots, bell pepper), ginger (1 tbsp), lemon, minimal oil\nMethod: Place fish on vegetables. Steam for 15 mins. Add ginger & lemon juice. No added salt - use lemon for tang.`;

    const tips = `\n\n💡 IMPORTANT TIPS:\n• USE SPICES NOT SALT: Jeera, dhania, turmeric, ginger, garlic, lemon juice, chili powder for flavor\n• COOKING METHODS: Steam, grill, bake, stir-fry (minimal oil) - avoid deep frying\n• OIL LIMIT: Max 5 tsp per day (mustard or sesame oil is best)\n• HYDRATION: Drink 8-10 glasses of water daily + herbal teas\n• MEAL TIMING: Regular intervals, not too big portions\n• MONITOR: Check BP regularly, keep a food diary, feel free to adjust based on your response\n• CONSISTENCY: Follow this plan for at least 4-6 weeks to see results\n\n⚠️ CONSULT YOUR DOCTOR if:\n• Symptoms worsen\n• BP doesn't improve in 2-3 months\n• Taking medications - ensure diet doesn't interfere\n• Planning to exercise heavily`;

    return `${details.title}\n${details.keyPoints}\n\n${dietPreferenceNote}\n${preferenceSpecificFoods}\n${favoritesNote}\n\n🍽️ RECOMMENDED FOODS:\n${details.foods}\n\n🚫 FOODS TO AVOID:\n${details.avoid}\n${detailedMealPlan}\n${recipes}${tips}`;
  };

  // Request diet plan from server (streams response)
  const requestDietPlan = async (stage: string, preference: string, favorites: string) => {
    setDietPlan("");
    setDietPlanVisible(true);
    setIsLoading(true);

    const systemInstruction = { role: "system", content: "You are an expert Indian dietitian. Create a culturally appropriate, evidence-based diet plan for hypertension patients. Be specific with foods, portion suggestions, meal timing, and low-salt preparation methods." };

    const userPrompt = `Generate a personalized Indian diet plan for a patient with hypertension (Stage: ${stage}). Diet preference: ${preference}. Favorite foods / dislikes: ${favorites || 'None provided'}. Provide a 5-point summary, a sample 1-day meal schedule with portion suggestions, and 3 recipe ideas using the patient's favorites where possible. Keep language simple and include both English and Hindi lines if appropriate.`;

    const messagesToSend = [systemInstruction, { role: "user", content: userPrompt }];

    console.log("[Diet Planner] Requesting plan for stage:", stage, "preference:", preference, "favorites:", favorites);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: messagesToSend, patientContext: { stage, dietPreference: preference }, language }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("[Diet Planner] Response error:", response.status, err);
        throw new Error(err.error || `Request failed: ${response.status}`);
      }

      console.log("[Diet Planner] Response OK, status:", response.status);
      const ct = response.headers.get("content-type") || "";
      console.log("[Diet Planner] Content-Type:", ct);

      // If server returned JSON (non-streaming), handle it
      if (ct.includes("application/json")) {
        const json = await response.json().catch(() => ({}));
        console.log("[Diet Planner] Received JSON response:", json);
        // Try common fields
        const maybeText = json.choices?.[0]?.message?.content || json.analysis || json.message || JSON.stringify(json);
        setDietPlan(String(maybeText));
        console.log("[Diet Planner] Set diet plan with JSON response");
        setIsLoading(false);
        return;
      }

      if (!response.body) throw new Error("No response body");

      console.log("[Diet Planner] Starting to stream response...");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
            if (content) {
              chunkCount++;
              setDietPlan((prev) => prev + content);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
            if (content) setDietPlan((prev) => prev + content);
          } catch {}
        }
      }
      console.log("[Diet Planner] Stream completed, received", chunkCount, 'chunks');
    } catch (err) {
      console.error("[Diet Planner] Error:", err);
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to generate diet plan", variant: "destructive" });
      // fallback to local generator
      const fallback = generateDietPlan(stage, preference, favorites);
      setDietPlan(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Speech recognition setup (initialize once)
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-IN";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event?.error || event);
        setIsListening(false);
        toast({
          title: "Voice input error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
    };
    // initialize only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update language when it changes (set speech recognition locale)
  useEffect(() => {
    if (recognitionRef.current) {
      try {
        const localeMap: Record<string, string> = {
          en: "en-IN",
          hi: "hi-IN",
          bn: "bn-IN",
          ta: "ta-IN",
          te: "te-IN",
          ml: "ml-IN",
          mr: "mr-IN",
          gu: "gu-IN",
          kn: "kn-IN",
          pa: "pa-IN",
          or: "or-IN",
          as: "as-IN",
        };
        recognitionRef.current.lang = localeMap[language] || "en-IN";
      } catch {
        // ignore
      }
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        try { recognitionRef.current.abort(); } catch {}
      }
      setIsListening(false);
      return;
    }

    // Start listening with error handling for permissions or runtime errors
    try {
      recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-IN";
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
      toast({
        title: "Voice input error",
        description:
          err?.message || "Unable to start microphone. Check permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Build patient context from prediction result with diet recommendations
    const getRiskLevel = (stage: string) => {
      const stageMap: Record<string, string> = {
        "Normal": "Low",
        "Elevated": "Moderate",
        "Stage 1": "High",
        "Stage 2": "Very High",
        "Hypertensive Crisis": "Critical"
      };
      return stageMap[stage] || "Unknown";
    };

    const getDietRecommendations = (stage: string) => {
      const recommendations: Record<string, string> = {
        "Normal": "• Continue with balanced diet\n• Include vegetables, whole grains, legumes\n• Limit salt to <5g per day\n• Stay hydrated with water and herbal tea",
        "Elevated": "• Focus on low-sodium Indian foods\n• Include more leafy greens, millets, pulses\n• Prepare food with minimal oil\n• Avoid pickles, processed foods, and excess salt",
        "Stage 1": "• Strict DASH-like diet with Indian flavors\n• Increase potassium-rich foods: bananas, spinach, moong\n• Use herbs for seasoning instead of salt\n• Limit red meat, include fish 2x/week",
        "Stage 2": "• Therapeutic DASH diet strictly\n• Plant-based emphasis: dal, beans, vegetables\n• Avoid fried foods and high-sodium snacks\n• Work with nutritionist for meal planning",
        "Hypertensive Crisis": "• Consult doctor immediately\n• Follow prescribed diet plan strictly\n• Emergency dietary management required\n• Regular monitoring essential"
      };
      return recommendations[stage] || "Consult healthcare provider for personalized diet plan";
    };

    const patientContext = predictionResult && patientInput ? {
      stage: predictionResult.stage,
      riskLevel: getRiskLevel(predictionResult.stage),
      ageGroup: patientInput.ageGroup,
      dietPreference: patientInput.controlledDiet === "Yes" ? "Controlled" : "Uncontrolled",
      systolic: patientInput.systolic,
      diastolic: patientInput.diastolic,
      onMedication: patientInput.takingMedication,
      familyHistory: patientInput.familyHistory,
      recommendedDietPlan: getDietRecommendations(predictionResult.stage),
      importance: "IMPORTANT: Provide personalized Indian diet plans with specific foods, recipes, and meal timing based on the risk stage. Include traditional Indian foods and cooking methods.",
    } : undefined;

    let assistantContent = "";

    const updateAssistantMessage = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { id: crypto.randomUUID(), role: "assistant", content: assistantContent }];
      });
    };

    try {
      // Prepend a system instruction to ensure responses are in the selected language
      const languageLabels: Record<string, string> = {
        en: "English",
        hi: "Hindi",
        bn: "Bengali",
        ta: "Tamil",
        te: "Telugu",
        ml: "Malayalam",
        mr: "Marathi",
        gu: "Gujarati",
        kn: "Kannada",
        pa: "Punjabi",
        or: "Odia",
        as: "Assamese",
      };

      const systemInstruction = language && language !== "en"
        ? { role: "system", content: `Respond in ${languageLabels[language] || languageLabels["hi"]}. Translate and format replies in ${languageLabels[language] || languageLabels["hi"]}.` }
        : { role: "system", content: "Respond in both English and Hindi; provide both language outputs where possible." };

      const messagesToSend = [systemInstruction, ...[...messages, userMessage].map((m) => ({ role: m.role, content: m.content }))];

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: messagesToSend,
          patientContext,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistantMessage(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistantMessage(content);
          } catch {}
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
      // Remove failed assistant message if any
      setMessages((prev) => {
        if (prev[prev.length - 1]?.role === "assistant" && prev[prev.length - 1]?.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, predictionResult, patientInput, language, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // language selector handler (value is ISO-like code used in mapping)
  const setSelectedLanguage = (code: string) => {
    setLanguage(code);
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            AI Hypertension Coach
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-44">
              <Select value={language} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी</SelectItem>
                  <SelectItem value="bn">বাংলা</SelectItem>
                  <SelectItem value="ta">தமிழ்</SelectItem>
                  <SelectItem value="te">తెలుగు</SelectItem>
                  <SelectItem value="ml">മലയാളം</SelectItem>
                  <SelectItem value="mr">मराठी</SelectItem>
                  <SelectItem value="gu">ગુજરાતી</SelectItem>
                  <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                  <SelectItem value="pa">ਪੰਜਾਬੀ</SelectItem>
                  <SelectItem value="or">ଓଡ଼ିଆ</SelectItem>
                  <SelectItem value="as">অসমীয়া</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {predictionResult && (
                <Badge variant="outline" className="text-xs">
                  {predictionResult.stage}
                </Badge>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!predictionResult) {
                    toast({
                      title: "Complete assessment",
                      description: "Please complete the assessment to generate a personalized diet plan.",
                      variant: "destructive",
                    });
                    return;
                  }
                  // open the diet preference form
                  setDietFormVisible(true);
                }}
              >
                Diet Planner
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        {dietFormVisible && (
          <div className="mt-4 bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Diet Planner — Preferences</h3>
              <Button size="icon" variant="ghost" onClick={() => setDietFormVisible(false)}>
                <MicOff className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Diet Preference</label>
                <Select value={dietPreference} onValueChange={(v) => setDietPreference(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="Vegan">Vegan</SelectItem>
                    <SelectItem value="Non-vegetarian">Non-vegetarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Favorite foods / dislikes (comma separated)</label>
                <Textarea
                  value={favoriteFoods}
                  onChange={(e) => setFavoriteFoods(e.target.value)}
                  className="min-h-[60px]"
                  placeholder="e.g. paneer, banana, spicy chutney"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDietFormVisible(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    const stage = predictionResult?.stage || "Normal";
                    setDietFormVisible(false);
                    // Use local generator for immediate feedback
                    const plan = generateDietPlan(stage, dietPreference, favoriteFoods);
                    setDietPlan(plan);
                    setDietPlanVisible(true);
                    setIsLoading(false);
                  }}
                >
                  Generate Plan
                </Button>
              </div>
            </div>
          </div>
        )}

        {dietPlanVisible && dietPlan && (
          <div className="mt-4 bg-muted rounded-lg p-4 max-h-[250px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Personalized Diet Plan</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {predictionResult?.stage || "Unknown"}
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => setDietPlanVisible(false)}>
                  <MicOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
              <ReactMarkdown>{dietPlan}</ReactMarkdown>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={toggleListening}
            disabled={isLoading}
            title={LANGUAGE_LABELS[language] ? `${LANGUAGE_LABELS[language]} voice input` : "Voice input"}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Textarea
            placeholder={
              language === "hi"
                ? "अपना सवाल यहाँ लिखें... (diet, yoga, दवाई)"
                : "Ask about diet, yoga, lifestyle tips..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[44px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AICoach;
