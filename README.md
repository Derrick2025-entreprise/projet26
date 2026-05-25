# RecetteApp

Application web de partage de recettes de cuisine — Node.js, Express, SQLite, EJS.

Stack : Node.js v22.5+ · Express · EJS · SQLite natif (`node:sqlite`) · Bootstrap 5 · Page.js · `node:crypto` (PBKDF2) · express-session

---

## Prérequis

- **Node.js v22.5.0 ou supérieur** (obligatoire pour le module natif `node:sqlite`)
- **npm**

Vérifier la version :
```bash
node --version
# doit afficher v22.5.0 ou plus
```

Si besoin, télécharger Node.js sur [nodejs.org](https://nodejs.org).

---

## Installation et lancement local

```bash
# 1. Cloner le dépôt
git clone <url-du-repo>
cd recipe-app

# 2. Installer les dépendances
npm install

# 3. (Optionnel) Peupler la base avec des recettes de démonstration
node --experimental-sqlite database/seed.js

# 4. Démarrer le serveur
npm start
```

L'application est accessible sur **http://localhost:3000**

La base de données SQLite (`database/recettes.db`) est **créée automatiquement** au premier démarrage. Aucun serveur de base de données à installer ou configurer.

### Compte de démonstration (après seed)

| Champ | Valeur |
|---|---|
| Email | `chef@recettes.eu` |
| Mot de passe | `recettes123` |

---

## Variables d'environnement

Créer un fichier `.env` à la racine (optionnel en local, recommandé en production) :

```env
PORT=3000
SESSION_SECRET=remplacer-par-une-cle-secrete-longue
DB_PATH=database/recettes.db
```

| Variable | Défaut | Description |
|---|---|---|
| `PORT` | `3000` | Port d'écoute du serveur |
| `SESSION_SECRET` | `recette-secret-key` | Clé de signature des sessions — **à changer en production** |
| `DB_PATH` | `database/recettes.db` | Chemin vers le fichier SQLite |

> En production, ne jamais laisser la valeur par défaut de `SESSION_SECRET`.

---

## Tests

```bash
npm test
```

Les tests utilisent Jest + fast-check (tests de propriétés). Chaque suite crée une base SQLite en mémoire isolée, aucune configuration requise.

---

## Hébergement en production

### Option 1 — VPS / Serveur dédié (recommandé)

**1. Préparer le serveur**

```bash
# Installer Node.js v22+ via nvm (recommandé)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

**2. Déployer l'application**

```bash
git clone <url-du-repo> /var/www/recipe-app
cd /var/www/recipe-app
npm install --omit=dev
```

**3. Configurer les variables d'environnement**

```bash
# Créer le fichier .env
cat > .env << EOF
PORT=3000
SESSION_SECRET=$(openssl rand -hex 32)
DB_PATH=/var/www/recipe-app/database/recettes.db
EOF
```

**4. Lancer avec PM2 (gestionnaire de processus)**

```bash
npm install -g pm2

# Démarrer l'application
pm2 start "node --experimental-sqlite app.js" --name recipe-app

# Démarrer automatiquement au reboot
pm2 startup
pm2 save
```

Commandes PM2 utiles :
```bash
pm2 status          # état des processus
pm2 logs recipe-app # voir les logs
pm2 restart recipe-app
pm2 stop recipe-app
```

**5. Reverse proxy avec Nginx**

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

**6. HTTPS avec Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

> Après activation du HTTPS, passer `cookie.secure` à `true` dans `app.js`.

---

### Option 2 — Railway (hébergement cloud simple)

1. Créer un compte sur [railway.app](https://railway.app)
2. Nouveau projet → "Deploy from GitHub repo"
3. Sélectionner le dépôt
4. Dans les variables d'environnement du projet, ajouter :
   - `SESSION_SECRET` = une clé aléatoire longue
   - `DB_PATH` = `database/recettes.db`
5. Railway détecte automatiquement `npm start`

> Note : Railway utilise un système de fichiers éphémère. La base SQLite sera réinitialisée à chaque redéploiement. Pour persister les données, utiliser un volume persistant dans les paramètres Railway ou migrer vers une base PostgreSQL.

---

### Option 3 — Render

1. Créer un compte sur [render.com](https://render.com)
2. New → Web Service → connecter le dépôt GitHub
3. Paramètres :
   - Build Command : `npm install`
   - Start Command : `node --experimental-sqlite app.js`
4. Ajouter les variables d'environnement dans l'onglet "Environment"
5. Pour persister la base SQLite, créer un **Disk** dans les paramètres et monter sur `/var/data`, puis définir `DB_PATH=/var/data/recettes.db`

---

## Base de données

La base SQLite est un simple fichier — aucun serveur requis. Elle est créée automatiquement au démarrage si elle n'existe pas.

**Sauvegarder la base :**
```bash
cp database/recettes.db database/recettes.db.backup
```

**Réinitialiser la base :**
```bash
# Supprimer le fichier (sera recréé au prochain démarrage)
rm database/recettes.db database/recettes.db-shm database/recettes.db-wal

# Repeupler avec les données de démonstration
node --experimental-sqlite database/seed.js
```

**Inspecter la base (optionnel) :**
```bash
# Avec sqlite3 CLI
sqlite3 database/recettes.db ".tables"
sqlite3 database/recettes.db "SELECT * FROM utilisateurs;"
```

---

## Structure du projet

```
recipe-app/
├── app.js                    # Point d'entrée Express
├── package.json
├── .env                      # Variables d'environnement (à créer, non versionné)
├── controllers/              # Logique des requêtes HTTP
│   ├── authController.js
│   ├── recetteController.js
│   └── rechercheController.js
├── services/                 # Logique métier
│   ├── authService.js
│   ├── recettes.service.js
│   └── rechercheService.js
├── middleware/
│   └── auth.js               # Protection des routes (requireAuth)
├── routes/                   # Routeurs Express
│   ├── auth.js
│   ├── recettes.js
│   └── recherche.js
├── database/
│   ├── db.js                 # Connexion SQLite singleton
│   ├── schema.sql            # Définition des tables
│   ├── seed.js               # Données de démonstration
│   └── recettes.db           # Fichier BDD (généré automatiquement)
├── views/                    # Templates EJS
│   ├── layout/
│   │   ├── base.ejs
│   │   └── header.ejs
│   ├── accueil.ejs
│   ├── recette-detail.ejs
│   ├── recette-form.ejs
│   ├── recherche.ejs
│   ├── connexion.ejs
│   ├── inscription.ejs
│   └── erreur.ejs
├── public/
│   ├── css/style.css
│   └── js/client.js
└── tests/
    ├── auth.test.js
    ├── recette.test.js
    ├── recherche.test.js
    └── db.test.js
```

---

## Fonctionnalités

- Inscription et connexion avec sessions sécurisées
- Création, modification, suppression de recettes (propriétaire uniquement)
- Recherche par mot-clé insensible à la casse (titre et description)
- Validation des formulaires côté serveur
- Interface responsive
- Mots de passe hachés avec bcryptjs (jamais stockés en clair)
