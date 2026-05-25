/**
 * @file routes/api.js
 * @description Routes API JSON pour l'autocomplete et les favoris.
 * Utilisées par le client via fetch (pas de rechargement de page).
 * @module routes/api
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { rechercherRecettes } from '../services/rechercheService.js';
import { obtenirFavoris, estFavori, ajouterFavori, retirerFavori } from '../services/favorisService.js';
import { enregistrerNotation, obtenirDonneesRecette } from '../services/notationsService.js';

const router = Router();

/* -------------------------------------------------------
   GET /api/recherche?q=mot  — Autocomplete (JSON)
   Retourne max 6 suggestions de recettes.
   ------------------------------------------------------- */
router.get('/recherche', (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);

  const resultats = rechercherRecettes(q).slice(0, 6).map(r => ({
    id:          r.id,
    titre:       r.titre,
    auteur:      r.auteur,
    image_url:   r.image_url || null,
  }));
  res.json(resultats);
});

/* -------------------------------------------------------
   GET /api/favoris  — Liste des favoris (JSON)
   ------------------------------------------------------- */
router.get('/favoris', requireAuth, (req, res) => {
  const favoris = obtenirFavoris(req.session.utilisateur.id);
  res.json(favoris);
});

/* -------------------------------------------------------
   POST /api/favoris/:id  — Ajouter un favori
   ------------------------------------------------------- */
router.post('/favoris/:id', requireAuth, (req, res) => {
  const recetteId = Number(req.params.id);
  const userId    = req.session.utilisateur.id;
  const ajoute    = ajouterFavori(userId, recetteId);
  const favori    = estFavori(userId, recetteId);
  res.json({ favori, ajoute });
});

/* -------------------------------------------------------
   DELETE /api/favoris/:id  — Retirer un favori
   ------------------------------------------------------- */
router.delete('/favoris/:id', requireAuth, (req, res) => {
  const recetteId = Number(req.params.id);
  const userId    = req.session.utilisateur.id;
  retirerFavori(userId, recetteId);
  res.json({ favori: false });
});

/* -------------------------------------------------------
   GET /api/favoris/:id/statut  — Statut d'un favori
   ------------------------------------------------------- */
router.get('/favoris/:id/statut', requireAuth, (req, res) => {
  const recetteId = Number(req.params.id);
  const userId    = req.session.utilisateur.id;
  res.json({ favori: estFavori(userId, recetteId) });
});

/* -------------------------------------------------------
   GET /api/notations/:id  — Stats et avis d'une recette
   ------------------------------------------------------- */
router.get('/notations/:id', (req, res) => {
  const recetteId = Number(req.params.id);
  const userId    = req.session.utilisateur?.id || null;
  const donnees   = obtenirDonneesRecette(recetteId, userId);
  res.json({
    moyenne:     donnees.stats.moyenne,
    nombre:      donnees.stats.nombre,
    maNotation:  donnees.maNotation
      ? { etoiles: donnees.maNotation.etoiles, suggestion: donnees.maNotation.suggestion }
      : null,
    avis: donnees.avis.map(a => ({
      etoiles:    a.etoiles,
      suggestion: a.suggestion,
      auteur:     a.auteur,
      cree_le:    a.cree_le,
    })),
  });
});

/* -------------------------------------------------------
   POST /api/notations/:id  — Noter une recette (étoiles + suggestion)
   ------------------------------------------------------- */
router.post('/notations/:id', requireAuth, (req, res) => {
  const recetteId = Number(req.params.id);
  const userId    = req.session.utilisateur.id;
  const { etoiles, suggestion } = req.body;

  try {
    const notation = enregistrerNotation(userId, recetteId, etoiles, suggestion);
    const donnees  = obtenirDonneesRecette(recetteId, userId);
    res.json({
      ok: true,
      notation: { etoiles: notation.etoiles, suggestion: notation.suggestion },
      moyenne:  donnees.stats.moyenne,
      nombre:   donnees.stats.nombre,
    });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, message: err.message });
  }
});

export default router;
