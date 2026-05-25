/**
 * @file services/rechercheService.js
 * @description Service de recherche de recettes par mot-clé.
 * Utilise une classe ES6 pour encapsuler la logique métier.
 * @module services/rechercheService
 */

import { getDb } from '../database/db.js';
import { obtenirToutesRecettes } from './recettes.service.js';

/**
 * Service de recherche.
 * Recherche insensible à la casse sur le titre et la description.
 */
class RechercheService {
  /**
   * Recherche des recettes par mot-clé.
   * Si le mot-clé est vide, retourne toutes les recettes.
   * @param {string} motCle - Terme de recherche
   * @returns {Array} Liste des recettes correspondantes
   */
  static rechercherRecettes(motCle) {
    if (!motCle || !motCle.trim()) {
      return obtenirToutesRecettes();
    }
    const pattern = '%' + motCle.trim() + '%';
    return getDb().prepare(
      `SELECT r.*, u.username AS auteur,
        COALESCE((SELECT ROUND(AVG(n.etoiles), 1) FROM notations n WHERE n.recette_id = r.id), 0) AS note_moyenne,
        (SELECT COUNT(*) FROM notations n WHERE n.recette_id = r.id) AS nb_notations
       FROM recettes r
       JOIN utilisateurs u ON u.id = r.utilisateur_id
       WHERE LOWER(r.titre) LIKE LOWER(?)
          OR LOWER(r.description) LIKE LOWER(?)
       ORDER BY r.cree_le DESC`
    ).all(pattern, pattern);
  }
}

// Export nommé pour compatibilité avec le controller existant
export const rechercherRecettes = (...a) => RechercheService.rechercherRecettes(...a);

export default RechercheService;
