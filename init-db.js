const sqlite3 = require('sqlite3').verbose();

// Crear o abrir la base de datos
const db = new sqlite3.Database('./newone_database.db', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Crear tablas
db.serialize(() => {
    // Tabla para ingresos
    db.run(`
        CREATE TABLE IF NOT EXISTS ingresos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            monto REAL NOT NULL,
            realizado DATE NOT NULL,
            quien TEXT NOT NULL,
            seRealizo TEXT NOT NULL,
            fotos TEXT,
            UNIQUE(nombre, realizado) -- Evitar duplicados basados en nombre y fecha
        );
    `, (err) => {
        if (err) {
            console.error('Error al crear la tabla ingresos:', err.message);
        } else {
            console.log('Tabla ingresos creada correctamente.');
        }
    });

    // Tabla para citas
    db.run(`
        CREATE TABLE IF NOT EXISTS citas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            servicio TEXT NOT NULL,
            fecha DATE NOT NULL,
            hora TEXT NOT NULL,
            UNIQUE(nombre, fecha, hora) -- Evitar duplicados basados en nombre, fecha y hora
        );
    `, (err) => {
        if (err) {
            console.error('Error al crear la tabla citas:', err.message);
        } else {
            console.log('Tabla citas creada correctamente.');
        }
    });
});

// Cerrar la conexión
db.close((err) => {
    if (err) {
        console.error('Error al cerrar la conexión con la base de datos:', err.message);
    } else {
        console.log('Conexión con la base de datos cerrada.');
    }
});