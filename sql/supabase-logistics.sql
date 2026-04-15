-- ============================================
-- LOGISTIQUE & EXPORT - PHASE 2
-- ============================================

ALTER TABLE public.project_specs
ADD COLUMN IF NOT EXISTS run_of_show JSONB DEFAULT '[]'::jsonb;
