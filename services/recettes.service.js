/**
 * @file services/recettes.service.js
 * @description Service CRUD pour les recettes.
 * Utilise une classe ES6 pour encapsuler la logique métier.
 * @module services/recettes.service
 */

import { getDb } from '../database/db.js';

const SEL = `SELECT r.*, u.username AS auteur,
  COALESCE((SELECT ROUND(AVG(n.etoiles), 1) FROM notations n WHERE n.recette_id = r.id), 0) AS note_moyenne,
  (SELECT COUNT(*) FROM notations n WHERE n.recette_id = r.id) AS nb_notations
  FROM recettes r JOIN utilisateurs u ON u.id = r.utilisateur_id`;

/**
 * Service de gestion des recettes.
 * Toutes les méthodes sont statiques — pas d'état interne.
 */
class RecetteService {
  /**
   * Retourne toutes les recettes triées par date décroissante.
   * @returns {Array}
   */
  static obtenirToutesRecettes() {
    return getDb().prepare(SEL + ' ORDER BY r.cree_le DESC').all();
  }

  /**
   * Retourne une page de recettes (pagination).
   * @param {number} page - Numéro de page (commence à 1)
   * @param {number} parPage - Nombre de recettes par page
   * @returns {{ recettes: Array, total: number, page: number, totalPages: number }}
   */
  static obtenirRecettesPaginees(page = 1, parPage = 9) {
    const db = getDb();
    const total = db.prepare('SELECT COUNT(*) as n FROM recettes').get().n;
    const offset = (page - 1) * parPage;
    const recettes = db.prepare(SEL + ' ORDER BY r.cree_le DESC LIMIT ? OFFSET ?').all(parPage, offset);
    return { recettes, total: Number(total), page, totalPages: Math.ceil(Number(total) / parPage) };
  }

  /**
   * Retourne une recette par son id, ou null si absente.
   * @param {number} id
   * @returns {object|null}
   */
  static obtenirRecetteParId(id) {
    return getDb().prepare(SEL + ' WHERE r.id = ?').get(Number(id)) || null;
  }

  /**
   * Retourne toutes les recettes d'un utilisateur.
   * @param {number} userId
   * @returns {Array}
   */
  static obtenirRecettesParUtilisateur(userId) {
    return getDb().prepare(SEL + ' WHERE r.utilisateur_id = ? ORDER BY r.cree_le DESC').all(Number(userId));
  }

  /**
   * Crée une nouvelle recette après validation.
   * @param {string} titre
   * @param {string} description
   * @param {string} ingredients
   * @param {string} etapes
   * @param {string|null} imageUrl
   * @param {number} userId
   * @returns {object} La recette créée
   */
  static creerRecette(titre, description, ingredients, etapes, imageUrl, userId) {
    RecetteService._valider(titre, ingredients, etapes);
    const result = getDb().prepare(
      'INSERT INTO recettes (titre, description, ingredients, etapes, image_url, utilisateur_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(titre.trim(), description || '', ingredients.trim(), etapes.trim(), imageUrl || null, Number(userId));
    return RecetteService.obtenirRecetteParId(Number(result.lastInsertRowid));
  }

  /**
   * Modifie une recette existante. Vérifie que l'utilisateur en est le propriétaire.
   * @param {number} id
   * @param {string} titre
   * @param {string} description
   * @param {string} ingredients
   * @param {string} etapes
   * @param {string|null} imageUrl
   * @param {number} userId
   * @returns {object} La recette modifiée
   */
  static modifierRecette(id, titre, description, ingredients, etapes, imageUrl, userId) {
    RecetteService._valider(titre, ingredients, etapes);
    const db = getDb();
    const rec = db.prepare('SELECT utilisateur_id FROM recettes WHERE id = ?').get(Number(id));
    if (!rec) { const e = new Error('Ricetta non trovata.'); e.status = 404; throw e; }
    if (Number(rec.utilisateur_id) !== Number(userId)) { const e = new Error('Accesso negato.'); e.status = 403; throw e; }
    db.prepare(
      'UPDATE recettes SET titre=?, description=?, ingredients=?, etapes=?, image_url=?, modifie_le=CURRENT_TIMESTAMP WHERE id=?'
    ).run(titre.trim(), description || '', ingredients.trim(), etapes.trim(), imageUrl || null, Number(id));
    return RecetteService.obtenirRecetteParId(Number(id));
  }

  /**
   * Supprime une recette. Vérifie que l'utilisateur en est le propriétaire.
   * @param {number} id
   * @param {number} userId
   * @returns {boolean}
   */
  static supprimerRecette(id, userId) {
    const db = getDb();
    const rec = db.prepare('SELECT utilisateur_id FROM recettes WHERE id = ?').get(Number(id));
    if (!rec) { const e = new Error('Ricetta non trovata.'); e.status = 404; throw e; }
    if (Number(rec.utilisateur_id) !== Number(userId)) { const e = new Error('Accesso negato.'); e.status = 403; throw e; }
    db.prepare('DELETE FROM recettes WHERE id = ?').run(Number(id));
    return true;
  }

  /**
   * Valide les champs obligatoires d'une recette.
   * @param {string} titre
   * @param {string} ingredients
   * @param {string} etapes
   * @throws {Error} status 400 si un champ est vide
   */
  static _valider(titre, ingredients, etapes) {
    if (!titre || !titre.trim()) { const e = new Error('Il titolo è obbligatorio.'); e.status = 400; throw e; }
    if (!ingredients || !ingredients.trim()) { const e = new Error('Gli ingredienti sono obbligatori.'); e.status = 400; throw e; }
    if (!etapes || !etapes.trim()) { const e = new Error('La preparazione è obbligatoria.'); e.status = 400; throw e; }
  }
}

// Exports nommés pour compatibilité avec les controllers existants
export const obtenirToutesRecettes         = (...a) => RecetteService.obtenirToutesRecettes(...a);
export const obtenirRecettesPaginees       = (...a) => RecetteService.obtenirRecettesPaginees(...a);
export const obtenirRecetteParId           = (...a) => RecetteService.obtenirRecetteParId(...a);
export const obtenirRecettesParUtilisateur = (...a) => RecetteService.obtenirRecettesParUtilisateur(...a);
export const creerRecette                  = (...a) => RecetteService.creerRecette(...a);
export const modifierRecette               = (...a) => RecetteService.modifierRecette(...a);
export const supprimerRecette              = (...a) => RecetteService.supprimerRecette(...a);

export default RecetteService;
