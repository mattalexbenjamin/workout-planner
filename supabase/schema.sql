-- APEX SUMMER '26 SUPABASE DATABASE SCHEMA
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Profiles Table (Stores user target goals, API keys, and settings)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  start_weight NUMERIC DEFAULT 195,
  target_weight NUMERIC DEFAULT 180,
  current_weight NUMERIC DEFAULT 193,
  calories INTEGER DEFAULT 2200,
  protein INTEGER DEFAULT 180,
  frequency INTEGER DEFAULT 3,
  gemini_api_key TEXT DEFAULT '',
  openai_api_key TEXT DEFAULT '',
  ai_provider TEXT DEFAULT 'gemini',
  selected_calendar_id TEXT DEFAULT 'primary',
  auto_sync_gcal BOOLEAN DEFAULT true,
  gcal_refresh_token TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger to create profile automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Workout Logs Table
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  workout_name TEXT NOT NULL,
  category TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  volume_load NUMERIC DEFAULT 0,
  exercises JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  soreness_snapshot JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Workout Logs
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout logs" 
  ON public.workout_logs FOR ALL 
  USING (auth.uid() = user_id);


-- 3. Soreness & Fatigue Logs Table
CREATE TABLE IF NOT EXISTS public.soreness_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  overall_fatigue INTEGER DEFAULT 0,
  legs INTEGER DEFAULT 0,
  shoulders INTEGER DEFAULT 0,
  core INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS for Soreness Logs
ALTER TABLE public.soreness_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own soreness logs" 
  ON public.soreness_logs FOR ALL 
  USING (auth.uid() = user_id);


-- 4. Trophies & Achievements Table
CREATE TABLE IF NOT EXISTS public.trophies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  trophy_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trophy_id)
);

-- Enable RLS for Trophies
ALTER TABLE public.trophies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own trophies" 
  ON public.trophies FOR ALL 
  USING (auth.uid() = user_id);


-- 5. User Custom Habits Table
CREATE TABLE IF NOT EXISTS public.user_habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  habit_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, habit_id)
);

-- Enable RLS for User Habits
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custom habits" 
  ON public.user_habits FOR ALL 
  USING (auth.uid() = user_id);


-- 6. Habit Checkmark Logs Table
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  habit_id TEXT NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, habit_id, date)
);

-- Enable RLS for Habit Logs
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own habit logs" 
  ON public.habit_logs FOR ALL 
  USING (auth.uid() = user_id);

