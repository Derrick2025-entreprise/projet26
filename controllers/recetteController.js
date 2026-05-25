import {
  obtenirRecettesPaginees,
  obtenirRecetteParId,
  creerRecette,
  modifierRecette,
  supprimerRecette,
} from '../services/recettes.service.js';
import { obtenirDonneesRecette } from '../services/notationsService.js';

export function getAccueil(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const { recettes, total, totalPages } = obtenirRecettesPaginees(page, 9);
  res.render('accueil', { titre: 'Home', recettes, page, totalPages, total });
}

export function getNouvelleRecette(req, res) {
  res.render('recette-form', { titre: 'Nuova ricetta', recette: null, erreurs: [] });
}

export function postNouvelleRecette(req, res) {
  const { titre, description, ingredients, etapes, image_url } = req.body;
  const userId = req.session.utilisateur.id;

  try {
    creerRecette(titre, description, ingredients, etapes, image_url, userId);
    res.redirect('/');
  } catch (err) {
    res.render('recette-form', {
      titre: 'Nuova ricetta',
      recette: { titre, description, ingredients, etapes, image_url },
      erreurs: [err.message],
    });
  }
}

export function getDetailRecette(req, res) {
  const recette = obtenirRecetteParId(Number(req.params.id));
  if (!recette) return res.status(404).render('erreur', { code: 404, message: 'Ricetta non trovata.' });
  const userId = req.session.utilisateur?.id || null;
  const notations = obtenirDonneesRecette(recette.id, userId);
  res.render('recette-detail', { titre: recette.titre, recette, notations });
}

export function getModifierRecette(req, res) {
  const recette = obtenirRecetteParId(Number(req.params.id));
  if (!recette) return res.status(404).render('erreur', { code: 404, message: 'Ricetta non trovata.' });

  const userId = req.session.utilisateur.id;
  if (Number(recette.utilisateur_id) !== Number(userId)) {
    return res.status(403).render('erreur', { code: 403, message: 'Accesso negato.' });
  }

  res.render('recette-form', { titre: 'Modifica ricetta', recette, erreurs: [] });
}

export function postModifierRecette(req, res) {
  const id = Number(req.params.id);
  const { titre, description, ingredients, etapes, image_url } = req.body;
  const userId = req.session.utilisateur.id;

  try {
    modifierRecette(id, titre, description, ingredients, etapes, image_url, userId);
    res.redirect(`/recettes/${id}`);
  } catch (err) {
    const status = err.status || 500;
    if (status === 403 || status === 404) {
      return res.status(status).render('erreur', { code: status, message: err.message });
    }
    const recette = obtenirRecetteParId(id) || { titre, description, ingredients, etapes, image_url };
    res.render('recette-form', { titre: 'Modifica ricetta', recette, erreurs: [err.message] });
  }
}

export function postSupprimerRecette(req, res) {
  const id = Number(req.params.id);
  const userId = req.session.utilisateur.id;

  try {
    supprimerRecette(id, userId);
    res.redirect('/');
  } catch (err) {
    const status = err.status || 500;
    res.status(status).render('erreur', { code: status, message: err.message });
  }
}
