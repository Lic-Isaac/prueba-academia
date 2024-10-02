import oracledb from 'oracledb';
import dotenv from 'dotenv';

// cargar las variables de entorno desde el archivo .env
dotenv.config();

export async function cnn() {
  let connection;

  try {
    // Conexión a la base de datos
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,       // Usuario de la base de datos
      password: process.env.DB_PASSWORD,   // Contraseña de la base de datos
      connectString: process.env.DB_HOST  // String de conexión a la base de datos
    });

    console.log('Conexión exitosa a la base de datos Oracle!');
    return connection; // Retornar la conexión

  } catch (err) {
    console.error('Error en la conexión: ', err);
    throw err; // Lanzar error para manejarlo en el controlador si es necesario
  }
}
