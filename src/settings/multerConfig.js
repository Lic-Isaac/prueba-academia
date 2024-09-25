import multer from 'multer';
import path from 'path';

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../imgrecibos')); // Carpeta de destino
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Nombre del archivo
  }
});

// Inicializar multer con la configuración
const upload = multer({ storage: storage });

export default upload;
