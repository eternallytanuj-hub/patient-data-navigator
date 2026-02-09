import PatientForm from "@/components/PatientForm";
import { Shield, ClipboardCheck, HeartPulse, Stethoscope } from "lucide-react";

const features = [
  { icon: Shield, title: "Evidence-Based", desc: "Risk assessment grounded in clinical data" },
  { icon: ClipboardCheck, title: "Guideline Compliant", desc: "Follows ACC/AHA clinical guidelines" },
  { icon: HeartPulse, title: "Personalized", desc: "Tailored recommendations for each patient" },
  { icon: Stethoscope, title: "Professional", desc: "Medical-grade analysis and reporting" },
];

const Index = () => (
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Hero */}
    <section className="text-center mb-10">
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
        Hypertension Detection System
      </h1>
      <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
        Advanced AI-Powered Cardiovascular Risk Assessment Platform. Enter patient data below to generate a comprehensive hypertension risk evaluation.
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

    {/* Form */}
    <PatientForm />
  </main>
);

export default Index;
