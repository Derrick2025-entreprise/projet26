/**
 * @file services/notationsService.js
 * @description Service de gestion des notations (étoiles + suggestions) des recettes.
 * @module services/notationsService
 */

import { getDb } from '../database/db.js';

const SEL_AVIS = `SELECT n.etoiles, n.suggestion, n.cree_le, u.username AS auteur
  FROM notations n
  JOIN utilisateurs u ON u.id = n.utilisateur_id`;

/**
 * Service de gestion des notations utilisateur sur les recettes.
 */
class NotationsService {
  /**
   * Enregistre ou met à jour la notation d'un utilisateur pour une recette.
   * @param {number} userId
   * @param {number} recetteId
   * @param {number} etoiles - Note de 1 à 5
   * @param {string|null} suggestion - Commentaire facultatif
   * @returns {object} La notation enregistrée
   */
  static enregistrerNotation(userId, recetteId, etoiles, suggestion = null) {
    const note = Number(etoiles);
    if (!Number.isInteger(note) || note < 1 || note > 5) {
      const e = new Error('La valutazione deve essere tra 1 e 5 stelle.');
      e.status = 400;
      throw e;
    }

    const db = getDb();
    const recette = db.prepare('SELECT id FROM recettes WHERE id = ?').get(Number(recetteId));
    if (!recette) {
      const e = new Error('Ricetta non trovata.');
      e.status = 404;
      throw e;
    }

    const texte = suggestion ? String(suggestion).trim().slice(0, 500) : null;

    db.prepare(`
      INSERT INTO notations (utilisateur_id, recette_id, etoiles, suggestion)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(utilisateur_id, recette_id) DO UPDATE SET
        etoiles = excluded.etoiles,
        suggestion = excluded.suggestion,
        modifie_le = CURRENT_TIMESTAMP
    `).run(Number(userId), Number(recetteId), note, texte);

    return NotationsService.obtenirNotationUtilisateur(userId, recetteId);
  }

  /**
   * Retourne la notation d'un utilisateur pour une recette, ou null.
   * @param {number} userId
   * @param {number} recetteId
   * @returns {object|null}
   */
  static obtenirNotationUtilisateur(userId, recetteId) {
    return getDb()
      .prepare('SELECT * FROM notations WHERE utilisateur_id = ? AND recette_id = ?')
      .get(Number(userId), Number(recetteId)) || null;
  }

  /**
   * Statistiques agrégées pour une recette.
   * @param {number} recetteId
   * @returns {{ moyenne: number, nombre: number }}
   */
  static obtenirStatsRecette(recetteId) {
    const row = getDb()
      .prepare(`
        SELECT COALESCE(ROUND(AVG(etoiles), 1), 0) AS moyenne,
               COUNT(*) AS nombre
        FROM notations WHERE recette_id = ?
      `)
      .get(Number(recetteId));
    return {
      moyenne: Number(row.moyenne),
      nombre: Number(row.nombre),
    };
  }

  /**
   * Liste des avis publics pour une recette (avec suggestion non vide en priorité).
   * @param {number} recetteId
   * @param {number} limit
   * @returns {Array}
   */
  static obtenirAvisRecette(recetteId, limit = 10) {
    return getDb()
      .prepare(`${SEL_AVIS} WHERE n.recette_id = ?
        ORDER BY n.modifie_le DESC LIMIT ?`)
      .all(Number(recetteId), Number(limit));
  }

  /**
   * Données complètes pour l'API / page détail.
   * @param {number} recetteId
   * @param {number|null} userId
   * @returns {object}
   */
  static obtenirDonneesRecette(recetteId, userId = null) {
    const stats = NotationsService.obtenirStatsRecette(recetteId);
    const maNotation = userId
      ? NotationsService.obtenirNotationUtilisateur(userId, recetteId)
      : null;
    const avis = NotationsService.obtenirAvisRecette(recetteId);
    return { stats, maNotation, avis };
  }
}

export const enregistrerNotation       = (...a) => NotationsService.enregistrerNotation(...a);
export const obtenirNotationUtilisateur = (...a) => NotationsService.obtenirNotationUtilisateur(...a);
export const obtenirStatsRecette       = (...a) => NotationsService.obtenirStatsRecette(...a);
export const obtenirAvisRecette        = (...a) => NotationsService.obtenirAvisRecette(...a);
export const obtenirDonneesRecette     = (...a) => NotationsService.obtenirDonneesRecette(...a);

export default NotationsService;
