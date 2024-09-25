import { pool } from '../db.js';
import jwt from 'jsonwebtoken'; 
import dotenv from 'dotenv';
import express from 'express';

// import { clave } from '../settings/keys.js';
const app = express();


// cargar las variables de entorno desde el archivo .env
dotenv.config();
// app.set('key', clave.key)
app.set('key', process.env.KEY,);

export const loginResidente = async  (req, res) =>  {
    //crea la variable usuario con lo que trae req.body.usuario y  la variable pass con lo que trae req.body.pass
    let usuario = req.body.usuario;
    let pass = req.body.pass;
 
    //usa la pool.query para ejecutar la consulta y obtener los resultados
    try {
        let [response] = await pool.query(`select * from residentes where email = ? and password = ?`, [usuario, pass]);
       // console.log(usuario, pass);
        //si los resultados son mayor a 0 quiere decir que existe un residente con esos datos
        if(response.length > 0){
            const payload ={
                check:true
            }
            const token = jwt.sign (payload, app.get('key'),{
                expiresIn: '1h'
                // expiresIn: '20s'
            })
    
    
            res.cookie('auth_token', token, {
                httpOnly: true,      // La cookie no es accesible mediante JavaScript
                secure: true,        // Solo se envía a través de HTTPS
                sameSite: 'strict'   // Protege contra CSRF
            });
            
            res.send({
                message :'successfully logged',
                token:token,
                id: response[0].id,
                nombre: response[0].nombre
            })
        }else{
            
            res.send({
                message : 'failed to login'
            })
        }
        
    } catch (error) {
        res.status(500).send({
            message: 'Error retrieving data from the database',
            error: error.message
        });
    }
}



