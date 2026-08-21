Informations sur une bourse:

- Le nom de la bourse
- L'organisation qui offre la bourse
- Le niveau de Formation (Licence, Master, Doctorat)
- Date d'ouverture de la bourse
- Date Limite pour postuler (+ Heure)
- Les domaines disponibles
- Le pays de destination
- L'organisation/Université
- Liens utiles (Nom + Url)
- Les critères d'admission
    - Anglais ?
    - Moyenne minimale
    - Lettres de recommandations
- Etapes du processus
    - Non démarré
    - Démarré
        - Description de l'étape
    - Terminé
        - Raisons

Informations sur le User
- Nom
- Prenom
- Age
- Sexe
- Formation
- Documents
    - Dernier Diplôme Obtenu
    - Lettres de recommandations

## Modèle de données proposé

Le profil utilisateur est une extension de `auth.users` dans Supabase : `profiles.id`
est donc la même valeur UUID que `auth.users.id`. Les fichiers ne sont pas stockés
directement en base ; `profile_documents` conserve leur type, leur nom et leur chemin
dans Supabase Storage.

Une bourse appartient à l'utilisateur qui la sauvegarde. Les domaines, liens et étapes
sont dans des tables séparées car chaque bourse peut en avoir plusieurs. Les critères
d'admission sont une relation 1-1 avec la bourse.

### Tables

- `profiles`: `first_name`, `last_name`, `age`, `gender`, `education`
- `profile_documents`: `last_diploma` ou `recommendation_letter`, avec `storage_path`
- `scholarships`: titre, organisation offreuse, niveau, dates, pays et université
- `scholarship_domains`: un domaine par ligne
- `scholarship_links`: nom et URL d'un lien utile
- `scholarship_admission_criteria`: anglais, moyenne minimale et nombre de lettres
- `scholarship_steps`: position, statut, description et raison de fin

Le script correspondant est [supabase/001_scholarship_schema.sql](supabase/001_scholarship_schema.sql).
Il est additif : les colonnes actuellement utilisées par l'interface (`organization`,
`deadline`, `reference_links`, etc.) sont conservées pendant la transition.

