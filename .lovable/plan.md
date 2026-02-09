

# Predictive Pulse: Hypertension Detection Web App

## Overview
A professional, medical-grade AI-powered cardiovascular risk assessment platform built with React, TypeScript, and Tailwind CSS. The app replicates the full project from the PDF — including data analysis visualizations, a patient assessment form, and hypertension stage prediction — all powered by the provided patient_data.csv.

---

## Page 1: Home / Prediction Page

### Header
- Professional medical header with gradient background (blue → dark blue)
- Title: "Hypertension Detection — Medical Grade AI-Powered"
- Subtitle: "Advanced AI-Powered Cardiovascular Risk Assessment Platform"

### About Section
- Brief description of the system
- Feature highlights: Evidence-based risk assessment, Clinical guideline compliance, Personalized recommendations, Professional medical support

### Patient Assessment Form
A comprehensive form with all 13 input fields matching the PDF exactly:
- **Demographics**: Gender (Male/Female), Age Group (18-34, 35-50, 51-64, 65+)
- **Medical History**: Family History (Yes/No), Currently Under Medical Care (Yes/No), Taking BP Medication (Yes/No), Time Since Diagnosis (<1 Year, 1-5 Years, >5 Years)
- **Symptoms**: Severity (Mild/Moderate/Severe), Shortness of Breath (Yes/No), Vision Changes (Yes/No), Nosebleeds (Yes/No)
- **Vitals**: Systolic Pressure range, Diastolic Pressure range
- **Lifestyle**: Heart-Healthy Diet (Yes/No)

### Blood Pressure Guidelines Sidebar
- Reference table: Normal, Elevated, Stage 1, Stage 2, Crisis ranges

### "Generate Risk Assessment" Button

### Prediction Results (shown after submission)
- **Color-coded result card** matching the PDF:
  - 🟢 Normal (Green) — Low Risk
  - 🟡 Stage 1 (Amber) — Moderate Risk
  - 🟠 Stage 2 (Orange) — High Risk
  - 🔴 Hypertensive Crisis (Red) — EMERGENCY
- Confidence percentage display
- Risk priority badge
- Clinical recommendations with actionable steps
- Patient information summary

### Prediction Logic
- Encode inputs identically to the PDF (label encoding + MinMax scaling on ordinal features)
- Use a rule-based classifier derived from the patient_data.csv patterns to classify into: Normal, Stage-1, Stage-2, or Hypertensive Crisis
- This mirrors the logistic regression behavior described in the PDF without needing a Python backend

---

## Page 2: Data Analysis Dashboard

Interactive visualizations built with Recharts, replicating the EDA from the PDF using the actual patient_data.csv:

1. **Gender Distribution** — Pie chart and bar chart showing male/female split
2. **Hypertension Stages Distribution** — Bar chart of patient counts per stage
3. **Systolic vs Diastolic Correlation** — Scatter plot showing BP relationship across stages
4. **Medication vs Severity** — Grouped bar chart
5. **Age Group vs Hypertension Stages** — Grouped bar chart
6. **Dataset Statistics** — Summary cards (total records, stage breakdown, symptom prevalence)

---

## Page 3: About / Project Info

- Project description matching the PDF
- Three scenario cards (Patient Monitoring, Preventive Screening, Emergency Triage)
- Model comparison table showing all 7 algorithms with accuracy and selection status
- Technical flow diagram

---

## Navigation
- Top navigation bar with links: Home (Prediction), Data Analysis, About
- Responsive design for desktop and mobile
- Medical-themed color palette (blues, professional healthcare aesthetic)

---

## Technical Approach
- Patient data CSV embedded as a TypeScript data module
- All prediction logic runs client-side in TypeScript
- Recharts for all data visualizations
- Fully responsive with Tailwind CSS
- No backend required

