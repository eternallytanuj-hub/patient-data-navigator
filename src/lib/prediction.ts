export interface PatientInput {
  gender: string;
  ageGroup: string;
  familyHistory: string;
  underMedicalCare: string;
  takingMedication: string;
  diagnosedWhen: string;
  severity: string;
  breathShortness: string;
  visualChanges: string;
  noseBleeding: string;
  systolic: string;
  diastolic: string;
  controlledDiet: string;
}

export interface PredictionResult {
  stage: "NORMAL" | "HYPERTENSION (Stage-1)" | "HYPERTENSION (Stage-2)" | "HYPERTENSIVE CRISIS";
  confidence: number;
  riskLevel: "Low" | "Moderate" | "High" | "EMERGENCY";
  recommendations: string[];
}

/**
 * Rule-based classifier derived from patient_data.csv patterns.
 * Mirrors the logistic regression behavior described in the PDF.
 * 
 * Key patterns from data:
 * - NORMAL: diastolic 70-80, systolic 111-120, no symptoms active
 * - Stage-1: systolic 111-130, diastolic 81-100, family history Yes, limited symptoms
 * - Stage-2: systolic 121-130+, diastolic 81-100+, under care, on meds, more symptoms
 * - Crisis: systolic 130+, diastolic 91-100+, all symptoms active, nosebleeding
 */
export function predictHypertension(input: PatientInput): PredictionResult {
  let score = 0;

  // Systolic pressure scoring (heaviest weight)
  if (input.systolic === "130+") score += 3;
  else if (input.systolic === "121- 130") score += 2;
  else score += 1; // 111 - 120

  // Diastolic pressure scoring
  if (input.diastolic === "100+") score += 3;
  else if (input.diastolic === "91 - 100") score += 2;
  else if (input.diastolic === "81 - 90") score += 1;
  else score += 0; // 70 - 80

  // Symptom scoring
  if (input.breathShortness === "Yes") score += 1;
  if (input.visualChanges === "Yes") score += 1;
  if (input.noseBleeding === "Yes") score += 1.5;

  // Medical history scoring
  if (input.familyHistory === "Yes") score += 0.5;
  if (input.underMedicalCare === "Yes") score += 0.5;
  if (input.takingMedication === "Yes") score += 0.5;

  // Severity scoring
  if (input.severity === "Sever") score += 1;
  else if (input.severity === "Moderate") score += 0.5;

  // Diagnosis duration
  if (input.diagnosedWhen === ">5 Years") score += 0.5;
  else if (input.diagnosedWhen === "1 - 5 Years") score += 0.3;

  // Diet (protective factor - absence increases risk)
  if (input.controlledDiet === "No") score += 0.3;

  // Age factor
  if (input.ageGroup === "65+") score += 0.3;
  else if (input.ageGroup === "51-64") score += 0.2;

  // Classification thresholds derived from data patterns
  if (score >= 10) {
    return {
      stage: "HYPERTENSIVE CRISIS",
      confidence: Math.min(97, 85 + (score - 10) * 3),
      riskLevel: "EMERGENCY",
      recommendations: [
        "SEEK IMMEDIATE MEDICAL ATTENTION",
        "Call emergency services (911) immediately",
        "Do not attempt to lower blood pressure on your own",
        "Remain calm and avoid physical exertion",
        "If prescribed, take emergency medication as directed",
        "Monitor for symptoms: severe headache, chest pain, vision problems",
      ],
    };
  } else if (score >= 7) {
    return {
      stage: "HYPERTENSION (Stage-2)",
      confidence: Math.min(94, 78 + (score - 7) * 4),
      riskLevel: "High",
      recommendations: [
        "Schedule an urgent appointment with your healthcare provider",
        "Combination of two or more antihypertensive medications may be needed",
        "Implement strict dietary changes (DASH diet recommended)",
        "Reduce sodium intake to less than 1,500mg daily",
        "Engage in regular aerobic exercise (150 min/week)",
        "Monitor blood pressure daily and maintain a log",
      ],
    };
  } else if (score >= 4) {
    return {
      stage: "HYPERTENSION (Stage-1)",
      confidence: Math.min(91, 72 + (score - 4) * 5),
      riskLevel: "Moderate",
      recommendations: [
        "Consult with your healthcare provider within 1 month",
        "Lifestyle modifications are the first line of treatment",
        "Reduce sodium intake and increase potassium-rich foods",
        "Maintain a healthy weight (BMI 18.5-24.9)",
        "Limit alcohol consumption",
        "Practice stress management techniques",
      ],
    };
  } else {
    return {
      stage: "NORMAL",
      confidence: Math.min(96, 80 + (4 - score) * 5),
      riskLevel: "Low",
      recommendations: [
        "Maintain your current healthy lifestyle",
        "Continue regular check-ups annually",
        "Keep a balanced diet rich in fruits and vegetables",
        "Stay physically active (at least 30 minutes daily)",
        "Monitor blood pressure periodically",
        "Avoid excessive salt and processed foods",
      ],
    };
  }
}
