import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getNouvelleRecette,
  postNouvelleRecette,
  getDetailRecette,
  getModifierRecette,
  postModifierRecette,
  postSupprimerRecette,
} from '../controllers/recetteController.js';

const router = Router();

router.get('/nouvelle', requireAuth, getNouvelleRecette);
router.post('/', requireAuth, postNouvelleRecette);
router.get('/:id', getDetailRecette);
router.get('/:id/modifier', requireAuth, getModifierRecette);
router.post('/:id/modifier', requireAuth, postModifierRecette);
router.post('/:id/supprimer', requireAuth, postSupprimerRecette);

export default router;
