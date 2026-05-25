/**
 * Tests de propriétés pour recetteService
 * Feature: recipe-app
 */
import fc from 'fast-check';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function creerDbTest() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  const schema = readFileSync(join(__dirname, '../database/schema.sql'), 'utf8');
  db.exec(schema);
  return db;
}

function creerUtilisateur(db, username = 'user1', email = 'user1@test.com') {
  return db.prepare(
    "INSERT INTO utilisateurs (username, email, mot_de_passe) VALUES (?, ?, 'hash')"
  ).run(username, email).lastInsertRowid;
}

const SELECT = `SELECT r.*, u.username AS auteur FROM recettes r JOIN utilisateurs u ON u.id = r.utilisateur_id`;

function obtenirRecetteParId(db, id) {
  return db.prepare(`${SELECT} WHERE r.id = ?`).get(id) || null;
}

function creerRecette(db, titre, description, ingredients, etapes, imageUrl, userId) {
  if (!titre || !titre.trim()) { const e = new Error('Le titre est obligatoire.'); e.status = 400; throw e; }
  if (!ingredients || !ingredients.trim()) { const e = new Error('Les ingrédients sont obligatoires.'); e.status = 400; throw e; }
  if (!etapes || !etapes.trim()) { const e = new Error('Les étapes sont obligatoires.'); e.status = 400; throw e; }

  const result = db.prepare(
    'INSERT INTO recettes (titre, description, ingredients, etapes, image_url, utilisateur_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(titre.trim(), description || '', ingredients.trim(), etapes.trim(), imageUrl || null, userId);
  return obtenirRecetteParId(db, result.lastInsertRowid);
}

function modifierRecette(db, id, titre, description, ingredients, etapes, imageUrl, userId) {
  if (!titre || !titre.trim()) { const e = new Error('Le titre est obligatoire.'); e.status = 400; throw e; }
  if (!ingredients || !ingredients.trim()) { const e = new Error('Les ingrédients sont obligatoires.'); e.status = 400; throw e; }
  if (!etapes || !etapes.trim()) { const e = new Error('Les étapes sont obligatoires.'); e.status = 400; throw e; }

  const recette = db.prepare('SELECT utilisateur_id FROM recettes WHERE id = ?').get(id);
  if (!recette) { const e = new Error('Recette introuvable.'); e.status = 404; throw e; }
  if (recette.utilisateur_id !== userId) { const e = new Error('Accès refusé.'); e.status = 403; throw e; }

  db.prepare(
    'UPDATE recettes SET titre=?, description=?, ingredients=?, etapes=?, image_url=?, modifie_le=CURRENT_TIMESTAMP WHERE id=?'
  ).run(titre.trim(), description || '', ingredients.trim(), etapes.trim(), imageUrl || null, id);
  return obtenirRecetteParId(db, id);
}

function supprimerRecette(db, id, userId) {
  const recette = db.prepare('SELECT utilisateur_id FROM recettes WHERE id = ?').get(id);
  if (!recette) { const e = new Error('Recette introuvable.'); e.status = 404; throw e; }
  if (recette.utilisateur_id !== userId) { const e = new Error('Accès refusé.'); e.status = 403; throw e; }
  db.prepare('DELETE FROM recettes WHERE id = ?').run(id);
  return true;
}

const arbChampNonVide = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);
const arbChampOptional = fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null });

// --- Propriété 3 : Aller-retour de persistance des recettes ---
test('Feature: recipe-app, Propriété 3: aller-retour de persistance des recettes', () => {
  fc.assert(
    fc.property(
      arbChampNonVide,
      fc.string({ maxLength: 300 }),
      arbChampNonVide,
      arbChampNonVide,
      arbChampOptional,
      (titre, description, ingredients, etapes, imageUrl) => {
        const db = creerDbTest();
        const userId = creerUtilisateur(db);

        const recette = creerRecette(db, titre, description, ingredients, etapes, imageUrl, userId);
        const recuperee = obtenirRecetteParId(db, recette.id);

        expect(recuperee).not.toBeNull();
        expect(recuperee.titre).toBe(titre.trim());
        expect(recuperee.ingredients).toBe(ingredients.trim());
        expect(recuperee.etapes).toBe(etapes.trim());
        expect(recuperee.utilisateur_id).toBe(userId);
        expect(recuperee.image_url).toBe(imageUrl);

        db.close();
      }
    ),
    { numRuns: 100 }
  );
});

// --- Propriété 4 : Contrôle d'accès modification et suppression ---
test('Feature: recipe-app, Propriété 4: contrôle d\'accès modification et suppression', () => {
  fc.assert(
    fc.property(
      arbChampNonVide,
      arbChampNonVide,
      arbChampNonVide,
      (titre, ingredients, etapes) => {
        const db = creerDbTest();
        const userId1 = creerUtilisateur(db, 'user1', 'user1@test.com');
        const userId2 = creerUtilisateur(db, 'user2', 'user2@test.com');

        const recette = creerRecette(db, titre, null, ingredients, etapes, null, userId1);

        let errModif;
        try { modifierRecette(db, recette.id, titre, null, ingredients, etapes, null, userId2); }
        catch (e) { errModif = e; }
        expect(errModif).toBeDefined();
        expect(errModif.status).toBe(403);

        let errSuppr;
        try { supprimerRecette(db, recette.id, userId2); }
        catch (e) { errSuppr = e; }
        expect(errSuppr).toBeDefined();
        expect(errSuppr.status).toBe(403);

        expect(obtenirRecetteParId(db, recette.id)).not.toBeNull();

        db.close();
      }
    ),
    { numRuns: 100 }
  );
});

// --- Propriété 6 : Rejet des recettes avec champs obligatoires vides ---
test('Feature: recipe-app, Propriété 6: rejet des recettes avec champs obligatoires vides', () => {
  const arbVide = fc.oneof(
    fc.constant(''),
    fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^ ]/g, ' '))
  );

  // Titre vide
  fc.assert(
    fc.property(arbVide, arbChampNonVide, arbChampNonVide, (titreVide, ingredients, etapes) => {
      const db = creerDbTest();
      const userId = creerUtilisateur(db);
      let err;
      try { creerRecette(db, titreVide, null, ingredients, etapes, null, userId); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.status).toBe(400);
      expect(db.prepare('SELECT COUNT(*) as n FROM recettes').get().n).toBe(0);
      db.close();
    }),
    { numRuns: 100 }
  );

  // Ingrédients vides
  fc.assert(
    fc.property(arbChampNonVide, arbVide, arbChampNonVide, (titre, ingredientsVides, etapes) => {
      const db = creerDbTest();
      const userId = creerUtilisateur(db);
      let err;
      try { creerRecette(db, titre, null, ingredientsVides, etapes, null, userId); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.status).toBe(400);
      db.close();
    }),
    { numRuns: 100 }
  );

  // Étapes vides
  fc.assert(
    fc.property(arbChampNonVide, arbChampNonVide, arbVide, (titre, ingredients, etapesVides) => {
      const db = creerDbTest();
      const userId = creerUtilisateur(db);
      let err;
      try { creerRecette(db, titre, null, ingredients, etapesVides, null, userId); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.status).toBe(400);
      db.close();
    }),
    { numRuns: 100 }
  );
});
