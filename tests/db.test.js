/**
 * Tests de propriétés pour l'initialisation de la base de données
 * Feature: recipe-app
 */
import fc from 'fast-check';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function lireSchema() {
  return readFileSync(join(__dirname, '../database/schema.sql'), 'utf8');
}

function initSchema(db) {
  db.exec(lireSchema());
}

function obtenirTables(db) {
  return db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name);
}

// --- Propriété 7 : Idempotence de l'initialisation de la base de données ---
// Feature: recipe-app, Propriété 7: appeler initSchema N fois ne provoque pas d'erreur et laisse le schéma intact

test('Feature: recipe-app, Propriété 7: idempotence de l\'initialisation de la base de données', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 10 }),
      (nbAppels) => {
        const db = new DatabaseSync(':memory:');

        expect(() => {
          for (let i = 0; i < nbAppels; i++) {
            initSchema(db);
          }
        }).not.toThrow();

        const tables = obtenirTables(db);
        expect(tables).toContain('utilisateurs');
        expect(tables).toContain('recettes');

        const colonnesUtilisateurs = db.prepare("PRAGMA table_info(utilisateurs)").all().map(c => c.name);
        expect(colonnesUtilisateurs).toEqual(expect.arrayContaining(['id', 'username', 'email', 'mot_de_passe']));

        const colonnesRecettes = db.prepare("PRAGMA table_info(recettes)").all().map(c => c.name);
        expect(colonnesRecettes).toEqual(expect.arrayContaining(['id', 'titre', 'ingredients', 'etapes', 'utilisateur_id']));

        db.close();
      }
    ),
    { numRuns: 100 }
  );
});

test('Feature: recipe-app, Propriété 7b: les données existantes sont préservées après ré-initialisation', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 5 }),
      (nbAppels) => {
        const db = new DatabaseSync(':memory:');
        initSchema(db);

        db.prepare("INSERT INTO utilisateurs (username, email, mot_de_passe) VALUES ('test', 'test@test.com', 'hash')").run();

        for (let i = 0; i < nbAppels; i++) {
          initSchema(db);
        }

        const count = db.prepare('SELECT COUNT(*) as n FROM utilisateurs').get();
        expect(count.n).toBe(1);

        db.close();
      }
    ),
    { numRuns: 100 }
  );
});
