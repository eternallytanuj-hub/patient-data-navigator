-- Create BP readings table for progress tracking
CREATE TABLE public.bp_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  stage TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat history table
CREATE TABLE public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bp_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Public policies (since we're using session-based tracking without auth)
CREATE POLICY "Allow all access to bp_readings" ON public.bp_readings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to chat_history" ON public.chat_history FOR ALL USING (true) WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_bp_readings_session ON public.bp_readings(session_id);
CREATE INDEX idx_bp_readings_created ON public.bp_readings(created_at DESC);
CREATE INDEX idx_chat_history_session ON public.chat_history(session_id);