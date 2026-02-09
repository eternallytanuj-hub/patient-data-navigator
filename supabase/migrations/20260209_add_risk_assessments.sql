-- Create risk assessments table for storing hypertension risk data
CREATE TABLE public.risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_name TEXT,
  age_group TEXT NOT NULL,
  stage TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  on_medication BOOLEAN,
  family_history BOOLEAN,
  diet_preference TEXT,
  diet_recommendations TEXT,
  lifestyle_recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

-- Public policy (session-based tracking without auth)
CREATE POLICY "Allow all access to risk_assessments" ON public.risk_assessments FOR ALL USING (true) WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_risk_assessments_session ON public.risk_assessments(session_id);
CREATE INDEX idx_risk_assessments_created ON public.risk_assessments(created_at DESC);
CREATE INDEX idx_risk_assessments_stage ON public.risk_assessments(stage);
