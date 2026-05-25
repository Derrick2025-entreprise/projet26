import { rechercherRecettes } from '../services/rechercheService.js';

export function getRecherche(req, res) {
  const motCle = req.query.q || '';
  const recettes = rechercherRecettes(motCle);
  res.render('recherche', { titre: 'Recherche', recettes, motCle });
}
