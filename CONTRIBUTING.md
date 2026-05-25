# Guide de Contribution - Recettes de France

Merci de votre intérêt pour contribuer au projet **Recettes de France** ! Ce document vous guidera à travers le processus de contribution.

## Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Configuration de l'environnement](#configuration-de-lenvironnement)
- [Standards de code](#standards-de-code)
- [Processus de Pull Request](#processus-de-pull-request)
- [Signalement de bugs](#signalement-de-bugs)
- [Suggestions de fonctionnalités](#suggestions-de-fonctionnalités)

## Code de conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite :

- Soyez respectueux et inclusif
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est le mieux pour la communauté
- Faites preuve d'empathie envers les autres membres

## Comment contribuer

### Types de contributions

Nous acceptons plusieurs types de contributions :

1. **Corrections de bugs** - Résolution de problèmes identifiés
2. **Nouvelles fonctionnalités** - Ajout de nouvelles capacités
3. **Documentation** - Amélioration de la documentation
4. **Tests** - Ajout ou amélioration des tests
5. **Optimisations** - Amélioration des performances

## Configuration de l'environnement

### Prérequis

- Node.js 18+ et npm
- Git
- SQLite3

### Installation

1. **Forker le projet** sur GitHub

2. **Cloner votre fork**
   ```bash
   git clone https://github.com/votre-username/france.git
   cd france
   ```

3. **Installer les dépendances**
   ```bash
   npm install
   ```

4. **Configurer la base de données**
   ```bash
   node database/seed.js
   ```

5. **Lancer l'application en mode développement**
   ```bash
   npm run dev
   ```

6. **Lancer les tests**
   ```bash
   npm test
   ```

## Standards de code

### Style de code

- Utilisez **2 espaces** pour l'indentation
- Utilisez des **guillemets simples** pour les chaînes de caractères
- Ajoutez des **points-virgules** à la fin des instructions
- Nommage en **camelCase** pour les variables et fonctions
- Nommage en **PascalCase** pour les classes

### Structure des fichiers

```
controllers/    # Logique de contrôle des routes
services/       # Logique métier
routes/         # Définition des routes
middleware/     # Middlewares Express
database/       # Configuration et schéma de la base de données
views/          # Templates EJS
public/         # Fichiers statiques (CSS, JS client)
tests/          # Tests unitaires et d'intégration
```

### Conventions de nommage

- **Fichiers** : kebab-case (ex: `auth-controller.js`)
- **Variables/Fonctions** : camelCase (ex: `getUserById`)
- **Classes** : PascalCase (ex: `RecetteService`)
- **Constantes** : UPPER_SNAKE_CASE (ex: `MAX_RETRIES`)

### Commentaires

- Ajoutez des commentaires pour expliquer le **pourquoi**, pas le **quoi**
- Utilisez JSDoc pour documenter les fonctions publiques

```javascript
/**
 * Récupère une recette par son ID
 * @param {number} id - L'identifiant de la recette
 * @returns {Promise<Object>} La recette trouvée
 * @throws {Error} Si la recette n'existe pas
 */
async function getRecetteById(id) {
  // ...
}
```

## Processus de Pull Request

### Avant de soumettre

1. **Créer une branche** pour votre contribution
   ```bash
   git checkout -b feature/ma-nouvelle-fonctionnalite
   ```

2. **Faire vos modifications** en suivant les standards de code

3. **Tester vos modifications**
   ```bash
   npm test
   npm run lint
   ```

4. **Commiter vos changements** avec des messages clairs
   ```bash
   git commit -m "feat: ajout de la fonctionnalité X"
   ```

### Convention de commit

Utilisez le format [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation uniquement
- `style:` - Formatage, point-virgules manquants, etc.
- `refactor:` - Refactorisation du code
- `test:` - Ajout de tests
- `chore:` - Maintenance, dépendances, etc.

**Exemples :**
```
feat: ajout de la recherche par ingrédients
fix: correction du bug de notation
docs: mise à jour du README
test: ajout des tests pour authController
```

### Soumettre la Pull Request

1. **Pousser votre branche**
   ```bash
   git push origin feature/ma-nouvelle-fonctionnalite
   ```

2. **Créer une Pull Request** sur GitHub

3. **Remplir le template** de PR avec :
   - Description des changements
   - Type de changement (bug fix, feature, etc.)
   - Tests effectués
   - Captures d'écran si applicable

4. **Attendre la revue** - Un mainteneur examinera votre PR

### Critères d'acceptation

Votre PR sera acceptée si :

- ✅ Les tests passent
- ✅ Le code suit les standards du projet
- ✅ La documentation est à jour
- ✅ Pas de conflits avec la branche principale
- ✅ La revue de code est approuvée

## Signalement de bugs

### Avant de signaler

- Vérifiez que le bug n'a pas déjà été signalé
- Assurez-vous que c'est bien un bug et non une question

### Comment signaler

Créez une issue avec :

1. **Titre clair** décrivant le problème
2. **Description détaillée** incluant :
   - Comportement attendu
   - Comportement actuel
   - Étapes pour reproduire
   - Environnement (OS, version Node.js, navigateur)
   - Captures d'écran si applicable
   - Messages d'erreur

**Template :**
```markdown
## Description
[Description claire du bug]

## Étapes pour reproduire
1. Aller sur '...'
2. Cliquer sur '...'
3. Voir l'erreur

## Comportement attendu
[Ce qui devrait se passer]

## Comportement actuel
[Ce qui se passe réellement]

## Environnement
- OS: [ex: Windows 11]
- Node.js: [ex: 18.16.0]
- Navigateur: [ex: Chrome 120]

## Captures d'écran
[Si applicable]
```

## Suggestions de fonctionnalités

### Avant de suggérer

- Vérifiez que la fonctionnalité n'existe pas déjà
- Assurez-vous qu'elle correspond à la vision du projet

### Comment suggérer

Créez une issue avec :

1. **Titre descriptif**
2. **Description détaillée** incluant :
   - Problème que cela résout
   - Solution proposée
   - Alternatives considérées
   - Contexte additionnel

**Template :**
```markdown
## Problème
[Quel problème cette fonctionnalité résout-elle ?]

## Solution proposée
[Comment devrait-elle fonctionner ?]

## Alternatives
[Autres solutions envisagées]

## Contexte
[Informations supplémentaires]
```

## Tests

### Écrire des tests

- Ajoutez des tests pour toute nouvelle fonctionnalité
- Assurez-vous que tous les tests passent avant de soumettre
- Visez une couverture de code > 80%

### Lancer les tests

```bash
# Tous les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## Questions ?

Si vous avez des questions, n'hésitez pas à :

- Ouvrir une issue avec le label `question`
- Contacter les mainteneurs du projet

## Remerciements

Merci de contribuer à **Recettes de France** ! Chaque contribution, petite ou grande, est appréciée. 🎉

---

**Bon développement ! 👨‍💻👩‍💻**
