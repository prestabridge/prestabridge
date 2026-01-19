// ============================================
// TYPES SUPABASE - À GÉNÉRER AUTOMATIQUEMENT
// ============================================
// 
// Pour générer les types depuis votre base Supabase :
// 
// Option 1 (Recommandé - avec projet Supabase) :
//   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
//
// Option 2 (avec Supabase local) :
//   npx supabase gen types typescript --local > lib/supabase/database.types.ts
//
// Option 3 (Manuel - depuis le Dashboard Supabase) :
//   1. Allez dans Settings > API
//   2. Copiez le "TypeScript types" généré
//   3. Collez-le dans ce fichier
//
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Les types seront générés automatiquement après avoir exécuté le schéma SQL
      // dans Supabase et lancé la commande de génération
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
