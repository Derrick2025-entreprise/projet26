import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import recettesRoutes from './routes/recettes.js';
import rechercheRoutes from './routes/recherche.js';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'votre-secret-key-changez-moi',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Routes
app.use('/auth', authRoutes);
app.use('/recettes', recettesRoutes);
app.use('/recherche', rechercheRoutes);
app.use('/api', apiRoutes);

// Page d'accueil
app.get('/', (req, res) => {
  res.redirect('/recettes');
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).render('erreur', {
    message: 'Page non trouvée',
    utilisateur: req.session.utilisateur
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});

export default app;
