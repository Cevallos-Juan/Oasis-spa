const { Pool } = require('pg');

// Verificar que las variables de entorno estén configuradas
if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error('Error: Faltan variables de entorno para la conexión a la base de datos.');
    process.exit(1); // Salir del proceso si faltan variables
}

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Probar la conexión al inicializar
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.stack);
    } else {
        console.log('Conexión exitosa a la base de datos');
        release(); // Liberar el cliente
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};