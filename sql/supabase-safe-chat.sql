-- ============================================
-- SAFE-CHAT MVP (booking_messages + RLS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_id_created_at
  ON public.booking_messages (booking_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_booking_messages_receiver_unread
  ON public.booking_messages (receiver_id, is_read);

ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;

-- Lecture: uniquement participants du message ET du booking associé
DROP POLICY IF EXISTS "Participants can view booking messages" ON public.booking_messages;
CREATE POLICY "Participants can view booking messages"
  ON public.booking_messages
  FOR SELECT
  USING (
    (auth.uid() = sender_id OR auth.uid() = receiver_id)
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = booking_id
        AND (b.client_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

-- Insertion: l'expéditeur doit être l'utilisateur connecté,
-- et les 2 parties doivent correspondre au booking.
DROP POLICY IF EXISTS "Participants can send booking messages" ON public.booking_messages;
CREATE POLICY "Participants can send booking messages"
  ON public.booking_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = booking_id
        AND (
          (b.client_id = sender_id AND b.provider_id = receiver_id)
          OR
          (b.provider_id = sender_id AND b.client_id = receiver_id)
        )
    )
  );

-- Update lecture: seul le destinataire peut marquer "lu"
DROP POLICY IF EXISTS "Receiver can mark messages as read" ON public.booking_messages;
CREATE POLICY "Receiver can mark messages as read"
  ON public.booking_messages
  FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);
