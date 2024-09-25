import { Router } from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getResidentes, getResidente, getSaldoUnResidente, guardaPagoResidente,getEdoCuentaResidete,updateArrendatario,getResidenteProperties,getArrendatario, getCuotasResidente, guardarNuevaProp, updateResidentes, deleteResidentes } from '../controllers/residentes.controller.js';
import { verificacion } from '../controllers/verificacion.controller.js'; // Asegúrate de que la ruta del archivo sea correcta

const router = Router();

// Obtener el directorio del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración del almacenamiento de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, join(__dirname, '../../imgrecibos')); // Carpeta de destino
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Nombre del archivo
    }
});

// Inicializar multer con la configuración
const upload = multer({ storage: storage });

// Aplica el middleware de verificación a todas las rutas
router.get('/residentes', verificacion, getResidentes);
router.get('/residentes/:id', verificacion, getResidente);
router.get('/saldoResidente/:id', verificacion, getSaldoUnResidente);
router.get('/cuotasResidente/:id', verificacion, getCuotasResidente);
router.get('/propiedadesResidentes/:email', verificacion, getResidenteProperties);
router.get('/arrendatario/:condominio', verificacion, getArrendatario);
router.get('/estadoDeCuentaResidente/:id', verificacion, getEdoCuentaResidete);

// Usar multer para manejar archivos en esta ruta
router.post('/guardaPagoResidente', verificacion, upload.single('archivo'), guardaPagoResidente); // Nota el uso de `upload.single('archivo')`
router.post('/nuevaPropiedad', verificacion, guardarNuevaProp);

router.put('/residentes/:id', verificacion, updateResidentes);
router.put('/actualizaArrendatario/:condominio', verificacion, updateArrendatario);


router.delete('/residentes', verificacion, deleteResidentes);

export default router;
