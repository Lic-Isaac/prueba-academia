import { Router } from 'express'; 
import { loginResidente } from '../controllers/login.controller.js';

//crea una variable router y en la siguiente linea exportalo
export const routerLogin = Router();
routerLogin.post('/login',loginResidente) 
 


