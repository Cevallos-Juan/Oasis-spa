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
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Error de carga: ${err.message}` });
        } else if (err) {
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        try {
            const { nombre, monto, realizado, quien, seRealizo } = req.body;
            const fotos = req.files;

            // Validar los datos
            const error = validarIngreso({ nombre, monto, realizado, quien, seRealizo });
            if (error) {
                return res.status(400).json({ error });
            }

            // Convertir las rutas de las fotos a un formato JSON para almacenarlas en la base de datos
            const fotosPaths = fotos.map((file) => file.path);

            // Log para depuración
            console.log('Datos recibidos:', { nombre, monto, realizado, quien, seRealizo, fotosPaths });

            // Insertar los datos en la base de datos
            const query = `
                INSERT INTO ingresos (nombre, monto, realizado, quien, seRealizo, fotos)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const params = [nombre, monto, realizado, quien, seRealizo, JSON.stringify(fotosPaths)];

            db.run(query, params, function (err) {
                if (err) {
                    console.error('Error al insertar el ingreso en la base de datos:', err.message);
                    return res.status(500).json({ error: 'Error al guardar el ingreso en la base de datos.' });
                }

                // Log para depuración
                console.log('Ingreso registrado con ID:', this.lastID);

                // Respuesta exitosa
                res.status(201).json({
                    message: 'Ingreso registrado exitosamente.',
                    id: this.lastID,
                });
            });
        } catch (error) {
            console.error('Error al procesar la solicitud:', error);
            res.status(500).json({ error: 'Error interno del servidor.' });
        }
    });
});

// **2. Obtener todos los ingresos**
app.get('/api/ingresos', (req, res) => {
    const { nombre, fechaInicio, fechaFin } = req.query;

    let query = 'SELECT * FROM ingresos WHERE 1=1';
    const params = [];

    if (nombre) {
        query += ' AND nombre LIKE ?';
        params.push(`%${nombre}%`);
    }

    if (fechaInicio) {
        query += ' AND realizado >= ?';
        params.push(fechaInicio);
    }

    if (fechaFin) {
        query += ' AND realizado <= ?';
        params.push(fechaFin);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error al obtener los ingresos:', err.message);
            return res.status(500).json({ error: 'Error al obtener los ingresos.' });
        }

        res.status(200).json(rows);
    });
});

// **3. Obtener un ingreso por ID**
app.get('/api/ingresos/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM ingresos WHERE id = ?';
    db.get(query, [id], (err, row) => {
        if (err) {
            console.error('Error al obtener el ingreso:', err.message);
            return res.status(500).json({ error: 'Error al obtener el ingreso.' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Ingreso no encontrado.' });
        }

        res.status(200).json(row);
    });
});

// **4. Editar un ingreso**
app.put('/api/ingresos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, monto, realizado, quien, seRealizo } = req.body;

    const error = validarIngreso({ nombre, monto, realizado, quien, seRealizo });
    if (error) {
        return res.status(400).json({ error });
    }

    const query = `
        UPDATE ingresos
        SET nombre = ?, monto = ?, realizado = ?, quien = ?, seRealizo = ?
        WHERE id = ?
    `;
    const params = [nombre, monto, realizado, quien, seRealizo, id];

    db.run(query, params, function (err) {
        if (err) {
            console.error('Error al actualizar ingreso:', err.message);
            return res.status(500).json({ error: 'Error al actualizar el ingreso.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Ingreso no encontrado.' });
        }

        res.json({ message: 'Ingreso actualizado correctamente.' });
    });
});

// **5. Eliminar un ingreso**
app.delete('/api/ingresos/:id', (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM ingresos WHERE id = ?`;
    db.run(query, [id], function (err) {
        if (err) {
            console.error('Error al eliminar el ingreso:', err.message);
            return res.status(500).json({ error: 'Error al eliminar el ingreso.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Ingreso no encontrado.' });
        }

        res.json({ message: 'Ingreso eliminado correctamente.' });
    });
});

// **6. Registrar una cita**
app.post('/api/citas', (req, res) => {
    const { nombre, servicio, fecha, hora } = req.body;

    const error = validarCita({ nombre, servicio, fecha, hora });
    if (error) {
        return res.status(400).json({ error });
    }

    db.run(
        `INSERT INTO citas (nombre, servicio, fecha, hora) VALUES (?, ?, ?, ?)`,
        [nombre, servicio, fecha, hora],
        function (err) {
            if (err) {
                console.error('Error al registrar la cita:', err.message);
                return res.status(500).json({ error: 'Error al registrar la cita.' });
            }

            res.status(201).json({ message: 'Cita registrada correctamente.', id: this.lastID });
        }
    );
});

// **7. Obtener todas las citas**
app.get('/api/citas', (req, res) => {
    db.all('SELECT * FROM citas ORDER BY fecha, hora', [], (err, rows) => {
        if (err) {
            console.error('Error al obtener las citas:', err.message);
            return res.status(500).json({ error: 'Error al obtener las citas.' });
        }

        res.status(200).json(rows);
    });
});

// **Endpoint para obtener estadísticas semanales**
app.get('/api/estadisticas', (req, res) => {
    const query = `
        SELECT strftime('%w', realizado) AS dia, SUM(monto) AS total
        FROM ingresos
        GROUP BY dia
        ORDER BY dia;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener las estadísticas:', err.message);
            return res.status(500).json({ error: 'Error al obtener las estadísticas.' });
        }

        res.status(200).json({ porDia: rows });
    });
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
