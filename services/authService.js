/**
 * @file services/authService.js
 * @description Service d'authentification des utilisateurs.
 * Utilise une classe ES6 pour encapsuler la logique métier.
 * Hachage des mots de passe via node:crypto (PBKDF2) — aucune dépendance externe.
 * @module services/authService
 */

import { randomBytes, pbkdf2 } from 'node:crypto';
import { getDb } from '../database/db.js';

/**
 * Service d'authentification.
 * Toutes les méthodes sont statiques — pas d'état interne.
 */
class AuthService {
  /** Longueur minimale du mot de passe */
  static MIN_PASSWORD_LENGTH = 6;

  /** Paramètres PBKDF2 */
  static ITERATIONS = 100_000;
  static KEY_LEN    = 64;
  static DIGEST     = 'sha512';

  /**
   * Hache un mot de passe avec PBKDF2 + sel aléatoire.
   * Format stocké : "sel:hash" (hex:hex)
   * @param {string} motDePasse
   * @returns {Promise<string>}
   */
  static async _hacher(motDePasse) {
    const sel = randomBytes(16).toString('hex');
    const hash = await new Promise((resolve, reject) => {
      pbkdf2(motDePasse, sel, AuthService.ITERATIONS, AuthService.KEY_LEN, AuthService.DIGEST,
        (err, key) => err ? reject(err) : resolve(key.toString('hex')));
    });
    return `${sel}:${hash}`;
  }

  /**
   * Vérifie un mot de passe contre un hash stocké.
   * @param {string} motDePasse - Mot de passe en clair
   * @param {string} stocke - Hash au format "sel:hash"
   * @returns {Promise<boolean>}
   */
  static async _verifier(motDePasse, stocke) {
    const [sel, hashAttendu] = stocke.split(':');
    const hash = await new Promise((resolve, reject) => {
      pbkdf2(motDePasse, sel, AuthService.ITERATIONS, AuthService.KEY_LEN, AuthService.DIGEST,
        (err, key) => err ? reject(err) : resolve(key.toString('hex')));
    });
    return hash === hashAttendu;
  }

  /**
   * Inscrit un nouvel utilisateur.
   * Valide les champs, vérifie l'unicité email/username, hache le mot de passe.
   * @async
   * @param {string} username
   * @param {string} email
   * @param {string} motDePasse - Mot de passe en clair
   * @returns {Promise<{id: number, username: string, email: string}>}
   * @throws {Error} Si champ manquant, mot de passe trop court, ou email/username déjà pris
   */
  static async inscrireUtilisateur(username, email, motDePasse) {
    if (!username || !email || !motDePasse) {
      throw new Error('Tutti i campi sono obbligatori.');
    }
    if (motDePasse.length < AuthService.MIN_PASSWORD_LENGTH) {
      throw new Error('La password deve contenere almeno 6 caratteri.');
    }

    const db = getDb();

    const existingEmail = db.prepare('SELECT id FROM utilisateurs WHERE email = ?').get(email);
    if (existingEmail) throw new Error('Questo indirizzo email è già in uso.');

    const existingUsername = db.prepare('SELECT id FROM utilisateurs WHERE username = ?').get(username);
    if (existingUsername) throw new Error('Questo nome utente è già preso.');

    // Hachage PBKDF2 — le mot de passe en clair n'est jamais persisté
    const hash = await AuthService._hacher(motDePasse);
    const result = db.prepare(
      'INSERT INTO utilisateurs (username, email, mot_de_passe) VALUES (?, ?, ?)'
    ).run(username, email, hash);

    // Number() pour normaliser le BigInt retourné par node:sqlite
    return { id: Number(result.lastInsertRowid), username, email };
  }

  /**
   * Authentifie un utilisateur par email + mot de passe.
   * Retourne null si les identifiants sont invalides (sans préciser lequel).
   * @async
   * @param {string} email
   * @param {string} motDePasse - Mot de passe en clair
   * @returns {Promise<{id: number, username: string, email: string}|null>}
   */
  static async connecterUtilisateur(email, motDePasse) {
    if (!email || !motDePasse) return null;

    const db = getDb();
    const user = db.prepare('SELECT * FROM utilisateurs WHERE email = ?').get(email);
    if (!user) return null;

    const match = await AuthService._verifier(motDePasse, user.mot_de_passe);
    if (!match) return null;

    // Ne retourner que les données publiques (jamais le hash)
    return { id: Number(user.id), username: user.username, email: user.email };
  }
}

// Exports nommés pour compatibilité avec les controllers existants
export const inscrireUtilisateur  = (...a) => AuthService.inscrireUtilisateur(...a);
export const connecterUtilisateur = (...a) => AuthService.connecterUtilisateur(...a);

export default AuthService;
