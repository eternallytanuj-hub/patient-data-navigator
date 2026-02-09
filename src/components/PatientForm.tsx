import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { predictHypertension, type PatientInput, type PredictionResult } from "@/lib/prediction";
import PredictionResultCard from "./PredictionResult";
import BPGuidelines from "./BPGuidelines";
import { Activity, Heart, Stethoscope, Apple, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useToast } from "@/hooks/use-toast";

const yesNo = ["Yes", "No"] as const;

const FormSelect = ({ label, value, onValueChange, options, placeholder }: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}</Label>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder || "Select..."} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/10">
    <Icon className="h-4 w-4 text-primary" />
    <h3 className="font-semibold text-sm text-foreground">{title}</h3>
  </div>
);

interface PatientFormProps {
  onPredictionComplete?: (result: PredictionResult, input: PatientInput) => void;
}

const PatientForm = ({ onPredictionComplete }: PatientFormProps) => {
  const { sessionId } = useSession();
  const { toast } = useToast();
  const [form, setForm] = useState<PatientInput>({
    gender: "",
    ageGroup: "",
    familyHistory: "",
    underMedicalCare: "",
    takingMedication: "",
    diagnosedWhen: "",
    severity: "",
    breathShortness: "",
    visualChanges: "",
    noseBleeding: "",
    systolic: "",
    diastolic: "",
    controlledDiet: "",
  });

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const update = (field: keyof PatientInput) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setResult(null);
  };

  const isComplete = Object.values(form).every((v) => v !== "");

  // Extract numeric BP values from form selections
  const extractBPValues = () => {
    let systolic = 115; // default normal
    let diastolic = 75; // default normal

    if (form.systolic.includes("130+")) systolic = 140;
    else if (form.systolic.includes("121")) systolic = 125;
    else if (form.systolic.includes("111")) systolic = 115;

    if (form.diastolic.includes("100+")) diastolic = 105;
    else if (form.diastolic.includes("91")) diastolic = 95;
    else if (form.diastolic.includes("81")) diastolic = 85;
    else if (form.diastolic.includes("70")) diastolic = 75;

    return { systolic, diastolic };
  };

  const handleSubmit = async () => {
    if (!isComplete) return;
    
    const prediction = predictHypertension(form);
    setResult(prediction);
    
    // Notify parent component
    if (onPredictionComplete) {
      onPredictionComplete(prediction, form);
    }

    // Save BP reading to database
    if (sessionId) {
      setIsSaving(true);
      try {
        const { systolic, diastolic } = extractBPValues();
        const { error } = await supabase.from("bp_readings").insert({
          session_id: sessionId,
          systolic,
          diastolic,
          stage: prediction.stage,
          notes: `Assessment completed. Risk: ${prediction.riskLevel}`,
        });

        if (error) {
          console.error("Failed to save BP reading:", error);
        } else {
          toast({
            title: "Reading Saved",
            description: "Your BP reading has been recorded for progress tracking.",
          });
        }
      } catch (err) {
        console.error("Error saving BP reading:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const patientInfo: Record<string, string> = {
    Gender: form.gender,
    "Age Group": form.ageGroup,
    "Family History": form.familyHistory,
    Severity: form.severity,
    "Systolic BP": form.systolic,
    "Diastolic BP": form.diastolic,
    Diet: form.controlledDiet === "Yes" ? "Controlled" : "Uncontrolled",
    Medication: form.takingMedication,
  };

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Stethoscope className="h-5 w-5" />
              Patient Assessment Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Demographics */}
            <div>
              <SectionHeader icon={User} title="Demographics" />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormSelect label="Gender" value={form.gender} onValueChange={update("gender")} options={["Male", "Female"]} />
                <FormSelect label="Age Group" value={form.ageGroup} onValueChange={update("ageGroup")} options={["18-34", "35-50", "51-64", "65+"]} />
              </div>
            </div>

            {/* Medical History */}
            <div>
              <SectionHeader icon={Heart} title="Medical History" />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormSelect label="Family History of Hypertension" value={form.familyHistory} onValueChange={update("familyHistory")} options={yesNo} />
                <FormSelect label="Currently Under Medical Care" value={form.underMedicalCare} onValueChange={update("underMedicalCare")} options={yesNo} />
                <FormSelect label="Taking BP Medication" value={form.takingMedication} onValueChange={update("takingMedication")} options={yesNo} />
                <FormSelect label="Time Since Diagnosis" value={form.diagnosedWhen} onValueChange={update("diagnosedWhen")} options={["<1 Year", "1 - 5 Years", ">5 Years"]} />
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <SectionHeader icon={Activity} title="Symptoms" />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormSelect label="Severity" value={form.severity} onValueChange={update("severity")} options={["Mild", "Moderate", "Sever"]} />
                <FormSelect label="Shortness of Breath" value={form.breathShortness} onValueChange={update("breathShortness")} options={yesNo} />
                <FormSelect label="Vision Changes" value={form.visualChanges} onValueChange={update("visualChanges")} options={yesNo} />
                <FormSelect label="Nosebleeds" value={form.noseBleeding} onValueChange={update("noseBleeding")} options={yesNo} />
              </div>
            </div>

            {/* Vitals */}
            <div>
              <SectionHeader icon={Stethoscope} title="Vitals" />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormSelect label="Systolic Pressure Range" value={form.systolic} onValueChange={update("systolic")} options={["111 - 120 (Normal)", "121- 130 (Elevated)", "130+ (High)"]} />
                <FormSelect label="Diastolic Pressure Range" value={form.diastolic} onValueChange={update("diastolic")} options={["70 - 80 (Normal)", "81 - 90 (Elevated)", "91 - 100 (High)", "100+ (Crisis)"]} />
              </div>
            </div>

            {/* Lifestyle */}
            <div>
              <SectionHeader icon={Apple} title="Lifestyle" />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormSelect label="Heart-Healthy Diet" value={form.controlledDiet} onValueChange={update("controlledDiet")} options={yesNo} />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isComplete || isSaving}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {isSaving ? "Saving..." : "Generate Risk Assessment"}
            </Button>
          </CardContent>
        </Card>

        {result && <PredictionResultCard result={result} patientInfo={patientInfo} />}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <BPGuidelines />
      </div>
    </div>
  );
};

export default PatientForm;
