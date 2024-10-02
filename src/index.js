import express from 'express';
//importa la variables de entorno
import dotenv from 'dotenv';  // Importa dotenv para cargar variables de entorno
dotenv.config();  // Carga las variables de entorno en el entorno de ejecución
import cors from 'cors';  // Importa CORS
import egresados from './routes/egresados.routes.js';
import morgan from 'morgan';


const app = express();

// Configura CORS
app.use(cors({
    origin: 'https://localhost', // Permite el dominio del frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Methods'], // Encabezados permitidos
     credentials: true // Permite enviar cookies o credenciales
}));

const port = process.env.PORT || 3000;


// Manejo de solicitudes preflight (opcional si ya está configurado en `app.use(cors({...}))`)
app.options('*', cors());

//use morgan

app.use(morgan('dev'));

// Parsear el body de las peticiones a JSON
app.use(express.json());

// Configuración de las rutas
app.use('/api/', egresados);
 

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Server executing on port ${port}`);
});
