import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const { toast } = useToast();

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      let greeting = "";
      
      if (predictionResult && patientInput) {
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

        const riskLevel = getRiskLevel(predictionResult.stage);
        
        if (language === "hi") {
          greeting = `नमस्ते! 🙏 आपका Risk Level: ${riskLevel} है (Stage: ${predictionResult.stage})\n\nमैं आपका AI Hypertension Coach हूं। आपके BP को manage करने के लिए मैं आपको:\n✓ व्यक्तिगत भारतीय आहार योजना\n✓ योग और व्यायाम सुझाव\n✓ जीवनशैली संशोधन\n\nप्रदान करूंगा। कृपया अपने आहार, व्यायाम, या दवा के बारे में पूछें।`;
        } else {
          greeting = `Hello! 🙏 Your Risk Level: ${riskLevel} (Stage: ${predictionResult.stage})\n\nI'm your AI Hypertension Coach. Based on your assessment, I'll provide you:\n✓ Personalized Indian diet plans with specific foods\n✓ Yoga and exercise recommendations\n✓ Lifestyle modifications\n\nAsk me about your personalized diet plan, exercises, or medications!`;
        }
      } else {
        greeting = language === "hi" 
          ? "नमस्ते! 🙏 मैं आपका AI Hypertension Coach हूं। आपके BP को manage करने में मदद करूंगा। कृपया पहले assessment पूरा करें, फिर मुझसे diet, exercise, या lifestyle के बारे में पूछें।"
          : "Hello! 🙏 I'm your AI Hypertension Coach. Please complete the assessment first to receive personalized Indian diet plans, yoga recommendations, and lifestyle tips.";
      }
      
      setMessages([{
        id: crypto.randomUUID(),
        role: "assistant",
        content: greeting
      }]);
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

  // Update language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-IN";
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
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
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

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "hi" : "en"));
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
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-1"
            >
              <Globe className="h-4 w-4" />
              {language === "en" ? "हिंदी" : "English"}
            </Button>
            {predictionResult && (
              <Badge variant="outline" className="text-xs">
                {predictionResult.stage}
              </Badge>
            )}
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

        <div className="flex gap-2 mt-4">
          <Button
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={toggleListening}
            disabled={isLoading}
            title={language === "hi" ? "बोलकर टाइप करें" : "Voice input"}
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
