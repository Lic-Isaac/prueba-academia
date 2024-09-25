import { pool } from '../db.js';


//PUSH NOTIFICATIONS
import webpush from '../webpush.js'

export const susbscription = async  (req, res) =>  {
    
    const { subscription, usuario , rol } = req.body; 

    // console.log(subscription.endpoint)

    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ message: 'Suscripción inválida.' });
    }

    //consulta en la tabla push el usuario y extrae el campo suscripcion
    const [result] = await pool.query(`select count(suscripcion) total from push where suscripcion = ?`, [subscription.endpoint])
    
     console.log(result[0].total)
    //si result es igual a subscription entonces envia el mensaje ya existe
    if(result[0].total > 0){
        return res.status(409).json({ message: 'La suscripción ya existe.' });
    }else{

        //inserta en la tabla push en el campo usuario, suscripcion, rol las variables correspondientes
        await pool.query(`INSERT INTO push (usuario, suscripcion, rol) VALUES (?,?,?)`, [usuario, subscription.endpoint, rol])
        
        const payload = JSON.stringify({
            title: 'Notificación de prueba',
            message: 'Este es un mensaje de prueba para la notificación push.',
            // icon: 'icon.png'
        });
    
        webpush.sendNotification(subscription, payload)
        .then(() => res.status(200).json({ message: 'Notificación enviada con éxito.' }))
        .catch(err => {
            console.error('Error al enviar la notificación:', err);
            res.sendStatus(500);
        });
    }
}

export const existeSubscription = async (req, res) => {
    const endpoint  = req.body; 
 
    const [result] = await pool.query(`select * from push where suscripcion = ?`, [endpoint])
   
    if (result.length <= 0) {
        return res.status(404).json({ message: 'Suscripcion no encontrada' });  // Si no encuentra el residente, devuelve un error 404
    }else{
        return res.status(200).json({ message: 'Suscripcion encontrada', "success":true, 'endpoint':endpoint });  // Si encuentra el residente, devuelve un mensaje de éxito 200
    }
    // res.json(result);
    
}