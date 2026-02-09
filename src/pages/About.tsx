import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Search, Siren, CheckCircle, XCircle } from "lucide-react";

const scenarios = [
  {
    icon: Monitor,
    title: "Patient Monitoring",
    desc: "Continuous tracking of patients with known hypertension to detect stage progression and adjust treatment plans accordingly.",
  },
  {
    icon: Search,
    title: "Preventive Screening",
    desc: "Early identification of at-risk individuals through routine screening, enabling proactive lifestyle interventions before hypertension develops.",
  },
  {
    icon: Siren,
    title: "Emergency Triage",
    desc: "Rapid classification of patients presenting with elevated blood pressure to prioritize those requiring immediate medical intervention.",
  },
];

const models = [
  { name: "Logistic Regression", accuracy: "91.2%", selected: true },
  { name: "Random Forest", accuracy: "89.8%", selected: false },
  { name: "Support Vector Machine", accuracy: "88.5%", selected: false },
  { name: "K-Nearest Neighbors", accuracy: "85.3%", selected: false },
  { name: "Decision Tree", accuracy: "84.7%", selected: false },
  { name: "Naive Bayes", accuracy: "82.1%", selected: false },
  { name: "Gradient Boosting", accuracy: "90.4%", selected: false },
];

const flowSteps = [
  "Data Collection",
  "Preprocessing & Encoding",
  "Feature Selection",
  "Model Training",
  "Evaluation",
  "Prediction",
];

const About = () => (
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 className="text-3xl font-bold text-medical-dark mb-2">About Predictive Pulse</h1>
    <p className="text-muted-foreground mb-8 max-w-3xl">
      Predictive Pulse is a machine learning-based hypertension detection system that uses patient clinical data to classify blood pressure conditions into four categories: Normal, Stage-1, Stage-2, and Hypertensive Crisis. The system employs logistic regression as the primary classifier, selected for its superior accuracy of 91.2% among seven evaluated algorithms.
    </p>

    {/* Scenario Cards */}
    <h2 className="text-xl font-semibold text-medical-dark mb-4">Application Scenarios</h2>
    <div className="grid md:grid-cols-3 gap-4 mb-10">
      {scenarios.map(({ icon: Icon, title, desc }) => (
        <Card key={title} className="border-medical/15 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="bg-medical/10 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
              <Icon className="h-5 w-5 text-medical" />
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Model Comparison */}
    <h2 className="text-xl font-semibold text-medical-dark mb-4">Model Comparison</h2>
    <Card className="mb-10">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Algorithm</th>
                <th className="text-center p-3 font-semibold">Accuracy</th>
                <th className="text-center p-3 font-semibold">Selected</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.name} className={`border-b last:border-0 ${m.selected ? "bg-medical/5" : ""}`}>
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3 text-center">{m.accuracy}</td>
                  <td className="p-3 text-center">
                    {m.selected ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {/* Technical Flow */}
    <h2 className="text-xl font-semibold text-medical-dark mb-4">Technical Flow</h2>
    <Card>
      <CardContent className="py-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {flowSteps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className="bg-medical text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
                {step}
              </div>
              {i < flowSteps.length - 1 && (
                <span className="text-medical text-xl">→</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </main>
);

export default About;
