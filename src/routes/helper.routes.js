import { Router } from 'express';
import { bancos, fecha, tipoPropiedad,categoriaResidente } from '../controllers/helper.controller.js';
import { verificacion } from '../controllers/verificacion.controller.js'; // Asegúrate de que la ruta del archivo sea correcta

const router = Router();

// Aplica el middleware de verificación a todas las rutas
router.get('/bancos', verificacion, bancos); 
router.get('/fecha', verificacion, fecha); 
router.get('/tipoDePropiedad', verificacion, tipoPropiedad); 
router.get('/tipoDeResidente', verificacion, categoriaResidente); 

export default router;
