import jwt from 'jsonwebtoken';
import express from 'express';
import dotenv from 'dotenv';

// cargar las variables de entorno desde el archivo .env
dotenv.config();

const app = express();
app.set('key', process.env.KEY); // Clave secreta usada para verificar el token

export const verificacion = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];

    // Verificar si el token existe
    if (!token) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    // Si el token comienza con "Bearer ", eliminar esa parte
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length); // Elimina "Bearer " del token
    }

    // Verificar el token con la clave secreta
    jwt.verify(token, app.get('key'), (err, decoded) => {
        if (err) {
            // Si el token ha expirado
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired. Please log in again.' });
            }

            // Si el token es inválido
            return res.status(403).json({ message: 'Invalid token.' });
        }

        // Almacenar la información decodificada del token en la solicitud
        req.decoded = decoded;
        next(); // Continuar con la siguiente función o middleware
    });
};
