# Rapport Technique — RecetteApp

## 1. Présentation du projet

RecetteApp est une application web de gestion de recettes de cuisine développée en **Node.js**. Elle permet aux utilisateurs de s'inscrire, se connecter, créer, modifier, supprimer et rechercher des recettes. L'application suit une architecture **MVC (Modèle-Vue-Contrôleur)** classique côté serveur.

---

## 2. Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Runtime | Node.js | v22.5+ (requis pour `node:sqlite`) |
| Framework web | Express.js | ^4.18.2 |
| Moteur de templates | EJS (Embedded JavaScript) | ^3.1.9 |
| Base de données | SQLite (natif Node.js) | `node:sqlite` |
| Hachage de mots de passe | node:crypto (PBKDF2) | natif Node.js |
| Sessions | express-session | ^1.17.3 |
| Tests | Jest | ^29.7.0 |
| Tests de propriétés | fast-check | ^3.15.0 |

---

## 3. Architecture du projet

```
recipe-app/
├── app.js                    # Point d'entrée, configuration Express
├── package.json
├── controllers/              # Logique de traitement des requêtes HTTP
│   ├── authController.js
│   ├── recetteController.js
│   └── rechercheController.js
├── services/                 # Logique métier et accès aux données
│   ├── authService.js
│   ├── recettes.service.js
│   └── rechercheService.js
├── middleware/
│   └── auth.js               # Protection des routes (requireAuth)
├── routes/                   # Définition des routes Express
│   ├── auth.js
│   ├── recettes.js
│   └── recherche.js
├── database/
│   ├── db.js                 # Singleton SQLite + initialisation schéma
│   ├── schema.sql            # Définition des tables
│   └── seed.js               # Données initiales
├── views/                    # Templates EJS
│   ├── accueil.ejs
│   ├── connexion.ejs
│   ├── inscription.ejs
│   ├── recette-detail.ejs
│   ├── recette-form.ejs
│   ├── recherche.ejs
│   ├── erreur.ejs
│   └── layout/
│       ├── base.ejs
│       └── header.ejs
├── public/                   # Fichiers statiques
│   ├── css/style.css
│   └── js/client.js
└── tests/                    # Suites de tests
    ├── auth.test.js
    ├── recette.test.js
    ├── recherche.test.js
    └── db.test.js
```

---

## 4. Point d'entrée — `app.js`

Le fichier `app.js` configure et démarre le serveur Express. Il effectue dans l'ordre :

1. **Initialisation de la base de données** via `getDb()` au démarrage.
2. **Configuration du moteur de templates** EJS avec le dossier `views/`.
3. **Middlewares globaux** :
   - `express.urlencoded({ extended: true })` — décode les formulaires HTML.
   - `express.json()` — décode les corps JSON (requêtes `fetch` client).
   - `express.static()` — sert les fichiers CSS, JS et images depuis `/public`.
   - `express-session` — gestion des sessions avec clé secrète configurable via `SESSION_SECRET`.
   - Middleware custom qui injecte `res.locals.utilisateur` pour rendre l'utilisateur disponible dans tous les templates sans passer la variable manuellement.
4. **Montage des routes** : `/` (accueil), `/` (auth), `/recettes`, `/recherche`.
5. **Gestionnaires d'erreurs** : 404 (route inconnue) et 500 (erreurs propagées via `next(err)`).

Le serveur écoute sur le port défini par `process.env.PORT` ou `3000` par défaut.

---

## 5. Base de données — `node:sqlite`

### Choix technique

L'application utilise le module **natif `node:sqlite`** disponible depuis Node.js v22.5.0, sans dépendance externe ni compilation native (pas de `better-sqlite3` ou `sqlite3`). Cela simplifie l'installation et évite les problèmes de compilation sur différentes plateformes.

### Singleton (`database/db.js`)

La connexion est gérée comme un **singleton** : une seule instance `DatabaseSync` est créée pour toute la durée de vie du processus. Deux pragmas SQLite sont activés à l'initialisation :

- `PRAGMA journal_mode = WAL` — Write-Ahead Logging, améliore les performances en lecture concurrente.
- `PRAGMA foreign_keys = ON` — active la vérification des clés étrangères.

La fonction `initSchema()` exécute `schema.sql` avec `CREATE TABLE IF NOT EXISTS`, ce qui la rend **idempotente** (peut être appelée plusieurs fois sans erreur ni perte de données).

La variable d'environnement `DB_PATH` permet de surcharger le chemin du fichier. En tests, on utilise `:memory:` pour une base en mémoire isolée.

### Schéma (`database/schema.sql`)

Deux tables :

**`utilisateurs`**
| Colonne | Type | Contrainte |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| username | TEXT | NOT NULL UNIQUE |
| email | TEXT | NOT NULL UNIQUE |
| mot_de_passe | TEXT | NOT NULL (hash bcrypt) |
| cree_le | DATETIME | DEFAULT CURRENT_TIMESTAMP |

**`recettes`**
| Colonne | Type | Contrainte |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| titre | TEXT | NOT NULL |
| description | TEXT | — |
| ingredients | TEXT | NOT NULL |
| etapes | TEXT | NOT NULL |
| image_url | TEXT | — |
| utilisateur_id | INTEGER | NOT NULL, FOREIGN KEY → utilisateurs(id) |
| cree_le | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| modifie_le | DATETIME | DEFAULT CURRENT_TIMESTAMP |

---

## 6. Authentification

### Service (`services/authService.js`)

La logique d'authentification est encapsulée dans la classe ES6 `AuthService` avec des méthodes et constantes statiques.

**Inscription (`AuthService.inscrireUtilisateur`)** :
- Validation des champs obligatoires (username, email, mot de passe).
- Vérification de la longueur minimale du mot de passe (6 caractères, définie dans `AuthService.MIN_PASSWORD_LENGTH`).
- Vérification de l'unicité de l'email et du username en base.
- Hachage du mot de passe avec **node:crypto PBKDF2** (100 000 itérations, sel aléatoire 16 octets, SHA-512, clé 64 octets) avant insertion. Format stocké : `sel:hash` en hexadécimal. Aucune dépendance externe.
- Retourne `{ id, username, email }` avec `id` normalisé en `Number` — le hash n'est jamais exposé.

**Connexion (`AuthService.connecterUtilisateur`)** :
- Recherche de l'utilisateur par email.
- Comparaison du mot de passe en clair avec le hash via `bcrypt.compare()`.
- Retourne `null` si les identifiants sont invalides (sans préciser lequel, pour éviter l'énumération d'emails).

### Middleware (`middleware/auth.js`)

`requireAuth` protège les routes qui nécessitent une authentification. Il vérifie la présence de `req.session.utilisateur` et redirige vers `/connexion` si absent. Ce comportement est préféré à une erreur 401 pour une meilleure expérience utilisateur dans une application web classique.

### Sessions (`express-session`)

Les sessions sont stockées en mémoire côté serveur. La configuration :
- `secret` : clé lue depuis `process.env.SESSION_SECRET` (ou valeur par défaut en développement).
- `saveUninitialized: false` : évite de créer une session pour les visiteurs anonymes.
- `resave: false` : n'enregistre pas la session si elle n'a pas été modifiée.
- `cookie.secure: false` : à passer à `true` en production avec HTTPS.

---

## 7. Gestion des recettes

### Service (`services/recettes.service.js`)

Toutes les opérations CRUD sont encapsulées dans la classe ES6 `RecetteService` avec des méthodes statiques. Une méthode privée `_valider()` centralise la validation des champs obligatoires (titre, ingrédients, étapes) et lève des erreurs avec un code `status` HTTP approprié (400, 403, 404).

Tous les identifiants sont normalisés via `Number()` pour éviter les problèmes de comparaison entre `BigInt` (retourné par `node:sqlite`) et `Number` (stocké en session).

| Méthode | Description |
|---|---|
| `obtenirToutesRecettes()` | SELECT avec JOIN utilisateurs, trié par date décroissante |
| `obtenirRecetteParId(id)` | SELECT par id avec JOIN, retourne `null` si absent |
| `obtenirRecettesParUtilisateur(userId)` | Filtre par utilisateur |
| `creerRecette(...)` | Validation + INSERT + retour de la recette créée |
| `modifierRecette(...)` | Validation + vérification propriétaire + UPDATE |
| `supprimerRecette(id, userId)` | Vérification propriétaire + DELETE |

Le contrôle d'accès (modification/suppression) vérifie que `utilisateur_id` de la recette correspond à l'utilisateur connecté. Une erreur 403 est levée sinon.

### Contrôleur (`controllers/recetteController.js`)

Fait le lien entre les routes HTTP et le service. Gère le rendu des vues EJS avec les données appropriées et les redirections après actions (création → `/`, modification → `/recettes/:id`).

---

## 8. Recherche

### Service (`services/rechercheService.js`)

La recherche s'effectue sur le titre et la description des recettes via une requête SQL avec `LIKE` insensible à la casse (`LOWER(...) LIKE LOWER(?)`). Si le mot-clé est vide ou absent, toutes les recettes sont retournées.

### Contrôleur (`controllers/rechercheController.js`)

Lit le paramètre `q` depuis `req.query`, appelle le service et rend la vue `recherche.ejs` avec les résultats et le mot-clé pour pré-remplir le champ de recherche.

---

## 9. Vues — EJS

Le moteur de templates **EJS** permet d'insérer du JavaScript dans les fichiers HTML. L'application utilise un système de layout :

- `views/layout/base.ejs` — structure HTML commune (head, body, inclusion du header et du contenu).
- `views/layout/header.ejs` — barre de navigation avec liens conditionnels selon l'état de connexion (via `res.locals.utilisateur`).

Vues principales :
| Vue | Description |
|---|---|
| `accueil.ejs` | Liste de toutes les recettes |
| `recette-detail.ejs` | Détail d'une recette avec boutons modifier/supprimer (si propriétaire) |
| `recette-form.ejs` | Formulaire partagé création/modification |
| `recherche.ejs` | Résultats de recherche |
| `connexion.ejs` | Formulaire de connexion |
| `inscription.ejs` | Formulaire d'inscription |
| `erreur.ejs` | Page d'erreur générique (404, 403, 500) |

---

## 10. Client JavaScript (`public/js/client.js`)

Le code client est organisé en **4 classes ES6** conformément aux exigences du cours :

| Classe | Rôle |
|---|---|
| `Loader` | Gère la barre de progression de chargement via `classList` |
| `SpaRouter` | Navigation côté client avec Page.js — intercepte les liens et remplace `#main-content` via `fetch` + `async/await` |
| `FormManager` | Validation visuelle des formulaires, confirmation de suppression, toggle mot de passe — tout via `classList`, aucun style inline |
| `NavManager` | Met à jour le lien actif dans la navbar via `classList` |

Toutes les manipulations CSS passent exclusivement par `classList` — aucun `element.style` n'est utilisé.

---

## 11. Tests

Les tests utilisent **Jest** avec le flag `--experimental-vm-modules` pour supporter les modules ES (`import/export`). Chaque suite de tests crée une base SQLite **en mémoire** (`:memory:`) isolée, ce qui garantit l'indépendance des tests.

### Tests de propriétés avec fast-check

L'approche **Property-Based Testing** (PBT) avec `fast-check` génère automatiquement des centaines de cas de test aléatoires pour vérifier des propriétés invariantes du système.

| Fichier | Propriétés testées |
|---|---|
| `tests/auth.test.js` | Propriété 5 : le hash stocké ≠ mot de passe en clair, vérifiable avec bcrypt (100 runs). Propriété 8 : tout mot de passe < 6 chars est rejeté sans créer d'utilisateur (100 runs). |
| `tests/recette.test.js` | Propriété 3 : aller-retour de persistance (données lues = données écrites). Propriété 4 : contrôle d'accès (un utilisateur ne peut pas modifier/supprimer la recette d'un autre). Propriété 6 : rejet des champs obligatoires vides (titre, ingrédients, étapes). |
| `tests/recherche.test.js` | Propriété 1 : recherche insensible à la casse (titre et description). Propriété 2 : recherche vide retourne toutes les recettes. |
| `tests/db.test.js` | Propriété 7 : idempotence de `initSchema()` (N appels successifs sans erreur). Propriété 7b : les données existantes sont préservées après ré-initialisation. |

Chaque propriété est exécutée avec `numRuns: 100` (100 jeux de données générés aléatoirement).

---

## 12. Sécurité

| Mesure | Implémentation |
|---|---|
| Hachage des mots de passe | node:crypto PBKDF2 (100k itérations, sel aléatoire, SHA-512) — natif Node.js, aucune dépendance externe |
| Protection des routes | Middleware `requireAuth` sur toutes les routes CRUD |
| Contrôle d'accès aux ressources | Vérification `utilisateur_id` avant modification/suppression |
| Sessions sécurisées | Clé secrète via variable d'environnement, `saveUninitialized: false` |
| Pas d'énumération d'emails | Connexion retourne `null` sans préciser quel champ est invalide |
| Clés étrangères SQLite | `PRAGMA foreign_keys = ON` activé |

---

## 13. Lancement de l'application

```bash
# Installer les dépendances
npm install

# Démarrer le serveur (port 3000 par défaut)
npm start

# Lancer les tests
npm test
```

Le flag `--experimental-sqlite` est requis pour utiliser le module natif `node:sqlite`.

---

## 14. Variables d'environnement

| Variable | Valeur par défaut | Description |
|---|---|---|
| `PORT` | `3000` | Port d'écoute du serveur |
| `SESSION_SECRET` | `recette-secret-key` | Clé de signature des sessions (à changer en production) |
| `DB_PATH` | `database/recettes.db` | Chemin vers le fichier SQLite |
