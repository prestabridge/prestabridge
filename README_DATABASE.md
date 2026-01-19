# 🗄️ GUIDE RAPIDE : BASE DE DONNÉES PRESTABRIDGE

## 🚀 Démarrage Rapide

### 1. Exécuter le schéma SQL

1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor** > **New query**
4. Ouvrir le fichier `supabase-schema.sql`
5. **Copier TOUT le contenu** et coller dans l'éditeur
6. Cliquer sur **Run** (ou `Ctrl+Enter`)

✅ **Résultat attendu** : Toutes les tables, enums, fonctions et RLS sont créés.

---

### 2. Créer les Storage Buckets

Dans **Supabase Dashboard** > **Storage** :

| Bucket | Public | Usage |
|--------|--------|-------|
| `avatars` | ✅ Oui | Photos de profil |
| `service-images` | ✅ Oui | Images des services |
| `legal-documents` | ❌ Non | Documents KYC (privé) |
| `inspiration-images` | ❌ Non | Images d'inspiration (privé) |

---

### 3. Générer les types TypeScript

**Option A (Recommandé)** - Avec Project ID :
```bash
# Remplacer YOUR_PROJECT_ID par votre Project ID (Settings > General)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

**Option B** - Depuis le Dashboard :
1. Settings > API
2. Copier "TypeScript types"
3. Coller dans `lib/supabase/database.types.ts`

---

## 📁 Structure des Fichiers

```
lib/supabase/
├── client.ts          # Client pour navigateur (Client Components)
├── server.ts          # Client pour serveur (Server Components)
└── database.types.ts  # Types TypeScript (à générer)
```

---

## 💻 Utilisation dans le Code

### Client Component
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const supabase = createClient()
  const { data } = await supabase.from('profiles').select('*')
  // ...
}
```

### Server Component
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function MyPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*')
  // ...
}
```

---

## 🔍 Tables Principales

- **`profiles`** : Utilisateurs (clients & prestataires)
- **`services`** : Services proposés par les prestataires
- **`project_specs`** : Configurations d'événements (Configurateur)
- **`bookings`** : Réservations avec statuts
- **`legal_documents`** : Documents KYC
- **`reviews`** : Avis bilatéraux
- **`compliance_logs`** : Acceptation des clauses
- **`messages`** : Chat entre client/prestataire

---

## ⚠️ Important

- ✅ **RLS est activé** sur toutes les tables
- ✅ **Types TypeScript** à régénérer après chaque modification du schéma
- ✅ **Storage Buckets** à créer manuellement
- ✅ Vérifier `.env.local` contient les clés Supabase

---

Pour plus de détails, voir `PLAN_BATAILLE_DATABASE.md`
