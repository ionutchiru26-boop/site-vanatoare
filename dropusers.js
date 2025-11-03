import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

async function run() {
  try {
    const pool = await mysql.createPool(dbUrl);
    console.log("✅ Conectat la baza de date!");

    await pool.query("DROP TABLE IF EXISTS USERS;");
    console.log("🗑️ Tabela USERS a fost ștearsă cu succes!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Eroare la ștergerea tabelei:", err.message);
    process.exit(1);
  }
}

run();
