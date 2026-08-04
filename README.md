# Musculation

Application personnelle de suivi de musculation. PWA hors ligne, hébergée sur
GitHub Pages, données sauvegardées via un second dépôt GitHub privé.

## Stack

React 18, TypeScript strict, Vite, Tailwind CSS, vite-plugin-pwa (Workbox),
Dexie (IndexedDB), Recharts.

## Commandes de développement

```bash
npm install       # installe les dépendances
npm run dev       # serveur de développement
npm run build     # build de production dans dist/
npm run preview   # sert le build de production localement
npm run lint      # vérifie le code
```

## Architecture à deux dépôts

- **Dépôt public** (celui-ci, `sport`) : le code source. C'est lui que GitHub
  Pages publie. Aucune donnée personnelle n'y transite jamais.
- **Dépôt privé** (`sport-data`) : contient un seul fichier `donnees.json`,
  écrit par l'application elle-même via l'API GitHub (endpoint contents).
  Chaque écriture crée un commit : l'historique du dépôt fait office de
  sauvegarde versionnée, restaurable depuis l'écran Réglages > Sauvegardes.

### Création des dépôts

1. Dépôt public : déjà créé (`sport`), c'est celui-ci.
2. Dépôt privé : à créer sur GitHub, en **privé**, vide (pas besoin de
   README ni de fichier initial, l'application créera `donnees.json` seule).

### Activation de GitHub Pages

Dans les réglages du dépôt public : **Settings > Pages > Source**, choisir
**GitHub Actions**. Le workflow `.github/workflows/deploy.yml` déploie
automatiquement à chaque push sur `main`. Le site est ensuite disponible à
`https://<utilisateur>.github.io/sport/`.

### Création du jeton d'accès GitHub

Le jeton sert uniquement à ce que l'application écrive dans le dépôt privé de
données. Il ne doit jamais être partagé, ni commité, ni collé dans une
conversation. Procédure :

1. GitHub > Settings (compte) > Developer settings > Personal access tokens >
   Fine-grained tokens > Generate new token.
2. Repository access : **Only select repositories** → choisir uniquement le
   dépôt privé de données (`sport-data`).
3. Permissions : **Contents : Read and write**. Rien d'autre.
4. Générer, puis dans l'application : Réglages, renseigner le propriétaire
   (ton nom d'utilisateur GitHub), le nom du dépôt privé, et coller le jeton.
   Tout est stocké uniquement en local (IndexedDB), jamais envoyé ailleurs
   qu'à l'API GitHub, jamais commité dans le dépôt public.

### Fonctionnement de la synchronisation

- Se déclenche automatiquement à la fin de chaque séance, et au démarrage de
  l'application.
- Bouton « Synchroniser maintenant » disponible dans Réglages pour forcer une
  synchronisation.
- Règle de résolution de conflit : la version la plus récente (comparaison
  d'horodatage) l'emporte.
- L'indicateur en haut d'écran est vert (moins de 24 h), orange (24 h à 3
  jours) ou rouge (plus de 3 jours) selon l'ancienneté de la dernière
  synchronisation réussie.

## Installation sur Android (Pixel, Chrome)

1. Ouvrir `https://<utilisateur>.github.io/sport/` dans Chrome.
2. Menu (⋮) > **Ajouter à l'écran d'accueil**.
3. Ouvrir l'application depuis l'icône ajoutée : elle se lance en mode
   standalone, sans barre d'adresse.
4. Elle fonctionne entièrement hors ligne après le premier chargement.

## Procédure de restauration

Dans Réglages > Sauvegardes : liste des 20 derniers commits du dépôt privé
avec leur date. Choisir un commit et confirmer pour restaurer son contenu
dans la base locale (écrase les données locales après confirmation
explicite).

## Statut du projet

- [x] Phase 1 : socle technique (Vite, PWA, Dexie, déploiement Pages)
- [x] Phase 2 : sélection de séance
- [x] Phase 3 : écran de séance
- [x] Phase 4 : progression et coach
- [x] Phase 5 : synchronisation GitHub
- [ ] Phase 6 : tableau de bord
- [ ] Phase 7 : graphiques
- [ ] Phase 8 : finitions
