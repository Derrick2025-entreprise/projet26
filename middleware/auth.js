/**
 * @file middleware/auth.js
 * @description Middleware de protection des routes authentifiées.
 *
 * Vérifie la présence d'un utilisateur en session.
 * Si absent, redirige vers /connexion au lieu de retourner une erreur 401,
 * ce qui offre une meilleure expérience utilisateur pour une application web classique.
 *
 * Usage dans les routes :
 * @example
 * import { requireAuth } from '../middleware/auth.js';
 * router.get('/recettes/nouvelle', requireAuth, getNouvelleRecette);
 *
 * @module middleware/auth
 */

/**
 * Middleware Express qui protège une route contre les accès non authentifiés.
 * Passe au middleware suivant si l'utilisateur est connecté,
 * sinon redirige vers la page de connexion.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.utilisateur) {
    return next();
  }
  res.redirect('/connexion');
}
