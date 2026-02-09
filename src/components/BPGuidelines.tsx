import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const guidelines = [
  { category: "Normal", systolic: "< 120", diastolic: "< 80", color: "bg-green-100 text-green-800 border-green-300" },
  { category: "Elevated", systolic: "120-129", diastolic: "< 80", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { category: "Stage 1", systolic: "130-139", diastolic: "80-89", color: "bg-orange-100 text-orange-800 border-orange-300" },
  { category: "Stage 2", systolic: "≥ 140", diastolic: "≥ 90", color: "bg-red-100 text-red-800 border-red-300" },
  { category: "Crisis", systolic: "> 180", diastolic: "> 120", color: "bg-red-200 text-red-900 border-red-500" },
];

const BPGuidelines = () => (
  <Card className="border-medical/20">
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-semibold text-medical-dark">
        Blood Pressure Guidelines
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {guidelines.map((g) => (
        <div key={g.category} className={`flex items-center justify-between p-2 rounded border text-xs ${g.color}`}>
          <span className="font-semibold w-16">{g.category}</span>
          <span>{g.systolic} / {g.diastolic} mmHg</span>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground mt-2">
        Based on ACC/AHA Clinical Guidelines
      </p>
    </CardContent>
  </Card>
);

export default BPGuidelines;
