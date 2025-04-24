require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db'); // Importa la conexión centralizada
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const app = express();
const PORT = process.env.PORT || 3000; // Usa variables de entorno para el puerto

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));


// Configuración de multer para manejar la subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Tamaño máximo de 5 MB por archivo
}).array('fotos[]'); // Asegúrate de que el nombre coincida con el del formulario

// Función para validar datos comunes
function validarIngreso({ nombre, monto, realizado, quien, seRealizo }) {
    if (!nombre || !monto || !realizado || !quien || !seRealizo) {
        return 'Todos los campos son obligatorios.';
    }
    if (isNaN(monto) || parseFloat(monto) <= 0) {
        return 'El monto debe ser un número positivo.';
    }
    if (isNaN(Date.parse(realizado))) {
        return 'La fecha no es válida.';
    }
    return null;
}

function validarCita({ nombre, servicio, fecha, hora }) {
    if (!nombre || !servicio || !fecha || !hora) {
        return 'Todos los campos son obligatorios.';
    }
    if (isNaN(Date.parse(fecha))) {
        return 'La fecha no es válida.';
    }
    if (!/^\d{2}:\d{2}$/.test(hora)) {
        return 'La hora debe estar en formato HH:mm.';
    }
    return null;
}

// Endpoints de la API
// **1. Registrar un ingreso**
app.post('/api/ingresos', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error al subir archivos:', err.message);
            return res.status(500).json({ error: 'Error al subir archivos.' });
        }

        const { nombre, monto, realizado, quien, seRealizo } = req.body;
        const fotosPaths = req.files ? req.files.map(file => file.filename) : [];

        console.log('Datos recibidos:', { nombre, monto, realizado, quien, seRealizo, fotosPaths });

        const query = `
            INSERT INTO ingresos (nombre, monto, realizado, quien, seRealizo, fotos)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id;
        `;
        const params = [nombre, monto, realizado, quien, seRealizo, JSON.stringify(fotosPaths)];

        try {
            const result = await db.query(query, params);
            res.status(201).json({
                message: 'Ingreso registrado exitosamente.',
                id: result.rows[0].id,
            });
        } catch (error) {
            console.error('Error al insertar el ingreso en la base de datos:', error.message);
            res.status(500).json({ error: 'Error al guardar el ingreso en la base de datos.' });
        }
    });
});

// **2. Obtener todos los ingresos**
app.get('/api/ingresos', async (req, res) => {
    const { nombre } = req.query;

    try {
        let query = 'SELECT * FROM ingresos';
        const params = [];

        if (nombre) {
            query += ' WHERE LOWER(nombre) LIKE LOWER($1)';
            params.push(`%${nombre}%`);
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener los ingresos:', err.message);
        res.status(500).json({ error: 'Error al obtener los ingresos.' });
    }
});

// **3. Obtener un ingreso por ID**
app.get('/api/ingresos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('SELECT * FROM ingresos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ingreso no encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener el ingreso:', err.message);
        res.status(500).json({ error: 'Error al obtener el ingreso.' });
    }
});

// **4. Editar un ingreso**
app.put('/api/ingresos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, monto, realizado, quien, seRealizo } = req.body;

    try {
        const query = `
            UPDATE ingresos
            SET nombre = $1, monto = $2, realizado = $3, quien = $4, seRealizo = $5
            WHERE id = $6
        `;
        await db.query(query, [nombre, monto, realizado, quien, seRealizo, id]);
        res.json({ message: 'Ingreso actualizado correctamente.' });
    } catch (err) {
        console.error('Error al actualizar el ingreso:', err.message);
        res.status(500).json({ error: 'Error al actualizar el ingreso.' });
    }
});

// **5. Eliminar un ingreso**
app.delete('/api/ingresos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM ingresos WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Ingreso no encontrado.' });
        }

        res.json({ message: 'Ingreso eliminado correctamente.' });
    } catch (err) {
        console.error('Error al eliminar el ingreso:', err.message);
        res.status(500).json({ error: 'Error al eliminar el ingreso.' });
    }
});

// **6. Registrar una cita**
app.post('/api/citas', async (req, res) => {
    const { nombre, servicio, fecha, hora } = req.body;

    const error = validarCita({ nombre, servicio, fecha, hora });
    if (error) {
        return res.status(400).json({ error });
    }

    const query = `
        INSERT INTO citas (nombre, servicio, fecha, hora)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
    `;
    const params = [nombre, servicio, fecha, hora];

    try {
        const result = await db.query(query, params);
        res.status(201).json({ message: 'Cita registrada correctamente.', id: result.rows[0].id });
    } catch (err) {
        console.error('Error al registrar la cita:', err.message);
        res.status(500).json({ error: 'Error al registrar la cita.' });
    }
});

// **7. Obtener todas las citas**
app.get('/api/citas', async (req, res) => {
    try {
        const query = 'SELECT id, nombre, servicio, fecha, hora, estado FROM citas';
        const result = await db.query(query);
        res.json(result.rows); // Devolver las citas al frontend
    } catch (err) {
        console.error('Error al obtener las citas:', err.message);
        res.status(500).json({ error: 'Error al obtener las citas.' });
    }
});

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para servir la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ocurrió un error en el servidor.' });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

function verImagen(rutaFoto) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <img src="/uploads/${decodeURIComponent(rutaFoto)}" alt="Foto del ingreso" style="max-width: 100%; max-height: 100%;">
        </div>
    `;
    document.body.appendChild(modal);
}

app.get('/consultar-ingresos', (req, res) => {
    const query = 'SELECT * FROM ingresos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al consultar los ingresos:', err.message);
            return res.status(500).json({ error: 'Error al consultar los ingresos.' });
        }
        res.json(results);
    });
});

app.delete('/api/citas/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM citas WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cita no encontrada.' });
        }

        res.json({ message: 'Cita eliminada correctamente.' });
    } catch (err) {
        console.error('Error al eliminar la cita:', err.message);
        res.status(500).json({ error: 'Error al eliminar la cita.' });
    }
});

// Ruta para actualizar una cita
app.put('/api/citas/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, servicio, fecha, hora, estado } = req.body;

    try {
        // Obtener la cita existente
        const citaExistente = await db.query('SELECT * FROM citas WHERE id = $1', [id]);
        if (citaExistente.rowCount === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        // Actualizar solo los campos enviados
        const citaActualizada = {
            nombre: nombre || citaExistente.rows[0].nombre,
            servicio: servicio || citaExistente.rows[0].servicio,
            fecha: fecha || citaExistente.rows[0].fecha,
            hora: hora || citaExistente.rows[0].hora,
            estado: estado || citaExistente.rows[0].estado,
        };

        // Actualizar en la base de datos
        await db.query(
            'UPDATE citas SET nombre = $1, servicio = $2, fecha = $3, hora = $4, estado = $5 WHERE id = $6',
            [citaActualizada.nombre, citaActualizada.servicio, citaActualizada.fecha, citaActualizada.hora, citaActualizada.estado, id]
        );

        res.json({ message: 'Cita actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar la cita:', error);
        res.status(500).json({ error: 'Error al actualizar la cita' });
    }
});

// Obtener los datos de una cita específica
app.get('/api/citas/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'SELECT id, nombre, servicio, fecha, hora, estado FROM citas WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cita no encontrada.' });
        }

        res.json(result.rows[0]); // Devolver los datos de la cita
    } catch (err) {
        console.error('Error al obtener la cita:', err.message);
        res.status(500).json({ error: 'Error al obtener la cita.' });
    }
});

app.get('/api/estadisticas', async (req, res) => {
    try {
        const query = `
            SELECT 
                TO_CHAR(realizado, 'YYYY-MM-DD') AS fecha,
                SUM(monto) AS total
            FROM ingresos
            GROUP BY TO_CHAR(realizado, 'YYYY-MM-DD')
            ORDER BY fecha;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener las estadísticas:', err.message);
        res.status(500).json({ error: 'Error al obtener las estadísticas.' });
    }
});

app.get('/api/ingresos-semana', async (req, res) => {
    try {
        const query = `
            SELECT fecha, monto
            FROM ingresos
            WHERE fecha >= DATEADD(DAY, -7, GETDATE()) AND fecha <= GETDATE();
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener los ingresos de la semana:', err.message);
        res.status(500).json({ error: 'Error al obtener los ingresos de la semana.' });
    }
});
