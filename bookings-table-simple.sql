-- ============================================
-- TABLE BOOKINGS - VERSION SIMPLIFIÉE
-- ============================================
-- Si la table bookings n'existe pas encore, exécutez ce SQL
-- ============================================

-- Créer l'enum pour le statut si il n'existe pas
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'accepted', 'rejected', 'paid', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Créer la table bookings (version simplifiée)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations essentielles
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Informations de base
  date DATE NOT NULL,
  status booking_status DEFAULT 'pending',
  message TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);

-- RLS (Row Level Security)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres réservations
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = provider_id);

-- Politique : Les clients peuvent créer des réservations
CREATE POLICY "Clients can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Politique : Les clients et prestataires peuvent mettre à jour leurs réservations
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = provider_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();
