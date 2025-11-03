import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

async function run() {
  try {
    const pool = await mysql.createPool(dbUrl);
    console.log("✅ Conectat la baza de date!");

    // Șterge dacă există
    await pool.query("DROP TABLE IF EXISTS USERS;");
    console.log("🗑️ Tabela USERS ștearsă (dacă exista).");

    // Creează din nou tabela corectă
    const sql = `
      CREATE TABLE USERS (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(sql);
    console.log("✅ Tabela USERS a fost creată cu succes!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Eroare la resetarea tabelei:", err.message);
    process.exit(1);
  }
}

run();