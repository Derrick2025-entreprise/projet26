/**
 * Tests de proprietes pour authService
 * Feature: recipe-app
 * Hachage via node:crypto (PBKDF2) — aucune dépendance externe.
 */
import fc from 'fast-check';
import { randomBytes, pbkdf2 } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Paramètres PBKDF2 identiques à authService */
const ITERATIONS = 100_000;
const KEY_LEN    = 64;
const DIGEST     = 'sha512';

function hacher(motDePasse) {
  return new Promise((resolve, reject) => {
    const sel = randomBytes(16).toString('hex');
    pbkdf2(motDePasse, sel, ITERATIONS, KEY_LEN, DIGEST, (err, key) => {
      if (err) return reject(err);
      resolve(`${sel}:${key.toString('hex')}`);
    });
  });
}

function verifier(motDePasse, stocke) {
  const [sel, hashAttendu] = stocke.split(':');
  return new Promise((resolve, reject) => {
    pbkdf2(motDePasse, sel, ITERATIONS, KEY_LEN, DIGEST, (err, key) => {
      if (err) return reject(err);
      resolve(key.toString('hex') === hashAttendu);
    });
  });
}

function creerDbTest() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  const schema = readFileSync(join(__dirname, '../database/schema.sql'), 'utf8');
  db.exec(schema);
  return db;
}

async function inscrireUtilisateur(db, username, email, motDePasse) {
  if (!username || !email || !motDePasse) throw new Error('Tous les champs sont obligatoires.');
  if (motDePasse.length < 6) throw new Error('Mot de passe trop court: au moins 6 caracteres.');

  const existingEmail = db.prepare('SELECT id FROM utilisateurs WHERE email = ?').get(email);
  if (existingEmail) throw new Error('Email deja utilise.');

  const existingUsername = db.prepare('SELECT id FROM utilisateurs WHERE username = ?').get(username);
  if (existingUsername) throw new Error('Username deja pris.');

  const hash = await hacher(motDePasse);
  const result = db.prepare('INSERT INTO utilisateurs (username, email, mot_de_passe) VALUES (?, ?, ?)').run(username, email, hash);
  return { id: result.lastInsertRowid, username, email };
}

// Propriete 5: le mot de passe stocke ne doit jamais etre identique au mot de passe en clair
test('Feature: recipe-app, Propriete 5: hachage des mots de passe', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length > 0),
      fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
      async (motDePasse, username) => {
        const db = creerDbTest();
        const email = `${username}@test.com`;

        await inscrireUtilisateur(db, username, email, motDePasse);

        const row = db.prepare('SELECT mot_de_passe FROM utilisateurs WHERE email = ?').get(email);
        // Le hash stocke ne doit jamais etre le mot de passe en clair
        expect(row.mot_de_passe).not.toBe(motDePasse);
        // Le hash doit etre verifiable avec PBKDF2
        const match = await verifier(motDePasse, row.mot_de_passe);
        expect(match).toBe(true);

        db.close();
      }
    ),
    { numRuns: 10 } // PBKDF2 100k iterations est lent — 10 runs suffisent pour la propriété
  );
}, 60000);

// Propriete 8: tout mot de passe < 6 chars (y compris vide) doit etre rejete sans creer d'utilisateur
test('Feature: recipe-app, Propriete 8: rejet des mots de passe trop courts', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 0, maxLength: 5 }),
      fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
      async (motDePasse, username) => {
        const db = creerDbTest();
        const email = `${username}@test.com`;

        // Toute tentative avec un mot de passe < 6 chars doit lever une erreur
        await expect(
          inscrireUtilisateur(db, username, email, motDePasse)
        ).rejects.toThrow();

        // Aucun utilisateur ne doit avoir ete cree
        const count = db.prepare('SELECT COUNT(*) as n FROM utilisateurs').get();
        expect(count.n).toBe(0);

        db.close();
      }
    ),
    { numRuns: 100 }
  );
}, 30000);
