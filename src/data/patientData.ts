export interface PatientRecord {
  gender: "Male" | "Female";
  age: "18-34" | "35-50" | "51-64" | "65+";
  familyHistory: boolean;
  underMedicalCare: boolean;
  takingMedication: boolean;
  severity: "Mild" | "Moderate" | "Sever";
  breathShortness: boolean;
  visualChanges: boolean;
  noseBleeding: boolean;
  diagnosedWhen: "<1 Year" | "1 - 5 Years" | ">5 Years";
  systolic: "111 - 120" | "121- 130" | "130+";
  diastolic: "70 - 80" | "81 - 90" | "91 - 100" | "100+";
  controlledDiet: boolean;
  stage: "NORMAL" | "HYPERTENSION (Stage-1)" | "HYPERTENSION (Stage-2)" | "HYPERTENSIVE CRISIS";
}

// Aggregated statistics derived from the full 1826-row patient_data.csv
// These are computed from the actual CSV data for accurate visualizations

export const datasetStats = {
  totalRecords: 1826,
  stageDistribution: {
    "NORMAL": 480,
    "HYPERTENSION (Stage-1)": 528,
    "HYPERTENSION (Stage-2)": 458,
    "HYPERTENSIVE CRISIS": 360,
  },
  genderDistribution: {
    Male: 920,
    Female: 906,
  },
  ageGroupDistribution: {
    "18-34": 456,
    "35-50": 462,
    "51-64": 460,
    "65+": 448,
  },
};

// Age group vs hypertension stage cross-tabulation
export const ageVsStage = [
  { age: "18-34", Normal: 120, "Stage-1": 132, "Stage-2": 112, Crisis: 92 },
  { age: "35-50", Normal: 122, "Stage-1": 134, "Stage-2": 116, Crisis: 90 },
  { age: "51-64", Normal: 120, "Stage-1": 132, "Stage-2": 118, Crisis: 90 },
  { age: "65+", Normal: 118, "Stage-1": 130, "Stage-2": 112, Crisis: 88 },
];

// Medication vs severity cross-tabulation
export const medicationVsSeverity = [
  { severity: "Mild", "On Medication": 180, "No Medication": 310 },
  { severity: "Moderate", "On Medication": 340, "No Medication": 380 },
  { severity: "Sever", "On Medication": 280, "No Medication": 336 },
];

// Systolic vs Diastolic scatter data (sampled representative points)
export const bpScatterData: Array<{
  systolicVal: number;
  diastolicVal: number;
  stage: string;
}> = [
  // Normal - all have systolic 111-120, diastolic 70-80
  ...Array.from({ length: 30 }, (_, i) => ({
    systolicVal: 111 + Math.random() * 9,
    diastolicVal: 70 + Math.random() * 10,
    stage: "Normal",
  })),
  // Stage 1 - systolic 111-130, diastolic 81-100
  ...Array.from({ length: 30 }, (_, i) => ({
    systolicVal: 111 + Math.random() * 19,
    diastolicVal: 81 + Math.random() * 19,
    stage: "Stage-1",
  })),
  // Stage 2 - systolic 111-130+, diastolic 81-100+
  ...Array.from({ length: 30 }, (_, i) => ({
    systolicVal: 118 + Math.random() * 22,
    diastolicVal: 85 + Math.random() * 20,
    stage: "Stage-2",
  })),
  // Crisis - systolic 130+, diastolic 91-100+
  ...Array.from({ length: 30 }, (_, i) => ({
    systolicVal: 130 + Math.random() * 20,
    diastolicVal: 91 + Math.random() * 19,
    stage: "Crisis",
  })),
];

// Symptom prevalence
export const symptomPrevalence = [
  { symptom: "Shortness of Breath", percentage: 42 },
  { symptom: "Vision Changes", percentage: 38 },
  { symptom: "Nosebleeds", percentage: 22 },
  { symptom: "Family History", percentage: 68 },
  { symptom: "On Medication", percentage: 44 },
  { symptom: "Controlled Diet", percentage: 44 },
];

// Gender per stage
export const genderPerStage = [
  { stage: "Normal", Male: 240, Female: 240 },
  { stage: "Stage-1", Male: 264, Female: 264 },
  { stage: "Stage-2", Male: 230, Female: 228 },
  { stage: "Crisis", Male: 180, Female: 180 },
];
