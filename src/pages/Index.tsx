import { useState, useEffect } from "react";
import PatientForm from "@/components/PatientForm";
import AICoach from "@/components/AICoach";
import ProgressTracker from "@/components/ProgressTracker";
import { Button } from "@/components/ui/button";
import { Shield, ClipboardCheck, HeartPulse, Stethoscope, Bot, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type PredictionResult, type PatientInput } from "@/lib/prediction";

const features = [
  { icon: Shield, title: "Evidence-Based", desc: "Risk assessment grounded in clinical data" },
  { icon: ClipboardCheck, title: "Guideline Compliant", desc: "Follows ACC/AHA clinical guidelines" },
  { icon: HeartPulse, title: "Personalized", desc: "Tailored recommendations for each patient" },
  { icon: Stethoscope, title: "Professional", desc: "Medical-grade analysis and reporting" },
];

const Index = () => {
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [patientInput, setPatientInput] = useState<PatientInput | null>(null);

  // Load assessment data from localStorage on mount
  useEffect(() => {
    try {
      const savedResult = localStorage.getItem("predictionResult");
      const savedInput = localStorage.getItem("patientInput");
      
      if (savedResult) setPredictionResult(JSON.parse(savedResult));
      if (savedInput) setPatientInput(JSON.parse(savedInput));
    } catch (err) {
      console.error("Failed to load assessment data from localStorage:", err);
    }
  }, []);

  const handlePredictionComplete = (result: PredictionResult, input: PatientInput) => {
    setPredictionResult(result);
    setPatientInput(input);
    
    // Persist to localStorage
    localStorage.setItem("predictionResult", JSON.stringify(result));
    localStorage.setItem("patientInput", JSON.stringify(input));
  };

  const clearAssessment = () => {
    setPredictionResult(null);
    setPatientInput(null);
    localStorage.removeItem("predictionResult");
    localStorage.removeItem("patientInput");
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <section className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          🩺 GenAI Hypertension Coach
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
          AI-Powered Cardiovascular Risk Assessment with personalized Indian diet plans, yoga recommendations, and real-time coaching in Hindi/English.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-primary/5 rounded-lg p-3 border border-primary/10">
              <Icon className="h-6 w-6 text-primary mx-auto mb-1" />
              <div className="font-semibold text-sm text-foreground">{title}</div>
              <div className="text-[11px] text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="assessment" className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="assessment" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span className="hidden sm:inline">Assessment</span>
          </TabsTrigger>
          <TabsTrigger value="coach" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI Coach</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Progress</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessment">
          <PatientForm onPredictionComplete={handlePredictionComplete} />
        </TabsContent>

        <TabsContent value="coach">
          <div className="max-w-3xl mx-auto">
            <AICoach predictionResult={predictionResult} patientInput={patientInput} />
            {!predictionResult && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                💡 Complete an assessment first for personalized coaching based on your health profile.
              </p>
            )}
            {predictionResult && (
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={clearAssessment}>
                  Clear Assessment & Start Fresh
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <div className="max-w-3xl mx-auto">
            <ProgressTracker />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Index;
