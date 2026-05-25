import { Router } from 'express';
import {
  getInscription,
  postInscription,
  getConnexion,
  postConnexion,
  getDeconnexion,
} from '../controllers/authController.js';

const router = Router();

router.get('/inscription', getInscription);
router.post('/inscription', postInscription);

router.get('/connexion', getConnexion);
router.post('/connexion', postConnexion);

router.get('/deconnexion', getDeconnexion);

export default router;
