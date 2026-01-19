// ============================================
// TYPES SUPABASE - PRESTABRIDGE
// ============================================
// Généré depuis le schéma SQL de PrestaBridge
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// ENUMS
// ============================================

export type UserRole = 'client' | 'provider' | 'admin'
export type ProviderType = 
  | 'lieu' 
  | 'securite' 
  | 'artiste' 
  | 'staff' 
  | 'esthetique' 
  | 'logistique' 
  | 'media'

export type ServiceCategory = 
  | 'salle' | 'plein_air' | 'hangar'
  | 'ssiap' | 'gardiennage' | 'maitre_chien'
  | 'musicien' | 'animateur' | 'humoriste' | 'dj'
  | 'technicien_son' | 'technicien_lumiere' | 'traiteur' | 'serveur' | 'hotesse' | 'nettoyage'
  | 'decorateur' | 'costumier' | 'coiffure' | 'maquillage'
  | 'location_materiel' | 'transport' | 'tente'
  | 'photographe' | 'videaste' | 'influenceur' | 'publicite'

export type BookingStatus = 'pending' | 'validated' | 'paid' | 'completed' | 'cancelled'

export type EventType = 
  | 'mariage' 
  | 'festival' 
  | 'inauguration' 
  | 'anniversaire' 
  | 'concert_prive' 
  | 'soiree' 
  | 'seminaire' 
  | 'autre'

export type EventObjective = 'commercial' | 'culturel' | 'mixte'

export type MusicVibe = 'ambiance_fond' | 'lounge' | 'spectacle' | 'dansant' | 'aucun'

export type DietaryRestriction = 'halal' | 'casher' | 'vegan' | 'vegetarien' | 'aucune'

export type VerificationStatus = 'pending' | 'verified' | 'rejected'

// ============================================
// TABLES
// ============================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          provider_type: ProviderType | null
          first_name: string | null
          last_name: string | null
          bio: string | null
          avatar_url: string | null
          phone: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string
          latitude: number | null
          longitude: number | null
          verified: boolean
          verification_status: VerificationStatus
          stripe_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          provider_type?: ProviderType | null
          first_name?: string | null
          last_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          verified?: boolean
          verification_status?: VerificationStatus
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: UserRole
          provider_type?: ProviderType | null
          first_name?: string | null
          last_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          verified?: boolean
          verification_status?: VerificationStatus
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          provider_id: string
          title: string
          description: string | null
          category: ServiceCategory
          tags: string[]
          price_per_hour: number | null
          price_per_day: number | null
          price_fixed: number | null
          currency: string
          technical_specs: Json
          is_active: boolean
          min_booking_hours: number
          max_booking_hours: number | null
          images: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          title: string
          description?: string | null
          category: ServiceCategory
          tags?: string[]
          price_per_hour?: number | null
          price_per_day?: number | null
          price_fixed?: number | null
          currency?: string
          technical_specs?: Json
          is_active?: boolean
          min_booking_hours?: number
          max_booking_hours?: number | null
          images?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          title?: string
          description?: string | null
          category?: ServiceCategory
          tags?: string[]
          price_per_hour?: number | null
          price_per_day?: number | null
          price_fixed?: number | null
          currency?: string
          technical_specs?: Json
          is_active?: boolean
          min_booking_hours?: number
          max_booking_hours?: number | null
          images?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      project_specs: {
        Row: {
          id: string
          user_id: string
          budget_global: number
          event_date: string
          event_time_start: string | null
          event_time_end: string | null
          event_type: EventType
          event_objective: EventObjective
          has_venue: boolean
          has_catering: boolean
          has_technical: boolean
          is_public: boolean
          music_vibe: MusicVibe | null
          dietary_restrictions: DietaryRestriction[]
          venue_floor_without_elevator: boolean
          venue_outdoor: boolean
          venue_residential_area: boolean
          inspiration_images: string[]
          ai_extracted_tags: string[]
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          budget_global: number
          event_date: string
          event_time_start?: string | null
          event_time_end?: string | null
          event_type: EventType
          event_objective: EventObjective
          has_venue?: boolean
          has_catering?: boolean
          has_technical?: boolean
          is_public?: boolean
          music_vibe?: MusicVibe | null
          dietary_restrictions?: DietaryRestriction[]
          venue_floor_without_elevator?: boolean
          venue_outdoor?: boolean
          venue_residential_area?: boolean
          inspiration_images?: string[]
          ai_extracted_tags?: string[]
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          budget_global?: number
          event_date?: string
          event_time_start?: string | null
          event_time_end?: string | null
          event_type?: EventType
          event_objective?: EventObjective
          has_venue?: boolean
          has_catering?: boolean
          has_technical?: boolean
          is_public?: boolean
          music_vibe?: MusicVibe | null
          dietary_restrictions?: DietaryRestriction[]
          venue_floor_without_elevator?: boolean
          venue_outdoor?: boolean
          venue_residential_area?: boolean
          inspiration_images?: string[]
          ai_extracted_tags?: string[]
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          client_id: string
          provider_id: string
          service_id: string
          project_spec_id: string | null
          booking_date: string
          booking_time_start: string
          booking_time_end: string
          duration_hours: number
          base_price: number
          additional_fees: number
          total_amount: number
          escrow_amount: number
          currency: string
          status: BookingStatus
          stripe_payment_intent_id: string | null
          stripe_connect_account_id: string | null
          client_message: string | null
          provider_message: string | null
          created_at: string
          updated_at: string
          paid_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          provider_id: string
          service_id: string
          project_spec_id?: string | null
          booking_date: string
          booking_time_start: string
          booking_time_end: string
          duration_hours: number
          base_price: number
          additional_fees?: number
          total_amount: number
          escrow_amount: number
          currency?: string
          status?: BookingStatus
          stripe_payment_intent_id?: string | null
          stripe_connect_account_id?: string | null
          client_message?: string | null
          provider_message?: string | null
          created_at?: string
          updated_at?: string
          paid_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          provider_id?: string
          service_id?: string
          project_spec_id?: string | null
          booking_date?: string
          booking_time_start?: string
          booking_time_end?: string
          duration_hours?: number
          base_price?: number
          additional_fees?: number
          total_amount?: number
          escrow_amount?: number
          currency?: string
          status?: BookingStatus
          stripe_payment_intent_id?: string | null
          stripe_connect_account_id?: string | null
          client_message?: string | null
          provider_message?: string | null
          created_at?: string
          updated_at?: string
          paid_at?: string | null
          completed_at?: string | null
        }
      }
      legal_documents: {
        Row: {
          id: string
          user_id: string
          document_type: string
          document_name: string
          document_url: string
          verification_status: VerificationStatus
          verified_by: string | null
          verified_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_type: string
          document_name: string
          document_url: string
          verification_status?: VerificationStatus
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_type?: string
          document_name?: string
          document_url?: string
          verification_status?: VerificationStatus
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          reviewer_id: string
          reviewed_id: string
          rating: number
          comment: string | null
          quality_tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          reviewer_id: string
          reviewed_id: string
          rating: number
          comment?: string | null
          quality_tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          reviewer_id?: string
          reviewed_id?: string
          rating?: number
          comment?: string | null
          quality_tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      compliance_logs: {
        Row: {
          id: string
          user_id: string
          clause_type: string
          clause_version: string
          accepted: boolean
          accepted_at: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          clause_type: string
          clause_version: string
          accepted?: boolean
          accepted_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          clause_type?: string
          clause_version?: string
          accepted?: boolean
          accepted_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          booking_id: string
          sender_id: string
          receiver_id: string
          content: string
          is_system_message: boolean
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          sender_id: string
          receiver_id: string
          content: string
          is_system_message?: boolean
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          is_system_message?: boolean
          created_at?: string
          read_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      provider_type: ProviderType
      service_category: ServiceCategory
      booking_status: BookingStatus
      event_type: EventType
      event_objective: EventObjective
      music_vibe: MusicVibe
      dietary_restriction: DietaryRestriction
      verification_status: VerificationStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================
// TYPE HELPERS
// ============================================

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type ProjectSpec = Database['public']['Tables']['project_specs']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
