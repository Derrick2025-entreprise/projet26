import { inscrireUtilisateur, connecterUtilisateur } from '../services/authService.js';

export async function getInscription(req, res) {
  res.render('inscription', { erreurs: [], valeurs: {} });
}

export async function postInscription(req, res) {
  const { username, email, mot_de_passe } = req.body;
  const erreurs = [];

  if (!username) erreurs.push("Il nome utente è obbligatorio.");
  if (!email)    erreurs.push("L'indirizzo email è obbligatorio.");
  if (!mot_de_passe) erreurs.push('La password è obbligatoria.');

  if (erreurs.length > 0) {
    return res.render('inscription', { erreurs, valeurs: { username, email } });
  }

  try {
    const utilisateur = await inscrireUtilisateur(username, email, mot_de_passe);
    req.session.utilisateur = utilisateur;
    res.redirect('/');
  } catch (err) {
    res.render('inscription', { erreurs: [err.message], valeurs: { username, email } });
  }
}

export async function getConnexion(req, res) {
  res.render('connexion', { erreur: null });
}

export async function postConnexion(req, res) {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.render('connexion', { erreur: 'Compila tutti i campi.' });
  }

  try {
    const utilisateur = await connecterUtilisateur(email, mot_de_passe);
    if (!utilisateur) {
      return res.render('connexion', { erreur: 'Credenziali non valide.' });
    }
    req.session.utilisateur = utilisateur;
    res.redirect('/');
  } catch (err) {
    res.render('connexion', { erreur: 'Si è verificato un errore.' });
  }
}

export function getDeconnexion(req, res) {
  req.session.destroy(() => {
    res.redirect('/');
  });
}
