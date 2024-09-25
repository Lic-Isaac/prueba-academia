import { pool } from '../db.js';

export const bancos = async (req, res) =>  {
    const [result] = await pool.query(`SELECT num_cuenta FROM cat_bancos WHERE estatus = 1`)
    res.json(result);
}

export const fecha = async (req, res) =>  {
    const [result] = await pool.query(`SELECT DATE_FORMAT(SYSDATE(), '%Y-%m-%d') AS fecha FROM dual`);
    res.json(result);
}

export const tipoPropiedad = async (req, res) =>  {
    const [result] = await pool.query(`SELECT * FROM cat_tipoprop`);
    res.json(result);
}

export const categoriaResidente = async (req, res) =>  {
    const [result] = await pool.query(`SELECT * FROM cat_tiporesidente`);
    res.json(result);
}

