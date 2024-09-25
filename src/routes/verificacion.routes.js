import { Router } from 'express';  
import { verificacion } from '../controllers/verificacion.controller.js';

export const verificacionToken = Router();

// Definir la ruta GET para /info
verificacionToken.get('/', verificacion);  // Usar '/' en lugar de '/info' porque en index.js ya estás usando '/info'
