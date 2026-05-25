/**
 * @file database/db.js
 * @description Couche d'accès à la base de données SQLite.
 *
 * Utilise le module natif `node:sqlite` (disponible depuis Node.js v22.5.0),
 * sans dépendance externe ni compilation native.
 *
 * Fonctionnement :
 *  - Singleton : une seule connexion est ouverte pour toute la durée de vie du processus.
 *  - Initialisation automatique du schéma au premier appel de getDb().
 *  - Le chemin de la BDD est configurable via la variable d'environnement DB_PATH.
 *
 * @module database/db
 */

import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Chemin vers le fichier de base de données SQLite.
 * Peut être surchargé via la variable d'environnement DB_PATH.
 * Utiliser ':memory:' pour les tests en mémoire.
 * @type {string}
 */
const DB_PATH = process.env.DB_PATH || join(__dirname, 'recettes.db');

/** @type {DatabaseSync|null} Instance singleton de la connexion SQLite */
let db = null;

/**
 * Retourne la connexion SQLite (singleton).
 * Crée et initialise la connexion si elle n'existe pas encore.
 *
 * Pragmas activés :
 *  - WAL (Write-Ahead Logging) : améliore les performances en lecture concurrente
 *  - foreign_keys : active la vérification des clés étrangères
 *
 * @returns {DatabaseSync} Instance de la base de données
 */
export function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

/**
 * Exécute le fichier schema.sql sur la base de données fournie.
 * Utilise CREATE TABLE IF NOT EXISTS, donc idempotent :
 * peut être appelé plusieurs fois sans erreur ni perte de données.
 *
 * @param {DatabaseSync} database - Instance de base de données cible
 */
export function initSchema(database) {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  database.exec(schema);
}

/**
 * Ferme la connexion SQLite et réinitialise le singleton.
 * Utile pour les tests (nettoyage entre les suites) ou l'arrêt propre du serveur.
 */
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
