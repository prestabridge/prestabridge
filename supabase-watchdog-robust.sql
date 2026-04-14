-- ============================================
-- WATCHDOG ROBUSTE - PROD READY
-- ============================================
-- 1) Table d'audit des actions watchdog
-- 2) Fonction transactionnelle avec FOR UPDATE SKIP LOCKED
-- ============================================

CREATE TABLE IF NOT EXISTS public.booking_watchdog_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- no_response_reassigned | no_response_exhausted | skipped_invalid_cascade
  old_vendor_id UUID,
  new_vendor_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchdog_events_booking_id
  ON public.booking_watchdog_events(booking_id);

CREATE INDEX IF NOT EXISTS idx_watchdog_events_created_at
  ON public.booking_watchdog_events(created_at DESC);

-- ============================================
-- Audit Trail des tentatives prestataires
-- ============================================

CREATE TABLE IF NOT EXISTS public.booking_provider_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('notified', 'accepted', 'declined', 'expired', 'cancelled_by_winner')),
  notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  attempt_rank INTEGER NOT NULL CHECK (attempt_rank >= 1),
  channel TEXT NOT NULL DEFAULT 'whatsapp_and_email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_bpa_booking_id ON public.booking_provider_attempts(booking_id);
CREATE INDEX IF NOT EXISTS idx_bpa_provider_id ON public.booking_provider_attempts(provider_id);
CREATE INDEX IF NOT EXISTS idx_bpa_status ON public.booking_provider_attempts(status);
CREATE INDEX IF NOT EXISTS idx_bpa_notified_at ON public.booking_provider_attempts(notified_at DESC);

-- ============================================
-- RLS HARDENING
-- ============================================

ALTER TABLE public.booking_provider_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_watchdog_events ENABLE ROW LEVEL SECURITY;

-- Prestataire: ne voit que ses tentatives
DROP POLICY IF EXISTS "Providers can view their own attempts" ON public.booking_provider_attempts;
CREATE POLICY "Providers can view their own attempts"
  ON public.booking_provider_attempts
  FOR SELECT
  USING (auth.uid() = provider_id);

-- Admin: lecture globale attempts
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.booking_provider_attempts;
CREATE POLICY "Admins can view all attempts"
  ON public.booking_provider_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Logs techniques watchdog: uniquement admin
DROP POLICY IF EXISTS "Admins can view watchdog events" ON public.booking_watchdog_events;
CREATE POLICY "Admins can view watchdog events"
  ON public.booking_watchdog_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================
-- Fonction RPC: process_watchdog_batch
-- - Verrouille les bookings eligibles (SKIP LOCKED)
-- - Bascule vers backup suivant
-- - Ecrit les events d'audit
-- - Met a jour last_notified_at pour anti-spam
-- ============================================

CREATE OR REPLACE FUNCTION public.process_watchdog_batch(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  booking_id UUID,
  action_type TEXT,
  old_vendor_id UUID,
  new_vendor_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  cascade_ids UUID[];
  old_provider UUID;
  next_service UUID;
  next_provider UUID;
  next_pos INTEGER;
  nrp UUID[];
BEGIN
  FOR r IN
    SELECT b.*
    FROM public.bookings b
    WHERE b.status = 'pending_vendor_validation'
      AND COALESCE(b.last_notified_at, '1970-01-01'::timestamptz) < NOW() - INTERVAL '4 hours'
    ORDER BY b.last_notified_at NULLS FIRST, b.updated_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  LOOP
    old_provider := r.provider_id;
    cascade_ids := COALESCE(r.cascade_service_ids, ARRAY[]::UUID[]);
    nrp := COALESCE(r.non_responding_provider_ids, ARRAY[]::UUID[]);
    next_pos := COALESCE(r.cascade_position, 0) + 1;

    -- Toujours marquer le prestataire courant comme non repondant
    IF old_provider IS NOT NULL AND NOT (old_provider = ANY(nrp)) THEN
      nrp := array_append(nrp, old_provider);
    END IF;

    -- Cas invalide: pas de cascade
    IF array_length(cascade_ids, 1) IS NULL THEN
      IF old_provider IS NOT NULL THEN
        INSERT INTO public.booking_provider_attempts(
          booking_id, provider_id, status, notified_at, responded_at, attempt_rank, channel
        )
        VALUES (
          r.id, old_provider, 'expired',
          COALESCE(r.last_notified_at, NOW()), NOW(), GREATEST(COALESCE(r.cascade_position, 0) + 1, 1), 'whatsapp_and_email'
        )
        ON CONFLICT (booking_id, provider_id)
        DO UPDATE SET
          status = 'expired',
          responded_at = NOW(),
          updated_at = NOW();
      END IF;

      UPDATE public.bookings
      SET non_responding_provider_ids = nrp,
          last_notified_at = NOW(),
          updated_at = NOW()
      WHERE id = r.id;

      INSERT INTO public.booking_watchdog_events(booking_id, action_type, old_vendor_id, new_vendor_id)
      VALUES (r.id, 'skipped_invalid_cascade', old_provider, NULL);

      booking_id := r.id;
      action_type := 'skipped_invalid_cascade';
      old_vendor_id := old_provider;
      new_vendor_id := NULL;
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Cas epuise: plus de backup
    IF next_pos > array_upper(cascade_ids, 1) THEN
      IF old_provider IS NOT NULL THEN
        INSERT INTO public.booking_provider_attempts(
          booking_id, provider_id, status, notified_at, responded_at, attempt_rank, channel
        )
        VALUES (
          r.id, old_provider, 'expired',
          COALESCE(r.last_notified_at, NOW()), NOW(), GREATEST(COALESCE(r.cascade_position, 0) + 1, 1), 'whatsapp_and_email'
        )
        ON CONFLICT (booking_id, provider_id)
        DO UPDATE SET
          status = 'expired',
          responded_at = NOW(),
          updated_at = NOW();
      END IF;

      UPDATE public.bookings
      SET non_responding_provider_ids = nrp,
          last_notified_at = NOW(),
          updated_at = NOW()
      WHERE id = r.id;

      INSERT INTO public.booking_watchdog_events(booking_id, action_type, old_vendor_id, new_vendor_id)
      VALUES (r.id, 'no_response_exhausted', old_provider, NULL);

      booking_id := r.id;
      action_type := 'no_response_exhausted';
      old_vendor_id := old_provider;
      new_vendor_id := NULL;
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Backup suivant
    next_service := cascade_ids[next_pos];
    SELECT s.provider_id INTO next_provider
    FROM public.services s
    WHERE s.id = next_service
    LIMIT 1;

    -- Backup invalide => traiter comme epuise pour ne pas boucler
    IF next_provider IS NULL THEN
      IF old_provider IS NOT NULL THEN
        INSERT INTO public.booking_provider_attempts(
          booking_id, provider_id, status, notified_at, responded_at, attempt_rank, channel
        )
        VALUES (
          r.id, old_provider, 'expired',
          COALESCE(r.last_notified_at, NOW()), NOW(), GREATEST(COALESCE(r.cascade_position, 0) + 1, 1), 'whatsapp_and_email'
        )
        ON CONFLICT (booking_id, provider_id)
        DO UPDATE SET
          status = 'expired',
          responded_at = NOW(),
          updated_at = NOW();
      END IF;

      UPDATE public.bookings
      SET non_responding_provider_ids = nrp,
          last_notified_at = NOW(),
          updated_at = NOW()
      WHERE id = r.id;

      INSERT INTO public.booking_watchdog_events(booking_id, action_type, old_vendor_id, new_vendor_id)
      VALUES (r.id, 'no_response_exhausted', old_provider, NULL);

      booking_id := r.id;
      action_type := 'no_response_exhausted';
      old_vendor_id := old_provider;
      new_vendor_id := NULL;
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Reaffectation en cascade
    IF old_provider IS NOT NULL THEN
      INSERT INTO public.booking_provider_attempts(
        booking_id, provider_id, status, notified_at, responded_at, attempt_rank, channel
      )
      VALUES (
        r.id, old_provider, 'expired',
        COALESCE(r.last_notified_at, NOW()), NOW(), GREATEST(COALESCE(r.cascade_position, 0) + 1, 1), 'whatsapp_and_email'
      )
      ON CONFLICT (booking_id, provider_id)
      DO UPDATE SET
        status = 'expired',
        responded_at = NOW(),
        updated_at = NOW();
    END IF;

    UPDATE public.bookings
    SET provider_id = next_provider,
        service_id = next_service,
        cascade_position = next_pos,
        non_responding_provider_ids = nrp,
        last_notified_at = NOW(),
        updated_at = NOW()
    WHERE id = r.id;

    INSERT INTO public.booking_watchdog_events(booking_id, action_type, old_vendor_id, new_vendor_id)
    VALUES (r.id, 'no_response_reassigned', old_provider, next_provider);

    booking_id := r.id;
    action_type := 'no_response_reassigned';
    old_vendor_id := old_provider;
    new_vendor_id := next_provider;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

-- Permettre l'appel depuis role service (API cron serveur)
GRANT EXECUTE ON FUNCTION public.process_watchdog_batch(INTEGER) TO service_role;

-- ============================================
-- Fonction RPC: process_watchdog_single_booking
-- - Version immediate (sans delai 4h)
-- - Utilisee quand un prestataire refuse explicitement
-- ============================================

CREATE OR REPLACE FUNCTION public.process_watchdog_single_booking(p_booking_id UUID)
RETURNS TABLE (
  booking_id UUID,
  action_type TEXT,
  old_vendor_id UUID,
  new_vendor_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  cascade_ids UUID[];
  old_provider UUID;
  next_service UUID;
  next_provider UUID;
  next_pos INTEGER;
  nrp UUID[];
BEGIN
  SELECT *
  INTO r
  FROM public.bookings b
  WHERE b.id = p_booking_id
    AND b.status = 'pending_vendor_validation'
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  old_provider := r.provider_id;
  cascade_ids := COALESCE(r.cascade_service_ids, ARRAY[]::UUID[]);
  nrp := COALESCE(r.non_responding_provider_ids, ARRAY[]::UUID[]);
  next_pos := COALESCE(r.cascade_position, 0) + 1;

  IF old_provider IS NOT NULL AND NOT (old_provider = ANY(nrp)) THEN
    nrp := array_append(nrp, old_provider);
  END IF;

  IF array_length(cascade_ids, 1) IS NULL OR next_pos > array_upper(cascade_ids, 1) THEN
    IF old_provider IS NOT NULL THEN
      INSERT INTO public.booking_provider_attempts(
        booking_id, provider_id, status, notified_at, responded_at, attempt_rank, channel
      )
      VALUES (
        r.id, old_provider, 'expired',
        COALESCE(r.last_notified_at, NOW()), NOW(), GREATEST(COALESCE(r.cascade_position, 0) + 1, 1), 'whatsapp_and_email'
      )
      ON CONFLICT (booking_id, provider_id)
      DO UPDATE SET
        status = 'expired',
        responded_at = NOW(),
        updated_at = NOW();
    END IF;

    UPDATE public.bookings
    SET non_responding_provider_ids = nrp,
        last_notified_at = NOW(),
        updated_at = NOW()
    WHERE id = r.id;

    INSERT INTO public.booking_watchdog_events(booking_id, action_type, old_vendor_id, new_vendor_id)
    VALUES (r.id, 'no_response_exhausted', old_provider, NULL);

    booking_id := r.id;
    action_type := 'no_response_exhausted';
    old_vendor_id := old_provider;
    new_vendor_id := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  next_service := cascade_ids[next_pos];
  SELECT s.provider_id INTO next_provider
  FROM public.services s
  WHERE s.id = next_service
  LIMIT 1;

  IF next_provider IS NULL THEN
    IF old_provider IS NOT NULL THEN
      INSERT INTO public.booking_provider_attempts(
        booking_id, provider_id, status, notified_at, responded_at, attempt_rank, channel
      )
      VALUES (
        r.id, old_provider, 'expired',
        COALESCE(r.last_notified_at, NOW()), NOW(), GREATEST(COALESCE(r.cascade_position, 0) + 1, 1), 'whatsapp_and_email'
      )
      ON CONFLICT (booking_id, provider_id)
      DO UPDATE SET
        status = 'expired',
        responded_at = NOW(),
        updated_at = NOW();
    END IF;

    UPDATE public.bookings
    SET non_responding_provider_ids = nrp,
        last_notified_at = NOW(),
        updated_at = NOW()
    WHERE id = r.id;

    INSERT INTO public.booking_watchdog_events(booking_id, action_type, old_vendor_id, new_vendor_id)
    VALUES (r.id, 'no_response_exhausted', old_provider, NULL);

    booking_id := r.id;
    action_type := 'no_response_exhausted';
    old_vendor_id := old_provider;
    new_vendor_id := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE public.bookings
  SET provider_id = next_provider,
      service_id = next_service,
      cascade_position = next_pos,
      non_responding_provider_ids = nrp,
      last_notified_at = NOW(),
      updated_at = NOW()
  WHERE id = r.id;

  INSERT INTO public.booking_watchdog_events(booking_id, action_type, old_vendor_id, new_vendor_id)
  VALUES (r.id, 'no_response_reassigned', old_provider, next_provider);

  booking_id := r.id;
  action_type := 'no_response_reassigned';
  old_vendor_id := old_provider;
  new_vendor_id := next_provider;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_watchdog_single_booking(UUID) TO service_role;

-- ============================================
-- OBSERVABILITE WATCHDOG (vue)
-- ============================================

CREATE OR REPLACE VIEW public.v_watchdog_observability AS
SELECT
  date_trunc('day', e.created_at) AS day,
  COUNT(*) AS total_events,
  COUNT(*) FILTER (WHERE e.action_type = 'no_response_reassigned') AS reassigned_count,
  COUNT(*) FILTER (WHERE e.action_type = 'no_response_exhausted') AS exhausted_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE e.action_type = 'no_response_reassigned') / NULLIF(COUNT(*), 0),
    2
  ) AS reassigned_rate_percent
FROM public.booking_watchdog_events e
GROUP BY 1
ORDER BY 1 DESC;

-- ============================================
-- ANALYTICS ADMIN: taux de reponse moyen par prestataire
-- ============================================

CREATE OR REPLACE VIEW public.v_provider_response_metrics AS
SELECT
  a.provider_id,
  p.first_name,
  p.last_name,
  COUNT(*) AS total_attempts,
  COUNT(*) FILTER (WHERE a.status IN ('accepted', 'declined')) AS responded_attempts,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE a.status IN ('accepted', 'declined')) / NULLIF(COUNT(*), 0),
    2
  ) AS response_rate_percent,
  ROUND(
    AVG(
      EXTRACT(EPOCH FROM (a.responded_at - a.notified_at))
    ) FILTER (WHERE a.responded_at IS NOT NULL AND a.status IN ('accepted', 'declined'))
    / 60.0,
    2
  ) AS avg_response_time_minutes
FROM public.booking_provider_attempts a
LEFT JOIN public.profiles p ON p.id = a.provider_id
GROUP BY a.provider_id, p.first_name, p.last_name
ORDER BY response_rate_percent DESC NULLS LAST, avg_response_time_minutes ASC NULLS LAST;
