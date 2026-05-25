import { Router } from 'express';
import { getRecherche } from '../controllers/rechercheController.js';

const router = Router();

router.get('/', getRecherche);

export default router;
