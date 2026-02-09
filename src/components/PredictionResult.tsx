import { type PredictionResult } from "@/lib/prediction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, ShieldAlert, XCircle } from "lucide-react";

interface Props {
  result: PredictionResult;
  patientInfo: Record<string, string>;
}

const stageConfig = {
  NORMAL: {
    bg: "bg-green-50 border-green-400",
    badge: "bg-green-500",
    icon: CheckCircle,
    label: "Normal",
    emoji: "🟢",
  },
  "HYPERTENSION (Stage-1)": {
    bg: "bg-amber-50 border-amber-400",
    badge: "bg-amber-500",
    icon: AlertTriangle,
    label: "Stage 1 Hypertension",
    emoji: "🟡",
  },
  "HYPERTENSION (Stage-2)": {
    bg: "bg-orange-50 border-orange-500",
    badge: "bg-orange-500",
    icon: ShieldAlert,
    label: "Stage 2 Hypertension",
    emoji: "🟠",
  },
  "HYPERTENSIVE CRISIS": {
    bg: "bg-red-50 border-red-600",
    badge: "bg-red-600",
    icon: XCircle,
    label: "Hypertensive Crisis",
    emoji: "🔴",
  },
};

const PredictionResultCard = ({ result, patientInfo }: Props) => {
  const config = stageConfig[result.stage];
  const Icon = config.icon;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Result Card */}
      <Card className={`border-2 ${config.bg}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="h-8 w-8" />
              <div>
                <CardTitle className="text-xl">
                  {config.emoji} {config.label}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Risk Level: <span className={`px-2 py-0.5 rounded text-white text-xs font-bold ${config.badge}`}>{result.riskLevel}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{result.confidence}%</div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Clinical Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-medical font-bold mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Patient Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Patient Information Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(patientInfo).map(([key, value]) => (
              <div key={key} className="bg-muted rounded p-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{key}</div>
                <div className="text-sm font-medium">{value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionResultCard;
