# 🏗️ PLAN DE BATAILLE : BASE DE DONNÉES PRESTABRIDGE

## 📋 Vue d'ensemble

Ce document décrit la stratégie complète pour mettre en place la base de données Supabase pour PrestaBridge, une marketplace événementielle avec configurateur intelligent.

---

## 🎯 OBJECTIFS

1. ✅ Créer un schéma SQL complet et sécurisé
2. ✅ Implémenter Row Level Security (RLS) sur toutes les tables
3. ✅ Générer les types TypeScript pour une intégration type-safe
4. ✅ Préparer l'infrastructure pour les phases suivantes

---

## 📦 FICHIERS CRÉÉS

### 1. `supabase-schema.sql`
**Fichier principal à exécuter dans Supabase**

Contient :
- ✅ Tous les ENUMs (user_role, provider_type, booking_status, etc.)
- ✅ Toutes les tables (profiles, services, bookings, project_specs, etc.)
- ✅ Tous les index pour optimiser les performances
- ✅ Toutes les fonctions et triggers (updated_at automatique)
- ✅ Toutes les politiques RLS (Row Level Security)

### 2. `lib/supabase/client.ts`
Client Supabase pour le navigateur (Client Components)

### 3. `lib/supabase/server.ts`
Client Supabase pour le serveur (Server Components, Server Actions)

### 4. `lib/supabase/database.types.ts`
Types TypeScript générés depuis Supabase (à générer après l'exécution du schéma)

---

## 🚀 ÉTAPES D'IMPLÉMENTATION

### ÉTAPE 1 : Exécuter le schéma SQL dans Supabase

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet PrestaBridge

2. **Ouvrir l'éditeur SQL**
   - Menu de gauche : `SQL Editor`
   - Cliquer sur `New query`

3. **Coller le schéma complet**
   - Ouvrir le fichier `supabase-schema.sql`
   - Copier TOUT le contenu
   - Coller dans l'éditeur SQL de Supabase
   - Cliquer sur `Run` (ou `Ctrl+Enter`)

4. **Vérifier l'exécution**
   - Vérifier qu'il n'y a pas d'erreurs
   - Toutes les tables doivent être créées

### ÉTAPE 2 : Créer les Storage Buckets

Dans Supabase Dashboard > Storage :

1. **Bucket `avatars`**
   - Créer un nouveau bucket nommé `avatars`
   - Public : ✅ OUI (pour afficher les avatars)
   - Politique RLS :
     - Read : Public
     - Write : Authenticated users only (leur propre avatar)

2. **Bucket `service-images`**
   - Créer un nouveau bucket nommé `service-images`
   - Public : ✅ OUI
   - Politique RLS :
     - Read : Public
     - Write : Authenticated providers only

3. **Bucket `legal-documents`**
   - Créer un nouveau bucket nommé `legal-documents`
   - Public : ❌ NON (privé)
   - Politique RLS :
     - Read/Write : Owner only

4. **Bucket `inspiration-images`**
   - Créer un nouveau bucket nommé `inspiration-images`
   - Public : ❌ NON (privé)
   - Politique RLS :
     - Read/Write : Owner only

### ÉTAPE 3 : Générer les types TypeScript

**Option A : Avec Project ID (Recommandé)**

1. Récupérer votre Project ID :
   - Dashboard Supabase > Settings > General > Reference ID

2. Exécuter la commande :
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

**Option B : Depuis le Dashboard**

1. Aller dans Settings > API
2. Scroller jusqu'à "TypeScript types"
3. Copier le code généré
4. Coller dans `lib/supabase/database.types.ts`

### ÉTAPE 4 : Vérifier la configuration

1. Vérifier que `.env.local` contient :
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. Tester la connexion :
```typescript
// Dans un composant test
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
const { data } = await supabase.from('profiles').select('*')
```

---

## 📊 STRUCTURE DE LA BASE DE DONNÉES

### Tables Principales

#### 1. `profiles`
Extension de `auth.users` avec :
- Rôle (client/provider/admin)
- Type de prestataire (si provider)
- Informations personnelles (nom, bio, avatar)
- Géolocalisation (pour recherche par proximité)
- Statut de vérification

#### 2. `services`
Ce que les prestataires vendent :
- Catégorie (DJ, Traiteur, Lieu, etc.)
- Tags pour recherche avancée
- Prix (par heure/jour/fixe)
- Spécifications techniques (JSONB flexible)
- Images

#### 3. `project_specs`
Le Configurateur Intelligent :
- Budget global
- Date & crééneau
- Type d'événement
- Inventaire (ce que le client a déjà)
- Restrictions (public/privé, alimentaire, etc.)
- Images d'inspiration (pour IA Mood-to-Specs)

#### 4. `bookings`
Les réservations :
- Statut (pending → validated → paid → completed)
- Montant en séquestre (escrow)
- Intégration Stripe Connect
- Messages entre client/prestataire

#### 5. `legal_documents`
Preuves KYC :
- Documents d'identité
- SIRET
- Assurance
- SACEM
- Statut de vérification

#### 6. `reviews`
Avis bilatéraux :
- Client note Prestataire
- Prestataire note Client
- Rating 1-5 étoiles
- Commentaires

#### 7. `compliance_logs`
Acceptation des clauses :
- Politique de confidentialité
- Conditions d'utilisation
- Clause SACEM
- Clause éthique

#### 8. `messages`
Chat entre client/prestataire :
- Masquage automatique des contacts tant que booking non payé
- Messages système automatiques

---

## 🔒 SÉCURITÉ (RLS)

Toutes les tables ont Row Level Security activée :

### Politiques principales :

1. **Profiles** : 
   - Lecture publique (pour recherche)
   - Modification : Owner only

2. **Services** :
   - Lecture publique
   - Création/Modification : Provider only (ses propres services)

3. **Project Specs** :
   - Lecture/Écriture : Owner only (privé)

4. **Bookings** :
   - Lecture : Client ET Provider (les deux parties)
   - Création : Client only
   - Modification : Client ET Provider

5. **Legal Documents** :
   - Lecture/Écriture : Owner only (privé)

6. **Reviews** :
   - Lecture : Public
   - Création : Participants au booking only

7. **Messages** :
   - Lecture/Écriture : Participants au booking only

---

## 🎨 ENUMS CRÉÉS

- `user_role` : client, provider, admin
- `provider_type` : lieu, securite, artiste, staff, esthetique, logistique, media
- `service_category` : Toutes les catégories détaillées
- `booking_status` : pending, validated, paid, completed, cancelled
- `event_type` : mariage, festival, inauguration, etc.
- `music_vibe` : ambiance_fond, lounge, spectacle, dansant
- `dietary_restriction` : halal, casher, vegan, vegetarien
- `verification_status` : pending, verified, rejected

---

## 🔄 TRIGGERS AUTOMATIQUES

1. **`update_updated_at_column()`**
   - Met à jour automatiquement `updated_at` sur toutes les tables

2. **`handle_new_user()`**
   - Crée automatiquement un profile lors de l'inscription
   - Rôle par défaut : `client`

---

## 📈 INDEX POUR PERFORMANCE

Index créés pour optimiser :
- Recherche géographique (profiles)
- Recherche par catégorie (services)
- Recherche par tags (GIN index)
- Recherche full-text (tags, descriptions)
- Filtrage par statut (bookings, reviews)
- Tri par date (bookings, messages)

---

## 🧪 TESTS À EFFECTUER

Après l'implémentation, tester :

1. ✅ Création d'un compte (profile auto-créé)
2. ✅ Modification du profile
3. ✅ Création d'un service (provider)
4. ✅ Création d'un project_spec (client)
5. ✅ Création d'un booking
6. ✅ Vérification RLS (un utilisateur ne peut pas voir les données d'un autre)
7. ✅ Upload d'images dans Storage
8. ✅ Génération des types TypeScript

---

## 🚧 PROCHAINES ÉTAPES (Phase 2)

Une fois la base de données en place :

1. **Phase 2 : Auth & Profils**
   - Intégration Supabase Auth
   - Pages d'inscription/connexion
   - Dashboard profil (client/provider)
   - Upload avatar

2. **Phase 3 : Le Configurateur**
   - Formulaire wizard multi-étapes
   - Sauvegarde project_specs
   - Logique d'exclusion (has_venue, etc.)

3. **Phase 4 : Matching & Recherche**
   - Algorithme de matching basé sur project_specs
   - Filtres avancés (catégorie, prix, localisation)
   - Recherche par tags

4. **Phase 5 : Paiement Séquestre**
   - Intégration Stripe Connect
   - Gestion escrow
   - Workflow de paiement

5. **Phase 6 : Features IA**
   - Mood-to-Specs (GPT-4 Vision)
   - Budget Tetris
   - Smart Run-of-Show

---

## 📝 NOTES IMPORTANTES

1. **RLS est OBLIGATOIRE** : Toutes les tables doivent avoir RLS activé
2. **Storage Buckets** : À créer manuellement dans le Dashboard
3. **Types TypeScript** : À régénérer après chaque modification du schéma
4. **Migration** : Pour les modifications futures, utiliser les migrations Supabase
5. **Backup** : Toujours faire un backup avant de modifier le schéma en production

---

## ✅ CHECKLIST FINALE

- [ ] Schéma SQL exécuté dans Supabase
- [ ] Toutes les tables créées
- [ ] Tous les RLS activés et testés
- [ ] Storage Buckets créés
- [ ] Types TypeScript générés
- [ ] `.env.local` configuré
- [ ] Connexion Supabase testée
- [ ] Documentation lue et comprise

---

**🎉 Félicitations ! La Phase 1 (Architecture Backend) est complète !**

Vous pouvez maintenant passer à la Phase 2 : Auth & Profils.
