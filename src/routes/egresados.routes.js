import { Router } from 'express';
import { getEgresados,deleteEgresados, insertEgresados } from '../controllers/egresados.controller.js';

const router = Router();

// Aplica el middleware de verificación a todas las rutas
router.get('/egresados',  getEgresados); 
router.delete('/egresados/:id',  deleteEgresados); 
router.post('/egresados/',  insertEgresados); 
 
 

export default router;
