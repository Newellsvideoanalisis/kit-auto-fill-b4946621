-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color1 TEXT NOT NULL DEFAULT '#1e3a5f',
  color2 TEXT NOT NULL DEFAULT '#000000',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  match_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Anyone can create teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update teams" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete teams" ON public.teams FOR DELETE USING (true);

CREATE POLICY "Anyone can read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Anyone can create matches" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update matches" ON public.matches FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete matches" ON public.matches FOR DELETE USING (true);

CREATE INDEX idx_matches_team_id ON public.matches(team_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();