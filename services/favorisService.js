/**
 * @file services/favorisService.js
 * @description Service de gestion des favoris utilisateur.
 * Utilise une classe ES6 avec méthodes statiques.
 * @module services/favorisService
 */

import { getDb } from '../database/db.js';

const SEL = `SELECT r.*, u.username AS auteur,
  COALESCE((SELECT ROUND(AVG(n.etoiles), 1) FROM notations n WHERE n.recette_id = r.id), 0) AS note_moyenne,
  (SELECT COUNT(*) FROM notations n WHERE n.recette_id = r.id) AS nb_notations
  FROM recettes r
  JOIN utilisateurs u ON u.id = r.utilisateur_id
  JOIN favoris f ON f.recette_id = r.id`;

/**
 * Service de gestion des recettes favorites.
 */
class FavorisService {
  /**
   * Retourne toutes les recettes favorites d'un utilisateur.
   * @param {number} userId
   * @returns {Array}
   */
  static obtenirFavoris(userId) {
    return getDb()
      .prepare(`${SEL} WHERE f.utilisateur_id = ? ORDER BY f.cree_le DESC`)
      .all(Number(userId));
  }

  /**
   * Vérifie si une recette est en favori pour un utilisateur.
   * @param {number} userId
   * @param {number} recetteId
   * @returns {boolean}
   */
  static estFavori(userId, recetteId) {
    const row = getDb()
      .prepare('SELECT id FROM favoris WHERE utilisateur_id = ? AND recette_id = ?')
      .get(Number(userId), Number(recetteId));
    return !!row;
  }

  /**
   * Ajoute une recette aux favoris.
   * @param {number} userId
   * @param {number} recetteId
   * @returns {boolean} true si ajouté, false si déjà présent
   */
  static ajouterFavori(userId, recetteId) {
    try {
      getDb()
        .prepare('INSERT INTO favoris (utilisateur_id, recette_id) VALUES (?, ?)')
        .run(Number(userId), Number(recetteId));
      return true;
    } catch {
      return false; // UNIQUE constraint — déjà en favori
    }
  }

  /**
   * Retire une recette des favoris.
   * @param {number} userId
   * @param {number} recetteId
   * @returns {boolean}
   */
  static retirerFavori(userId, recetteId) {
    const result = getDb()
      .prepare('DELETE FROM favoris WHERE utilisateur_id = ? AND recette_id = ?')
      .run(Number(userId), Number(recetteId));
    return result.changes > 0;
  }
}

export const obtenirFavoris  = (...a) => FavorisService.obtenirFavoris(...a);
export const estFavori        = (...a) => FavorisService.estFavori(...a);
export const ajouterFavori    = (...a) => FavorisService.ajouterFavori(...a);
export const retirerFavori    = (...a) => FavorisService.retirerFavori(...a);

export default FavorisService;
