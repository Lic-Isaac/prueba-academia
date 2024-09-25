import { Router } from 'express';
import { susbscription, existeSubscription } from '../controllers/notifications.controller.js'
const router = Router();

// Aplica el middleware de verificación a todas las rutas
router.post('/suscripcion',  susbscription); 
router.get('/suscripcion/:endpoint',  existeSubscription); 

export default router;
