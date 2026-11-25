require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true
  });
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    .replace(/CREATE DATABASE[\s\S]*?;/i, '')
    .replace(/^USE .*;$/im, '');
  await conn.query(sql);
  console.log('Tabelas criadas com sucesso.');
  await conn.end();
})().catch((e) => { console.error('Erro:', e.message); process.exit(1); });