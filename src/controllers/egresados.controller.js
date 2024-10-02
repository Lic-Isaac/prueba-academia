import { cnn } from '../db.js';
import oracledb from 'oracledb';  // Asegúrate de importar el módulo oracledb
 

export const getEgresados = async (req, res) => {
  let connection;

  try {
    // Obtener la conexión a la base de datos
    connection = await cnn();
    let respuesta = []  //arreglo a llenar
    let salida = { outFormat: oracledb.OUT_FORMAT_OBJECT } // Usar formato de salida como objeto
    // Ejecutar la consulta con el formato de salida en objeto
    const result = await connection.execute('SELECT * FROM egresados.agenda',respuesta, salida); 

    // Devolver el resultado en formato JSON
    res.json(result.rows);
  } catch (err) {
    console.error('Error al ejecutar la consulta: ', err);
    res.status(500).json({ error: 'Error al obtener los egresados' });
  } finally {
    if (connection) {
      try {
        // Cerrar la conexión
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión: ', err);
      }
    }
  }
};

export const deleteEgresados = async (req, res) => {
  let connection;
  const id = req.params.id;

  try {
    // Obtener la conexión a la base de datos
    connection = await cnn();
    
    // Ejecutar la consulta de eliminación con un parámetro de bind
    const result = await connection.execute(
      'DELETE FROM egresados.agenda WHERE ID = :id',
      { id: id }, // Parámetro de bind
      { autoCommit: true } // Hacer commit automáticamente
    );

    // Verificar si se eliminó alguna fila
    if (result.rowsAffected && result.rowsAffected > 0) {
      res.send('Eliminado correctamente');
    } else {
      res.status(404).send('No se encontró el registro con ese ID');
    }

  } catch (err) {
    console.error('Error al ejecutar la consulta: ', err);
    res.status(500).json({ error: 'Error al eliminar el registro' });
  } finally {
    if (connection) {
      try {
        // Cerrar la conexión
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión: ', err);
      }
    }
  }
};

export const insertEgresados = async (req, res) => {
  let connection;

  // Desestructuramos los valores que queremos insertar desde req.body
  const {id, nombre, telefono, direccion } = req.body;
  console.log(req.body)

  try {
    // Obtener la conexión a la base de datos
    connection = await cnn();

    // Ejecutar la consulta de inserción con parámetros de bind
    const result = await connection.execute(
      `INSERT INTO egresados.agenda (ID, NOMBRE, TELEFONO, DIRECCION) 
       VALUES (:id, :nombre, :telefono, :direccion)`,
      {
        id:id,
        nombre: nombre, // parámetro para el campo NOMBRE
        telefono: telefono, // parámetro para el campo TELEFONO
        direccion: direccion // parámetro para el campo DIRECCION
      },
      { autoCommit: true } // Hacer commit automáticamente
    );

    // Devolver el resultado
    res.status(201).json({ message: 'Registro insertado correctamente' });

  } catch (err) {
    console.error('Error al ejecutar la consulta de inserción: ', err);
    res.status(500).json({ error: 'Error al insertar el registro' });
  } finally {
    if (connection) {
      try {
        // Cerrar la conexión
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión: ', err);
      }
    }
  }
};