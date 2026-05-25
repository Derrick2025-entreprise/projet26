/**
 * @file controllers/favorisController.js
 * @description Contrôleur pour la page "Mes favoris".
 * @module controllers/favorisController
 */

import { obtenirFavoris } from '../services/favorisService.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * GET /favoris — Page des recettes favorites de l'utilisateur connecté.
 */
export function getFavoris(req, res, next) {
  if (!req.session.utilisateur) return res.redirect('/connexion');
  const favoris = obtenirFavoris(req.session.utilisateur.id);
  res.render('mes-favoris', { titre: 'Mes favoris', favoris });
}
