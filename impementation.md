
Crée un fichier `implementation.md` à la racine de ton projet et colle le contenu ci-dessous, puis dis à ton agent IA : *"Lis `implementation.md` et exécute toutes les étapes."*

```markdown
# Spécifications d'implémentation - Application de Gestion de Bourses (PWA)

## Context & Objective
L'objectif est de développer une Progressive Web App (PWA) 100% gratuite pour enregistrer et suivre des opportunités de bourses d'études trouvées sur LinkedIn, WhatsApp ou le web. L'application doit gérer des deadlines, des liens de référence et déclencher des rappels. Elle doit fonctionner de façon fluide sur iOS (Safari PWA) et être responsive/mobile-first.

---

## 1. Base de données & Supabase (PostgreSQL)

Exécute/vérifie la présence de la structure SQL suivante sur le backend Supabase :

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE scholarship_status AS ENUM ('saved', 'in_progress', 'applied', 'archived');

-- Table Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  telegram_chat_id TEXT
);

-- Table Scholarships
CREATE TABLE IF NOT EXISTS public.scholarships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  organization TEXT,
  status scholarship_status DEFAULT 'saved' NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  reference_links TEXT[] DEFAULT '{}',
  notes TEXT
);

-- Table Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  scholarship_id UUID REFERENCES public.scholarships(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  days_before INT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE NOT NULL
);

-- RLS Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users control their profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users control their scholarships" ON public.scholarships FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users control their reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id);

```

---

## 2. Tech Stack Frontend

* **Framework** : React + Vite + TypeScript
* **Styling** : Tailwind CSS + Lucide Icons (`lucide-react`)
* **Backend / Auth** : `@supabase/supabase-js`
* **PWA** : `vite-plugin-pwa`

---

## 3. Directives de Développement Frontend

### Step 1: Setup Projet & PWA

1. Initialise un projet Vite React TS avec Tailwind CSS et `lucide-react`.
2. Configure `vite-plugin-pwa` dans `vite.config.ts` :
* Mode `standalone`
* Theme color `#0f172a` (Slate 900)
* Configuration `share_target` pour intercepter les URLs/textes partagés depuis iOS/Android :
```json
"share_target": {
  "action": "/share",
  "method": "GET",
  "params": {
    "title": "title",
    "text": "text",
    "url": "url"
  }
}

```





### Step 2: Client Supabase & Types

1. Crée `src/lib/supabase.ts` répertoriant les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
2. Crée `src/types/database.ts` avec les interfaces TypeScript : `Scholarship`, `Reminder`, `Profile`.

### Step 3: Auth Component

1. Implémente un composant `Auth.tsx` élégant (Login / Signup avec Supabase Auth Email/Password).
2. Gère la session utilisateur globalement (ex: React Context ou Supabase Auth Listener).

### Step 4: UI & Navigation

1. **Design System** : Mobile-first, sobre, adapté au mode sombre nativement si possible, cards dépouillées avec badges colorés pour le statut (`saved`: gris, `in_progress`: bleu, `applied`: vert, `archived`: rouge).
2. **Dashboard View** :
* Filtres par statut (Toutes, En cours, Postulées, Archivées).
* Tri automatique par deadline la plus proche en premier.
* Calcul et affichage dynamique du compte à rebours avant deadline (ex: "Dans 5 jours", "Expire aujourd'hui").


3. **Formulaire d'ajout / Édition (Modal ou Écran dédié)** :
* Inputs : Titre, Organisme, Description (textarea), Deadline (date & time), Notes.
* Liens de référence : Liste dynamique d'inputs URL avec option d'en ajouter/supprimer plusieurs.
* Options de rappels : Checkboxes pour générer automatiquement des reminders (ex: 14 jours avant, 7 jours avant, 1 jour avant). Lors de la sauvegarde de la bourse, insérer les entrées correspondantes dans la table `reminders` avec `scheduled_for = deadline - X days`.


4. **Share Target Page (`/share`)** :
* Route qui lit les Query Params (`title`, `text`, `url`).
* Pré-remplit automatiquement le formulaire d'ajout avec les données interceptées et ouvre le modal de création.



---

## 4. Supabase Edge Function (Rappels Telegram)

Crée le fichier `supabase/functions/send-reminders/index.ts` avec la logique Deno suivante :

1. Se connecte avec le `SUPABASE_SERVICE_ROLE_KEY`.
2. Requête la table `reminders` :
`SELECT *, scholarships(*), profiles(*) FROM reminders WHERE is_sent = false AND scheduled_for <= NOW()`
3. Pour chaque résultat :
* Envoie un message formaté en Markdown vers l'API Telegram :
`https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/sendMessage`
* Le message contient : Titre de la bourse, Organisme, Deadline, et les Liens de référence.


4. Met à jour `is_sent = true` pour les reminders traités.

---

## Instructions pour l'Agent IA

* Exécute la création des fichiers étape par étape sans sauter de validation.
* Assure-toi que toutes les routes sont sécurisées et réagissent correctement sur un écran de mobile.
* Utilise des composants propres et modularisés dans `src/components/`.

```

```