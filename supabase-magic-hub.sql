-- ============================================
-- MAGIC HUB - Persistence metier
-- ============================================

ALTER TABLE public.project_specs
ADD COLUMN IF NOT EXISTS drinks_plan JSONB DEFAULT '{}'::jsonb;
