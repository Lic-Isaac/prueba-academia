import { pool } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getResidentes = async (req, res) =>  {
    const [result] = await pool.query(`SELECT r.id,r.nombre,r.condominio,r.email, ctp.descripcion, ctprop.descripcion propiedad
    FROM residentes r, cat_tiporesidente ctp, cat_tipoprop ctprop
    WHERE r.categoria = ctp.id
    AND r.tipoprop = ctprop.id 
    AND ctp.descripcion = 'PROPIETARIO'
    ORDER BY r.id`)
    res.json(result);
}

export const getResidente = async (req, res) =>  {
    const { id } = req.params;
    const [result] = await pool.query(`select * from residentes where id = ?`, [id])
   
    if (result.length <= 0) {
        return res.status(404).json({ message: 'Residente no encontrado' });  // Si no encuentra el residente, devuelve un error 404
    }
    res.json(result);
}

export const getResidenteProperties = async (req, res) =>  {
    const { email } = req.params;
    const [result] = await pool.query(`select * from residentes where email = ?`, [email])
   
    if (result.length <= 0) {
        return res.status(404).json({ message: 'Residente no encontrado' });  // Si no encuentra el residente, devuelve un error 404
    }
    res.json(result);
}

export const getSaldoUnResidente = async (req, res) =>  {
    const { id } = req.params;
    const [result] = await pool.query(`SELECT 
    r.id, 
    r.nombre AS residente,
    SUM(p.cargo) AS total_cargos,
    SUM(p.abono) AS total_abonos,
    (SUM(ifnull(p.cargo,0)) - SUM(ifnull(p.abono,0))) AS saldo
    FROM 
        pagos p
    JOIN 
        residentes r ON p.id_residente = r.id
    WHERE 
        p.eliminado = 0  -- Solo pagos no eliminados
        AND r.id = ?
    GROUP BY 
        r.id, r.nombre
    ORDER BY 
        saldo DESC;`, [id])
   
    if (result.length <= 0) {
        return res.status(404).json({ message: 'Residente no encontrado' });  // Si no encuentra el residente, devuelve un error 404
    }
    res.json(result);
}

export const getCuotasResidente = async (req, res) =>  {
    const { id } = req.params;
    const [result] = await pool.query(`SELECT p.id, p.idcuota, p.adeudo, c.concepto
    FROM pagos_detalles p , cuotas c
    WHERE p.id_residente = ?
    and p.idcuota = c.id 
    and p.estatus = 0 `, [id])
   
    if (result.length <= 0) {
        return res.status(404).json({ message: 'Residente no encontrado' });  // Si no encuentra el residente, devuelve un error 404
    }
    res.json(result);
}

export const guardaPagoResidente = async  (req, res) =>  {
    try {
        const { usuario, fpago, observacion, cant_efectivo, idResidente, condominio, cuotasPagadas, bancos } = req.body;
        const fecha_actual = new Date().toISOString().split('T')[0]; // Obtener la fecha actual

        // Manejo de archivo
        if (req.file) {
            const archivo = req.file;
            const nom_arch = archivo.originalname;
            const target_path = path.join(__dirname, '../../imgrecibos', nom_arch);

            // Verifica que el archivo no esté vacío
            if (archivo.size > 0) {
                // Mueve el archivo al destino final
                fs.renameSync(archivo.path, target_path);

                // Opcional: Verifica el archivo en el destino
                if (fs.existsSync(target_path)) {
                    console.log('Archivo guardado correctamente en:', target_path);
                } else {
                    console.error('El archivo no se ha guardado correctamente.');
                }
            } else {
                console.error('El archivo cargado está vacío.');
            }
        }

        let numRecibo = '';
        let importeTotal = 0;
        let conceptoDelPago = "Pago de : ";

        // Obtener el año actual
        const [rowYear] = await pool.query("SELECT YEAR(NOW()) AS anioActual");
        const anioActual = rowYear[0].anioActual;

        // Procesar cuotas pagadas
        for (let cuota of JSON.parse(cuotasPagadas)) {
            const { id, cantidad } = cuota;

            let codigo = id
            let pago = cantidad

            importeTotal += pago;

            // Obtener concepto de la cuota
            const [rowConcepto] = await pool.query("SELECT concepto FROM cuotas WHERE id = ?", [codigo]);
            conceptoDelPago = `${rowConcepto[0].concepto}, [${condominio}]`;
            const conceptoPagoRecibo = `${rowConcepto[0].concepto}, `;

            // Obtener el último recibo
            const [rowRecibo] = await pool.query("SELECT LAST_INSERT_ID(id) as last FROM recibos ORDER BY id DESC LIMIT 0,1");
            const nRecibo = rowRecibo[0].last + 1;
            numRecibo = `${nRecibo}-${anioActual}`;

            // Afectar a todos los residentes del condominio
            const [rowResidentes] = await pool.query("SELECT id, email FROM residentes WHERE condominio = ?", [condominio]);
            for (let rowResidente of rowResidentes) {
                const { id: idDeResidente, email } = rowResidente;

                // Insertar pago
                await pool.query(
                    `INSERT INTO pagos (id_residente, idcuota, abono, usuario_cobra, validado,  num_recibo, condominio, email)
                     VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,

                    [idDeResidente, codigo, pago, usuario, numRecibo, condominio, email]
                );

                // Actualizar adeudo
                await pool.query(
                    "UPDATE pagos_detalles SET adeudo = adeudo - ?, estatus = 1 WHERE id_residente = ? AND idcuota = ? and estatus = 0",
                    [pago, idDeResidente, codigo]
                );
            }
        }

        const concepto = conceptoDelPago.slice(0, -1);

        // Insertar recibo
        await pool.query(
            `INSERT INTO recibos (num_recibo, usuario, fecha_emision, concepto, observaciones, pago)
             VALUES (?, ?, ?, ?, ?, ?)`,

            [numRecibo, usuario, fpago, conceptoDelPago, observacion.toUpperCase(), importeTotal]
        );

        // Insertar en efectivo si aplica
        if (cant_efectivo && cant_efectivo != '0') {
            await pool.query(
                `INSERT INTO efectivo (concepto, entrada, usuario_cobra, recibo)
                 VALUES (?, ?, ?, ?)`,

                [concepto, cant_efectivo, usuario, numRecibo]
            );
        }

        // Insertar en banco si aplica
        for (let fila of JSON.parse(bancos)) {
            const { cuentaBancaria: nocuenta, cantCuenta: cantDePago } = fila;
            if (nocuenta && cantDePago && cantDePago != '0') {
                await pool.query(
                    `INSERT INTO mov_bancos (num_cuenta, concepto, entrada, usuario_cobra, recibo)
                     VALUES (?, ?, ?, ?, ?)`,

                    [nocuenta, concepto, cantDePago, usuario, numRecibo]
                );
            }
        }

        // Insertar en estado de cuenta del condominio
        await pool.query(
            `INSERT INTO edo_cuenta_condominio (concepto, fecha_movimiento, entradas, recibo)
             VALUES (?, ?, ?, ?)`,

            [concepto, fecha_actual, importeTotal, numRecibo]
        );

        res.status(200).json({ message: "success" });

    } catch (error) {
        console.error("Error al procesar el pago: ", error);
        res.status(500).json({ error: "Hubo un error al procesar el pago" });
    }
}

export const guardarNuevaProp = async  (req, res) =>  {
    try { 
        // Obtenemos los datos desde el request body
        const { tipoPropiedad, codigoProp, id } = req.body;

        // Verifica si ya existe un condominio con ese código
        const [rows] = await pool.query(
            'SELECT COUNT(condominio) AS total FROM residentes WHERE condominio = ?',
            [codigoProp]
        );
        const total = rows[0].total;

        // Si ya existe el condominio, enviamos un error
        if (total > 0) {
            return res.status(400).json({ error: 'El condominio ya existe' });
        }

        // Obtener datos del residente por ID
        const [residentData] = await pool.query(
            'SELECT nombre, direccion, ciudad, telefono, email, password, categoria FROM residentes WHERE id = ?',
            [id]
        );

        if (residentData.length === 0) {
            return res.status(404).json({ error: 'Residente no encontrado' });
        }

        const { nombre, direccion, ciudad, telefono, email, password, categoria } = residentData[0];

        // Insertar la nueva propiedad del residente
        await pool.query(
            'INSERT INTO residentes (nombre, direccion, ciudad, telefono, email, password, categoria, condominio, tipoprop) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre, direccion, ciudad, telefono, email, password, categoria, codigoProp, tipoPropiedad]
        );

        // Responder con éxito
        res.status(200).json({ message: 'success' });
    } catch (error) {
        console.error('Error al agregar el residente:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
}

export const updateResidentes = async  (req, res) =>  {
    try {
        const { idResidente, nombre, direccion, ciudad, Ncondominio, telefono, Nemail, Ncategoria, Npropiedad, estacionamiento } = req.body;     

        // Actualizar la información del residente
        const query = `UPDATE residentes SET nombre = ?,direccion = ?,ciudad = ?,condominio = ?,telefono = ?,email = ?,
                        categoria = ?,tipoprop = ?,cajon = ? WHERE id = ?`;

        const values = [ nombre, direccion, ciudad, Ncondominio, telefono, Nemail, Ncategoria, Npropiedad, estacionamiento, idResidente ];

        // Ejecutar la consulta de actualización del residente
        await pool.query(query, values);

        // Actualizar el email en la tabla 'pagos'
        const updateEnPagos = ` UPDATE pagos SET email = ? WHERE id_residente = ?`; 
        await pool.query(updateEnPagos, [Nemail, idResidente]);

        // Actualizar el email en la tabla 'pagos_detalles'
        const updateEnPagosDetalles = `UPDATE pagos_detalles SET email = ? WHERE id_residente = ?`;
        await pool.query(updateEnPagosDetalles, [Nemail, idResidente]);

        res.status(200).json({ message: 'success' });
    } catch (error) {
        console.error("Error al actualizar residente:", error);
        res.status(500).json({ message: 'Error al actualizar el residente.' });
    }
}

export const getArrendatario = async (req, res) =>  {
    const { condominio } = req.params; 
   
    const [result] = await pool.query(`select id,nombre,direccion,ciudad,condominio,telefono,email,password from residentes where condominio = ? and categoria = 3`, [condominio])
   
    if (result.length <= 0) {
        return res.status(200).json({ message: 'vacio' });  // Si no encuentra el residente, devuelve un error 404
    }
    res.json(result);
}

export const updateArrendatario = async (req, res) =>  {
    const { condominioArr, idResidenteArr } = req.body;
 
    console.log(condominioArr, idResidenteArr)
    //cambia: const [result] = await pool.query(`select nombre,direccion,ciudad,condominio,telefono,email,password from residentes where condominio = ? and categoria = 3`, [condominio]) a un update
    await pool.query(`UPDATE residentes SET nombre =?, direccion =?, ciudad =?, telefono =?, email =?, password =? WHERE condominio =? and categoria = 3 and id = ?`, [req.body.nombreArr, req.body.direccionArr, req.body.ciudadArr, req.body.telefonoArr, req.body.emailArr, req.body.claveArr, req.body.condominioArr, idResidenteArr])
   
    res.status(200).json({ message:'success' }); 
}

export const getEdoCuentaResidete = async (req, res) =>  {
    // res.send('Estado de cuenta del residente')
    const { id } = req.params; 
   
    await pool.query(`CALL generarEstadoCuenta(?) `, [id])
    const [result] = await pool.query(`SELECT p.id, c.concepto, p.fregistro, IFNULL(p.abono,0)abono, IFNULL(p.cargo,0)cargo, IFNULL(p.saldo,0)saldo 
        FROM pagos p, cuotas c
        WHERE p.id_residente = ?
        AND p.idcuota = c.id
        and p.eliminado = 0
        ORDER BY p.id DESC`, [id])

   
    if (result.length <= 0) {
        return res.status(200).json({ message: 'vacio' });  // Si no encuentra el residente, devuelve un error 404
    }
    res.json(result);
}


export const deleteResidentes = async  (req, res) =>  {
    res.send('Eliminando residente')
}