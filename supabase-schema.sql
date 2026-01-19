-- ============================================
-- PRESTABRIDGE : SCHÉMA SQL COMPLET (SUPABASE)
-- ============================================
-- Marketplace Événementielle avec Configurateur Intelligent
-- Phase 1 : Architecture Backend
-- ============================================

-- ============================================
-- 1. EXTENSIONS & TYPES
-- ============================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Pour la recherche full-text

-- ============================================
-- 2. ENUMS (Types personnalisés)
-- ============================================

-- Rôle utilisateur
CREATE TYPE user_role AS ENUM ('client', 'provider', 'admin');

-- Type de prestataire (catégories principales)
CREATE TYPE provider_type AS ENUM (
  'lieu',           -- Salles, Plein air, Hangar
  'securite',       -- Agents SSIAP, Gardiennage, Maîtres-chiens
  'artiste',        -- Musiciens, Animateurs, Humoristes, DJs
  'staff',          -- Techniciens, Traiteurs/Serveurs, Hôtesses, Nettoyage
  'esthetique',     -- Décorateurs, Costumiers, Coiffure/Maquillage
  'logistique',     -- Location matériel, Transport, Tentes
  'media'           -- Photographe, Vidéaste, Influenceurs, Publicité
);

-- Catégorie de service (détaillée)
CREATE TYPE service_category AS ENUM (
  -- Lieux
  'salle', 'plein_air', 'hangar',
  -- Sécurité
  'ssiap', 'gardiennage', 'maitre_chien',
  -- Artistes
  'musicien', 'animateur', 'humoriste', 'dj',
  -- Staff
  'technicien_son', 'technicien_lumiere', 'traiteur', 'serveur', 'hotesse', 'nettoyage',
  -- Esthétique
  'decorateur', 'costumier', 'coiffure', 'maquillage',
  -- Logistique
  'location_materiel', 'transport', 'tente',
  -- Média
  'photographe', 'videaste', 'influenceur', 'publicite'
);

-- Statut de réservation
CREATE TYPE booking_status AS ENUM ('pending', 'validated', 'paid', 'completed', 'cancelled');

-- Type d'événement
CREATE TYPE event_type AS ENUM (
  'mariage', 'festival', 'inauguration', 'anniversaire', 
  'concert_prive', 'soiree', 'seminaire', 'autre'
);

-- Objectif de l'événement
CREATE TYPE event_objective AS ENUM ('commercial', 'culturel', 'mixte');

-- Vibe musicale
CREATE TYPE music_vibe AS ENUM ('ambiance_fond', 'lounge', 'spectacle', 'dansant', 'aucun');

-- Restrictions d'accès alimentaire
CREATE TYPE dietary_restriction AS ENUM ('halal', 'casher', 'vegan', 'vegetarien', 'aucune');

-- Statut de vérification
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- ============================================
-- 3. TABLE : PROFILES
-- ============================================
-- Extension de auth.users avec infos détaillées

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  provider_type provider_type,
  
  -- Informations personnelles
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  
  -- Adresse (pour géolocalisation)
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Vérification & Statut
  verified BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'pending',
  stripe_account_id TEXT, -- Pour Stripe Connect
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT provider_type_required CHECK (
    (role = 'provider' AND provider_type IS NOT NULL) OR 
    (role != 'provider' AND provider_type IS NULL)
  )
);

-- Index pour recherche géographique
CREATE INDEX idx_profiles_location ON profiles USING GIST (
  point(longitude, latitude)
) WHERE longitude IS NOT NULL AND latitude IS NOT NULL;

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_provider_type ON profiles(provider_type) WHERE provider_type IS NOT NULL;
CREATE INDEX idx_profiles_verified ON profiles(verified) WHERE verified = TRUE;

-- ============================================
-- 4. TABLE : SERVICES
-- ============================================
-- Ce que les prestataires vendent

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Informations de base
  title TEXT NOT NULL,
  description TEXT,
  category service_category NOT NULL,
  tags TEXT[] DEFAULT '{}', -- Tags pour recherche (ex: ["guinguette", "bohème", "vintage"])
  
  -- Prix
  price_per_hour DECIMAL(10, 2),
  price_per_day DECIMAL(10, 2),
  price_fixed DECIMAL(10, 2), -- Prix fixe pour l'événement
  currency TEXT DEFAULT 'EUR',
  
  -- Spécifications techniques (JSONB pour flexibilité)
  technical_specs JSONB DEFAULT '{}',
  -- Exemple structure: {
  --   "power_needed": 5000,
  --   "noise_level": 85,
  --   "space_required": "10x10m",
  --   "equipment_included": ["sound_system", "lights"],
  --   "sacem_required": true
  -- }
  
  -- Disponibilité
  is_active BOOLEAN DEFAULT TRUE,
  min_booking_hours INTEGER DEFAULT 1,
  max_booking_hours INTEGER,
  
  -- Images
  images TEXT[] DEFAULT '{}',
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_tags ON services USING GIN(tags);
CREATE INDEX idx_services_active ON services(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_services_technical_specs ON services USING GIN(technical_specs);

-- ============================================
-- 5. TABLE : PROJECT_SPECS
-- ============================================
-- Le Configurateur Intelligent (Wizard)

CREATE TABLE project_specs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Étape A : Le Cadre (Hard Constraints)
  budget_global DECIMAL(10, 2) NOT NULL,
  event_date DATE NOT NULL,
  event_time_start TIME,
  event_time_end TIME,
  event_type event_type NOT NULL,
  event_objective event_objective NOT NULL,
  
  -- Étape B : L'Inventaire (Logique d'Exclusion)
  has_venue BOOLEAN DEFAULT FALSE,
  has_catering BOOLEAN DEFAULT FALSE,
  has_technical BOOLEAN DEFAULT FALSE,
  
  -- Étape C : Les Restrictions Critiques
  is_public BOOLEAN DEFAULT FALSE, -- Grand Public -> Sécurité obligatoire
  music_vibe music_vibe,
  dietary_restrictions dietary_restriction[] DEFAULT '{}',
  
  -- Logistique Lieu
  venue_floor_without_elevator BOOLEAN DEFAULT FALSE,
  venue_outdoor BOOLEAN DEFAULT FALSE,
  venue_residential_area BOOLEAN DEFAULT FALSE,
  
  -- Inspiration (pour Mood-to-Specs IA)
  inspiration_images TEXT[] DEFAULT '{}',
  ai_extracted_tags TEXT[] DEFAULT '{}', -- Tags extraits par GPT-4 Vision
  
  -- Statut
  is_completed BOOLEAN DEFAULT FALSE,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_specs_user ON project_specs(user_id);
CREATE INDEX idx_project_specs_date ON project_specs(event_date);
CREATE INDEX idx_project_specs_completed ON project_specs(is_completed) WHERE is_completed = FALSE;

-- ============================================
-- 6. TABLE : BOOKINGS
-- ============================================
-- Les réservations avec statut et séquestre

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  project_spec_id UUID REFERENCES project_specs(id) ON DELETE SET NULL,
  
  -- Détails de la réservation
  booking_date DATE NOT NULL,
  booking_time_start TIME NOT NULL,
  booking_time_end TIME NOT NULL,
  duration_hours DECIMAL(5, 2) NOT NULL,
  
  -- Prix & Paiement
  base_price DECIMAL(10, 2) NOT NULL,
  additional_fees DECIMAL(10, 2) DEFAULT 0, -- Surcoûts (manutention, etc.)
  total_amount DECIMAL(10, 2) NOT NULL,
  escrow_amount DECIMAL(10, 2) NOT NULL, -- Montant mis en séquestre
  currency TEXT DEFAULT 'EUR',
  
  -- Statut
  status booking_status DEFAULT 'pending',
  
  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_connect_account_id TEXT, -- Compte du prestataire
  
  -- Messages & Communication
  client_message TEXT,
  provider_message TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_provider ON bookings(provider_id);
CREATE INDEX idx_bookings_service ON bookings(service_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);

-- ============================================
-- 7. TABLE : LEGAL_DOCUMENTS
-- ============================================
-- Preuves KYC (Know Your Customer)

CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Type de document
  document_type TEXT NOT NULL, -- 'identity', 'siret', 'insurance', 'sacem', etc.
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL, -- URL du fichier dans Supabase Storage
  
  -- Vérification
  verification_status verification_status DEFAULT 'pending',
  verified_by UUID REFERENCES profiles(id), -- Admin qui a vérifié
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_legal_documents_user ON legal_documents(user_id);
CREATE INDEX idx_legal_documents_status ON legal_documents(verification_status);

-- ============================================
-- 8. TABLE : REVIEWS
-- ============================================
-- Avis bilatéraux (Client note Prestataire ET Prestataire note Client)

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Qui note qui
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Note & Commentaire
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Tags de qualité (optionnel)
  quality_tags TEXT[] DEFAULT '{}', -- ["punctual", "professional", "friendly"]
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte : Un utilisateur ne peut noter qu'une fois par booking
  UNIQUE(booking_id, reviewer_id)
);

CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewed ON reviews(reviewed_id);

-- ============================================
-- 9. TABLE : COMPLIANCE_LOGS
-- ============================================
-- Acceptation des clauses (Politique, SACEM, Éthique)

CREATE TABLE compliance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Type de clause
  clause_type TEXT NOT NULL, -- 'privacy_policy', 'terms_of_service', 'sacem', 'ethical', etc.
  clause_version TEXT NOT NULL, -- Version du document
  
  -- Acceptation
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_logs_user ON compliance_logs(user_id);
CREATE INDEX idx_compliance_logs_type ON compliance_logs(clause_type);

-- ============================================
-- 10. TABLE : MESSAGES (Chat)
-- ============================================
-- Communication entre Client et Prestataire
-- Masquage des contacts tant que booking n'est pas "paid"

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Qui envoie
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Contenu
  content TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT FALSE, -- Messages automatiques
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ============================================
-- 11. FUNCTIONS & TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_specs_updated_at BEFORE UPDATE ON project_specs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at BEFORE UPDATE ON legal_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profile lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profile automatiquement
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================
-- Sécurité obligatoire selon les règles

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true); -- Les profils publics sont visibles pour la recherche

-- SERVICES
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  USING (true);

CREATE POLICY "Providers can create their own services"
  ON services FOR INSERT
  WITH CHECK (
    auth.uid() = provider_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'provider')
  );

CREATE POLICY "Providers can update their own services"
  ON services FOR UPDATE
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete their own services"
  ON services FOR DELETE
  USING (auth.uid() = provider_id);

-- PROJECT_SPECS
ALTER TABLE project_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project specs"
  ON project_specs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project specs"
  ON project_specs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project specs"
  ON project_specs FOR UPDATE
  USING (auth.uid() = user_id);

-- BOOKINGS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = provider_id);

CREATE POLICY "Clients can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'client')
  );

CREATE POLICY "Clients and providers can update bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = provider_id);

-- LEGAL_DOCUMENTS
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON legal_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
  ON legal_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- REVIEWS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id
      AND (client_id = auth.uid() OR provider_id = auth.uid())
    )
  );

-- COMPLIANCE_LOGS
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own compliance logs"
  ON compliance_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own compliance logs"
  ON compliance_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- MESSAGES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their bookings"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages in their bookings"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id
      AND (client_id = auth.uid() OR provider_id = auth.uid())
    )
  );

-- ============================================
-- 13. STORAGE BUCKETS (à créer dans Supabase Dashboard)
-- ============================================
-- Ces buckets doivent être créés manuellement dans Supabase Dashboard > Storage
-- 
-- Buckets nécessaires :
-- - 'avatars' : Pour les photos de profil
-- - 'service-images' : Pour les images des services
-- - 'legal-documents' : Pour les documents KYC (privé)
-- - 'inspiration-images' : Pour les images d'inspiration du configurateur
-- 
-- Politiques RLS pour Storage :
-- - avatars : Public read, Owner write
-- - service-images : Public read, Owner write
-- - legal-documents : Owner only (read/write)
-- - inspiration-images : Owner only (read/write)

-- ============================================
-- FIN DU SCHÉMA
-- ============================================
-- Ce schéma est prêt à être collé dans l'éditeur SQL de Supabase
-- N'oubliez pas de créer les Storage Buckets manuellement dans le Dashboard
