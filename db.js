const { Pool } = require('pg');

console.log('Conectando a la base de datos con:', process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Para conexiones seguras
});

module.exports = {
    query: (text, params, callback) => {
        return pool.query(text, params, callback);
    },
};