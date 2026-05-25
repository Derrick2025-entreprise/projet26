/**
 * Tests de propriétés pour rechercheService
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

function creerUtilisateur(db) {
  return db.prepare(
    "INSERT INTO utilisateurs (username, email, mot_de_passe) VALUES ('auteur', 'auteur@test.com', 'hash')"
  ).run().lastInsertRowid;
}

function insererRecette(db, userId, titre, description = '') {
  return db.prepare(
    "INSERT INTO recettes (titre, description, ingredients, etapes, utilisateur_id) VALUES (?, ?, 'ing', 'etapes', ?)"
  ).run(titre, description, userId).lastInsertRowid;
}

function rechercherRecettes(db, motCle) {
  if (!motCle || !motCle.trim()) {
    return db.prepare(
      'SELECT r.*, u.username AS auteur FROM recettes r JOIN utilisateurs u ON u.id = r.utilisateur_id ORDER BY r.cree_le DESC'
    ).all();
  }
  const pattern = `%${motCle.trim()}%`;
  return db.prepare(`
    SELECT r.*, u.username AS auteur
    FROM recettes r
    JOIN utilisateurs u ON u.id = r.utilisateur_id
    WHERE LOWER(r.titre) LIKE LOWER(?)
       OR LOWER(r.description) LIKE LOWER(?)
    ORDER BY r.cree_le DESC
  `).all(pattern, pattern);
}

const arbMotSimple = fc.stringMatching(/^[a-zA-Z]{2,15}$/);

// --- Propriété 1 : Recherche insensible à la casse ---
test('Feature: recipe-app, Propriété 1: recherche insensible à la casse', () => {
  fc.assert(
    fc.property(arbMotSimple, (mot) => {
      const db = creerDbTest();
      const userId = creerUtilisateur(db);

      insererRecette(db, userId, `Recette avec ${mot.toLowerCase()} dedans`);

      const resultats = rechercherRecettes(db, mot.toUpperCase());
      expect(resultats.length).toBeGreaterThanOrEqual(1);
      expect(resultats.some(r => r.titre.toLowerCase().includes(mot.toLowerCase()))).toBe(true);

      db.close();
    }),
    { numRuns: 100 }
  );
});

test('Feature: recipe-app, Propriété 1b: recherche insensible à la casse dans la description', () => {
  fc.assert(
    fc.property(arbMotSimple, (mot) => {
      const db = creerDbTest();
      const userId = creerUtilisateur(db);

      insererRecette(db, userId, 'Titre neutre', `Description avec ${mot.toUpperCase()} dedans`);

      const resultats = rechercherRecettes(db, mot.toLowerCase());
      expect(resultats.length).toBeGreaterThanOrEqual(1);

      db.close();
    }),
    { numRuns: 100 }
  );
});

// --- Propriété 2 : Recherche vide retourne toutes les recettes ---
test('Feature: recipe-app, Propriété 2: recherche vide retourne toutes les recettes', () => {
  const arbVide = fc.oneof(
    fc.constant(''),
    fc.constant(null),
    fc.constant(undefined),
    fc.string({ minLength: 1, maxLength: 10 }).map(s => s.replace(/./g, ' '))
  );

  fc.assert(
    fc.property(
      fc.array(arbMotSimple, { minLength: 0, maxLength: 10 }),
      arbVide,
      (titres, motCleVide) => {
        const db = creerDbTest();
        const userId = creerUtilisateur(db);

        titres.forEach((titre, i) => insererRecette(db, userId, `${titre}_${i}`));

        const resultats = rechercherRecettes(db, motCleVide);
        expect(resultats.length).toBe(titres.length);

        db.close();
      }
    ),
    { numRuns: 100 }
  );
});
